const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const axios = require('axios');

const appConfigs = require('../configs/AppConfigs');
const { Logger, formatBkkTime } = require('../utilities/Utils');

const logger = Logger('GoogleSheetService');
const MAX_RETRIES = 5;
const MAX_BACKOFF_MS = 64000; // 64 seconds
const INITIAL_BACKOFF_MS = 1000; // 1 second

class GoogleSheetService {
    constructor() {
        logger.info("starting GoogleSheetService");
        this.SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
        this.connected = false;
        this.activeSheet = null;
        this.targetSheetid = null;
        this.columnMapping = null;
        this.hostIp = null;

        // Bind all methods to the class
        Object.getOwnPropertyNames(GoogleSheetService.prototype).forEach(key => {
            if (typeof this[key] === 'function') {
                this[key] = this[key].bind(this);
            }
        });
    }

    /**
     * Fetches the server public IP from https://api.ipify.org
     * @returns {Promise<void>}
     * @private
    */
    async initializeHostIp() {
        try {
            logger.info('Fetching server public IP...');
            const response = await axios.get('https://api.ipify.org?format=json');
            this.hostIp = String(response.data.ip);
            logger.info(`Server public IP: ${this.hostIp}`);
            logger.debug(`the server public IP is ${this.hostIp} type of ${typeof this.hostIp}`);
            logger.debug(`the appConfigs.appHost is ${appConfigs.appHost} type of ${typeof appConfigs.appHost}`);
        } catch (error) {
            logger.error('Failed to fetch server public IP:', error);
            this.hostIp = null;
        }
    }

    initializeAuth() {
        const creds = require(appConfigs.googleSheet.pathToServiceAccount);
        this.serviceAccount = new JWT({
            email: creds.client_email,
            key: creds.private_key,
            scopes: this.SCOPES,
        });
    }

    initializeLogColumns() {
        // Define log columns with clear mapping to request/response fields
        this.logColumns = [
            'server-host-ip',
            'running-environment',
            'request-timestamp',
            'request-ip',
            'request-method',
            'request-path',
            'request-headers',
            'request-parameters',
            'request-query',
            'request-body',
            'response-timestamp',
            'response-header',
            'response-status',
            'response-message',
            'response-data',
            'processing-duration-ms'
        ];

        this.columnMapping = {
            'server-host-ip': 'serverHostIp',
            'running-environment': 'runningEnvironment',
            'request-timestamp': 'requestTimestamp',
            'request-ip': 'requestIp',
            'request-method': 'requestMethod',
            'request-path': 'requestPath',
            'request-headers': 'requestHeaders',
            'request-parameters': 'requestParameters',
            'request-query': 'requestQuery',
            'request-body': 'requestBody',
            'response-timestamp': 'responseTimestamp',
            'response-header': 'responseHeader',
            'response-status': 'responseStatus',
            'response-message': 'responseMessage',
            'response-data': 'responseData',
            'processing-duration-ms': 'processingDurationMs'
        };
    }

    /**
     * Initializes the GoogleSheetService by verifying environment variables, setting up
     * authentication, selecting the active sheet and setting up the log columns.
     * @returns {Promise<boolean>} true if initialization was successful, false otherwise.
     */
    async init() {
        logger.info('GoogleSheetService initializing...');
        this.connected = false;

        try {
            // Wait for IP initialization
            if (!this.hostIp) {
                await this.initializeHostIp();
            }

            // Only initialize if in production environment
            if (!this._verifyEnvironment()) {
                logger.warn('GoogleSheetService initialization skipped in non-production environment');
                this.connected = false;
                return true;
            }

            this.initializeAuth();
            this.initializeLogColumns();

            if (!this.serviceAccount) {
                logger.warn('GoogleSheet authentication not initialized');
                this.connected = false;
                return false;
            }

            await this._initializeSpreadsheet();
            await this.setActiveSheet();
            if (!this.activeSheet) {
                logger.error('Failed to set active sheet');
                this.connected = false;
                return false;
            }

            this.targetSheetid = this.activeSheet?.sheetId;
            logger.debug(`metadata: ${JSON.stringify(await this.metadata())}`);
            this.connected = true;
            logger.info('GoogleSheetService successfully initialized');
            return true;
        } catch (error) {
            logger.error('Failed to initialize GoogleSheetService:', error);
            this.connected = false;
            return false;
        }
    }

    async metadata() {
        logger.info("loading metadata");
        return {
            connected: this.connected,
            SpreadSheet: {
                metadata: {
                    id: this.doc.spreadsheetId,
                    name: this.doc.title,
                    local: this.doc.locale,
                    timeZone: this.doc.timeZone,
                    autoRecalc: this.doc.autoRecalc,
                    defaultFormat: JSON.stringify(this.doc.defaultFormat).substring(0, 100) + "...[truncated]...",
                    spreadsheetTheme: JSON.stringify(this.doc.spreadsheetTheme).substring(0, 100) + "...[truncated]...",
                    iterativeCalculationSettings: this.doc.iterativeCalculationSettings,
                },
                data: {
                    sheetCount: this.doc.sheetCount,
                    activeSheet: this.activeSheet ? this.activeSheet.title : null,
                },
            },
            activeWorkSheet: {
                metadata: {
                    sheetId: this.activeSheet.sheetId,
                    name: this.activeSheet.title,
                    index: this.activeSheet.index,
                    sheetType: this.activeSheet.sheetType,
                    gridproperties: this.activeSheet.gridProperties,
                    hidden: this.activeSheet.hidden,
                    tabColor: this.activeSheet.tabColor,
                    righToLeft: this.activeSheet.rightToLeft,
                },
                data: {
                    columnCount: this.activeSheet.columnCount,
                    rowCount: this.activeSheet.rowCount,
                    cellStats: this.activeSheet.cellStats,
                }
            }
        };
    }

    async _initializeSpreadsheet() {
        logger.info('Initializing spreadsheet');
        try {
            this.doc = new GoogleSpreadsheet(appConfigs.googleSheet.id, this.serviceAccount);
            // Load the document properties and sheets with retry
            await this.retryWithExponentialBackoff(async () => {
                await this.doc.loadInfo();
            });
            logger.debug(`Loaded spreadsheet: ${this.doc.title}`);
        } catch (error) {
            logger.error(`Error initializing spreadsheet: ${error.message}`);
            throw error;
        }
    }

    /**
     * Verifies if the GoogleSheetService should be enabled based on the current environment.
     * Logs appropriate information and warnings if the host IP does not match the configured app host.
     * Returns true if the environment allows the service to be enabled, false otherwise.
     * @returns {boolean} - True if the environment is verified as production, false otherwise.
     */
    _verifyEnvironment() {
        logger.info('Verifying environment...');
        logger.debug(`expect confiured host(${appConfigs.appHost}::${typeof appConfigs.appHost}) to equal current host(${this.hostIp}::${typeof this.hostIp})`);
        if (appConfigs.appHost != this.hostIp) {
            logger.warn('GoogleSheetService disabled in non-production environment');
            return false;
        }
        logger.info('GoogleSheetService enabled');
        return true;
    }

    /**
 * Checks if the GoogleSheetService is connected and initialized.
 * If disconnected, attempts to reconnect up to MAX_RECONNECT_ATTEMPTS times.
 * @returns {Promise<boolean>} true if the service is connected and initialized, false otherwise.
 */
    async isConnected() {
        const MAX_RECONNECT_ATTEMPTS = 3;
        let attempts = 0;

        // First verify environment
        if (!this._verifyEnvironment()) {
            logger.warn("GoogleSheetService is disabled in non-production server");
            return false;
        }

        // If already connected, return true
        if (this.connected) {
            logger.debug(`GoogleSheetService is already connected`);
            return true;
        }

        // If disconnected, attempt to reconnect
        while (!this.connected && attempts < MAX_RECONNECT_ATTEMPTS) {
            attempts++;
            logger.info(`Attempting to reconnect (attempt ${attempts}/${MAX_RECONNECT_ATTEMPTS})...`);

            try {
                await this.init();
                if (this.connected) {
                    logger.info(`Successfully reconnected on attempt ${attempts}`);
                    return true;
                }
            } catch (error) {
                logger.error(`Reconnection attempt ${attempts} failed:`, error);
            }

            // Wait before next attempt if not last attempt
            if (!this.connected && attempts < MAX_RECONNECT_ATTEMPTS) {
                const waitTime = Math.min(Math.pow(2, attempts) * 1000, 5000);
                logger.warn(`Waiting ${waitTime}ms before next reconnection attempt...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }

        logger.error(`Failed to reconnect after ${MAX_RECONNECT_ATTEMPTS} attempts`);
        return false;
    }

    /**
     * Handles specific Google API errors and provides appropriate recovery actions
     * @param {Error} error - The error object to handle
     * @returns {boolean} - True if the error is recoverable, false otherwise
     */
    _handleGoogleApiError(error) {
        if (!error) return false;

        // Extract status code and message
        const statusCode = error.response?.status || error.code;
        const message = error.response?.data?.error?.message || error.message;

        logger.error(`Google API Error - [${statusCode}] ${message}`);

        switch (statusCode) {
            case 503:  // Service Unavailable
                logger.warn('Google Sheets API temporarily unavailable');
                this.connected = false;
                return true;  // Recoverable error
            case 429:  // Rate Limit
                logger.warn('Rate limit exceeded');
                return true;  // Recoverable error
            case 401:  // Unauthorized
            case 403:  // Forbidden
                logger.error('Authentication/Authorization error');
                this.connected = false;
                return false;
            default:
                logger.error(`Unhandled API error: ${message}`);
                return false;
        }
    }

    /**
     * Sets the active sheet within the Google Spreadsheet, using the provided sheet name.
     * If the sheet does not exist, creates a new sheet with the specified name and the current date.
     * Also validates the structure of the sheet once set.
     * 
     * @param {string} sheetName - The name of the sheet to set as active. Defaults to "logs".
     * @returns {Promise<boolean>} - Resolves to true if the active sheet was set successfully, false otherwise.
     * Logs appropriate information and errors during the process.
     */
    async setActiveSheet(sheetName = "logs") {
        try {
            logger.info(`Setting active sheet: ${sheetName}`);
            this.connected = false;

            this.activeSheet = await this._findSheet(sheetName);
            logger.debug(`current active sheet: ${this.activeSheet?.title || 'null'}`);

            if (!this.activeSheet) {
                logger.warn('Sheet not found, creating new sheet');
                const title = `${sheetName}_${formatBkkTime}`;
                logger.debug(`sheet name to create: ${title}`);

                try {
                    this.activeSheet = await this.doc.addSheet({
                        title: title,
                        headerValues: this.logColumns
                    });
                    logger.debug(`New sheet created: ${this.activeSheet.title}`);
                } catch (error) {
                    logger.error(`Error creating new sheet: ${error.message}`);
                    throw error;
                }
            }

            await this._validateSheetStructure();
            logger.info(`Active sheet set to: ${this.activeSheet.title}`);
            await this.displayFirst10Rows();

            if (this.activeSheet) {
                this.connected = true;
                return true;
            }
            return false;
        } catch (error) {
            logger.error('Error setting active sheet:', error);
            this.connected = false;
            return false;
        }
    }

    async _findSheet(sheetName) {
        logger.info("findSheet by name and index");
        try {
            // Debug existing sheets
            this.doc.sheetsByIndex.forEach(sheet =>
                logger.debug(`existing sheet: ${sheet.title}`)
            );
            const sheet = (
                this.doc.sheetsByTitle[sheetName] ||
                this.doc.sheetsByIndex.find(sheet => sheet.title === sheetName) ||
                (this.targetSheetid ? this.doc.sheetsById[this.targetSheetid] : null) ||
                this.doc.sheetsByIndex[0]
            );
            logger.debug(`slected sheet: ${sheet?.title || 'null'}`);

            // Try to find the sheet using different methods
            return sheet
        } catch (error) {
            logger.error(`Error finding sheet: ${error.message}`);
            return null;
        }
    }

    async _validateSheetStructure() {
        logger.info("validating sheet structure")
        try {
            logger.debug(`Sheet dimensions - Rows: ${this.activeSheet.rowCount}, Columns: ${this.activeSheet.columnCount}`);

            // Validate headers
            await this.validateAndInitializeHeaders();
        } catch (error) {
            logger.error('Error validating sheet structure', error);
        }
    }

    /**
     * Validates and initializes headers in the active Google Spreadsheet.
     * 
     * This function fetches the first row from the active sheet to determine the current headers.
     * It compares them against the required headers defined in `logColumns`. If any headers are
     * missing, it calculates the correct positions for these headers based on the required order
     * and inserts them into the sheet. The function ensures that all required headers are present
     * and in the correct order. It logs relevant information and errors during the process.
     * 
     * @async
     * @throws {Error} Throws an error if the validation or insertion process fails.
     */

    async validateAndInitializeHeaders() {
        logger.info("Validating headers...");
        try {
            const headerRow = await this.retryWithExponentialBackoff(async () => {
                return await this.getSheetRows(1, 1);
            });

            // Extract header values from the first row
            const currentHeaders = headerRow.length > 0 ?
                Object.keys(headerRow[0].toObject()) : [];

            logger.debug(`Current headers: ${currentHeaders.join(', ')}`);

            const currentHeaderSet = new Set(currentHeaders);
            const requiredHeaders = this.logColumns;
            const missingHeaders = requiredHeaders.filter(header => !currentHeaderSet.has(header));

            if (missingHeaders.length > 0) {
                logger.debug(`Missing headers to add: ${missingHeaders.join(', ')}`);

                // Create a map of column positions for existing headers
                const currentHeaderPositions = new Map();
                currentHeaders.forEach((header, index) => {
                    currentHeaderPositions.set(header, index);
                });

                // For each missing header, find its correct position based on logColumns order
                const insertOperations = missingHeaders.map(header => {
                    const targetIndex = this.logColumns.indexOf(header);
                    const prevHeader = this.logColumns[targetIndex - 1];
                    const nextHeader = this.logColumns[targetIndex + 1];

                    // Find where to insert based on surrounding headers
                    let insertPosition;
                    if (prevHeader && currentHeaderPositions.has(prevHeader)) {
                        insertPosition = currentHeaderPositions.get(prevHeader) + 1;
                    } else if (nextHeader && currentHeaderPositions.has(nextHeader)) {
                        insertPosition = currentHeaderPositions.get(nextHeader);
                    } else {
                        insertPosition = targetIndex;
                    }

                    return {
                        header,
                        position: insertPosition
                    };
                });
                logger.debug(`Insert operations: ${JSON.stringify(insertOperations)}`);

                // Sort operations by position (descending) to maintain correct order when inserting
                insertOperations.sort((a, b) => b.position - a.position);
                logger.debug(`Sorted insert operations: ${JSON.stringify(insertOperations)}`);

                // Insert each column in the correct position
                for (const operation of insertOperations) {
                    await this.retryWithExponentialBackoff(async () => {
                        // Set inheritFromBefore to false when inserting at position 0
                        const inheritFromBefore = operation.position > 0;

                        await this.activeSheet.insertDimension('COLUMNS', {
                            startIndex: operation.position,
                            endIndex: operation.position + 1
                        }, inheritFromBefore);

                        logger.info(`Inserted column at position ${operation.position}`);
                        this.setActiveSheet(); // to refresh loading new columns

                        // Update the header cell
                        await this.activeSheet.loadCells({
                            startRowIndex: 0,
                            endRowIndex: 1,
                            startColumnIndex: operation.position,
                            endColumnIndex: operation.position + 1
                        });

                        const cell = this.activeSheet.getCell(0, operation.position);
                        cell.value = operation.header;
                        await this.activeSheet.saveUpdatedCells();
                    });

                    // Update positions map for subsequent insertions
                    currentHeaderPositions.forEach((pos, key) => {
                        if (pos >= operation.position) {
                            currentHeaderPositions.set(key, pos + 1);
                        }
                    });
                    currentHeaderPositions.set(operation.header, operation.position);
                }


                // Verify the final header order
                const updatedHeaderRow = await this.retryWithExponentialBackoff(async () => {
                    return await this.getSheetRows(1, 1);
                });

                const finalHeaders = updatedHeaderRow.length > 0 ?
                    Object.keys(updatedHeaderRow[0].toObject()) : [];

                logger.debug(`Final headers: ${finalHeaders.join(', ')}`);

                // Validate final header order
                const isCorrectOrder = finalHeaders.every((header, index) =>
                    this.logColumns[index] === header);

                if (!isCorrectOrder) {
                    logger.warn('Headers are not in the correct order');
                    logger.debug(`Expected order: ${this.logColumns.join(', ')}`);
                    logger.debug(`Actual order: ${finalHeaders.join(', ')}`);

                    logger.info("fallback to just set headers");

                    if (!Array.isArray(this.logColumns) && this.logColumns.length <= 0) {
                        logger.error("logColumns is not an array or empty");
                        throw new Error("logColumns is not an array or empty");
                    }
                    await this.retryWithExponentialBackoff(async () => {
                        await this.activeSheet.setHeaderRow(this.logColumns, 1);
                    });
                }
                logger.info('Headers updated successfully');
                !isCorrectOrder && logger.warn('please move the others log to its column respectively')
            }
        } catch (error) {
            logger.error(`Error validating headers: ${error.message}`);
            throw error;
        }
    }

    /**
     * Prepares a log entry at the start of a request
     * @param {Express.Request} request 
     * @returns {Object} Partial log entry with request data
     */
    prepareRequestLog(request) {
        logger.info('Preparing request log entry...');
        try {
            const now = new Date();
            const requestTimestamp = formatBkkTime(now);

            // Store timestamps on request object for later duration calculation
            request.requestTimestamp = requestTimestamp;
            request.requestTimeMs = now.getTime();

            const requestLog = {
                serverHostIp: request.headers.host || 'unknown host',
                runningEnvironment: appConfigs.environment || 'default env',
                requestTimestamp,
                requestIp: request.ip,
                requestMethod: request.method,
                requestPath: request.path,
                requestHeaders: JSON.stringify(request.headers),
                requestParameters: JSON.stringify(request.params),
                requestQuery: JSON.stringify(request.query),
                requestBody: JSON.stringify(request.body)
            };

            logger.debug(`Request log prepared: ${JSON.stringify(requestLog)}`);
            return requestLog;
        } catch (error) {
            logger.error(`Error preparing request log: ${error.message}`);
            throw error;
        }
    }

    /**
     * Completes the log entry with response data
     * @param {Express.Request} request Original request with timestamp
     * @param {Object} response Formatted response object
     * @returns {Object} Complete log entry
     */
    prepareResponseLog(request, response) {
        logger.info('Preparing response log entry...');
        try {
            // get response time ms
            const responseTimeMs = new Date().getTime();

            // Combine request log with response data and processing duration
            const logEntry = {
                ...request.requestLog, // Get the stored request log
                responseTimestamp: formatBkkTime(new Date(responseTimeMs)),
                responseHeader: JSON.stringify(response.headers),
                responseStatus: response.status_code,
                responseMessage: response.message,
                responseData: JSON.stringify(response.data),
                processingDurationMs: responseTimeMs - request.requestTimeMs
            };

            logger.info('Response log entry prepared');
            logger.debug(`Complete log entry prepared: ${JSON.stringify(logEntry)}`);
            return logEntry;
        } catch (error) {
            logger.error('Error preparing response log:', error);
            throw error;
        }
    }

    async _formatRowData(logEntry) {

        // Create the row data object using the mapping
        const rowData = {};
        for (const column of this.logColumns) {
            const camelCaseKey = this.columnMapping[column];
            rowData[column] = logEntry[camelCaseKey] ?? 'N/A';
        }

        return rowData;
    }

    /**
     * Appends a log entry to the active sheet of the Google Spreadsheet.
     * Does nothing if the environment is not set to 'production' or if the GoogleSheetService is not connected.
     * If the active sheet is not set, uses the default sheet name to set the active sheet.
     * Formats the log entry into the correct row data before adding to the sheet.
     * Ensures the sheet is loaded with the latest data before adding the row.
     * Saves the updated cells and logs the row ID of the added row.
     * @param {Object} logEntry - The log entry to append to the sheet.
     * @returns {Promise<Row>} - Resolves to the added row object if successful, rejects with an error otherwise.
     */
    async appendLog(logEntry) {
        logger.info('Appending log entry to sheet...');

        if (!this._verifyEnvironment()) {
            logger.warn('Log append skipped in non-production environment');
            return;
        }

        try {
            // If not connected, try to reconnect
            if (!this.connected) {
                logger.warn('Service disconnected, attempting to reconnect...');
                await this.init();

                if (!this.connected) {
                    logger.error('Failed to reconnect to Google Sheets');
                    return;
                }
            }

            if (!this.activeSheet) {
                await this.setActiveSheet();
            }

            const formattedData = await this._formatRowData(logEntry);

            // Ensure the sheet is loaded with the latest data
            await this.retryWithExponentialBackoff(async () => {
                await this.activeSheet.loadCells();
            });

            // Add the row and save
            const row = await this.retryWithExponentialBackoff(async () => {
                const newRow = await this.activeSheet.addRow(formattedData);
                await this.activeSheet.saveUpdatedCells();
                return newRow;
            });

            logger.info(`Log entry successfully added to sheet with row ID: ${row._rowNumber}`);
            return row;

        } catch (error) {
            logger.error(`Failed to append log entry: ${error.message}`);
            this.connected = false;

            return null;
        }
    }


    /**
     * Tries to execute the given operation with exponential backoff on failure if the
     * error is a rate limit error (429). If the operation fails and the retry count
     * is less than MAX_RETRIES, waits for a duration calculated by the formula
     * 2^retryCount * INITIAL_BACKOFF_MS + random() * 1000, and then retries the
     * operation. If the retry count exceeds MAX_RETRIES, the error is re-thrown.
     * @param {Function} operation - The operation to retry on failure.
     * @param {number} retryCount - The current retry count. Defaults to 0.
     * @returns {Promise} - Resolves to the result of the operation if successful, or
     * rejects with the error if all retries fail.
     */
    async retryWithExponentialBackoff(operation, retryCount = 0) {
        try {
            return await operation();
        } catch (error) {
            const isRecoverable = this._handleGoogleApiError(error);

            if (isRecoverable && retryCount < MAX_RETRIES) {
                const waitTime = Math.min(
                    (Math.pow(2, retryCount) * INITIAL_BACKOFF_MS) + Math.random() * 1000,
                    MAX_BACKOFF_MS
                );

                logger.warn(`Operation failed. Retrying in ${waitTime}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, waitTime));

                return this.retryWithExponentialBackoff(operation, retryCount + 1);
            }

            // If we've exhausted retries or error is not recoverable
            if (retryCount >= MAX_RETRIES) {
                logger.error(`Failed after ${MAX_RETRIES} retries`);
            }

            throw new Error(`Google Sheets operation failed: ${error.message}`);
        }
    }

    /**
   * Fetch rows between specified start and end indices (1-based)
   * @async
   * @param {number} startRowIdx - Starting row index (1-based)
   * @param {number} finalRowIdx - Ending row index (1-based)
   * @returns {Promise<GoogleSpreadsheetRow[]>} Array of fetched rows
   */
    async getSheetRows(startRowIdx, finalRowIdx) {
        const offset = startRowIdx - 1;
        const limit = finalRowIdx - startRowIdx + 1;

        try {
            return await this.retryWithExponentialBackoff(async () => {
                return await this.activeSheet.getRows({
                    offset,
                    limit
                });
            });
        } catch (error) {
            logger.error(`Failed to get sheet rows: ${error.message}`);
            throw error;
        }
    }

    /**
     * Fetches the first 10 rows of the active sheet and logs them as two separate tables
     * - one for request data and one for response data. Also logs the total number of rows
     * in the sheet and the sheet title.
     * @async
     * @returns {Promise<void>} Resolves if successful, rejects with an error otherwise.
     */
    /**
 * Displays the first 10 rows of the sheet in a table format in the logs
 * @returns {Promise<void>}
 */
    async displayFirst10Rows() {
        try {
            logger.info('Fetching first 10 rows of the sheet...');

            if (!this.activeSheet) {
                logger.warn('No active sheet found');
                return;
            }

            const rows = await this.getSheetRows(1, 10);

            if (!rows || rows.length === 0) {
                logger.info('No rows found in the sheet');
                return;
            }
            logger.info(`fetching ${rows.length} rows`);
            rows.forEach((row, idx) => {
                logger.debug(`Row[${idx + 1}]: ${JSON.stringify(row.toObject())}`);
            })

            // Split headers into request and response groups
            const requestHeaders = this.logColumns.filter(header => header.startsWith('request-'));
            const responseHeaders = this.logColumns.filter(header => header.startsWith('response-') || header === 'processing-duration-ms');

            // Create separate table data for request and response
            const processRowData = (row, headers) => {
                const rowData = {};
                headers.forEach(header => {
                    let value = row[header];

                    if (value === undefined || value === null || value === '') {
                        value = 'N/A';
                    }

                    // Truncate long values to keep table readable
                    const maxValueLength = 10;
                    if (typeof value === 'string' && value.length > maxValueLength) {
                        value = value.substring(0, maxValueLength - 3) + '...';
                    }

                    // Remove the 'request-' or 'response-' prefix for cleaner column headers
                    const displayHeader = header
                        .replace('request-', '')
                        .replace('response-', '');

                    rowData[displayHeader] = value;
                });
                return rowData;
            };

            const requestData = rows.map(row => processRowData(row.toObject(), requestHeaders));
            const responseData = rows.map(row => processRowData(row.toObject(), responseHeaders));

            // Log the tables with metadata
            logger.info(`Sheet: ${this.activeSheet.title}`);
            logger.info(`Total rows in sheet: ${this.activeSheet.rowCount}`);
            logger.info('First 10 rows - Request Data:');
            console.table(requestData);

            logger.info('First 10 rows - Response Data:');
            console.table(responseData);

        } catch (error) {
            logger.error(`Error displaying first 10 rows: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new GoogleSheetService();