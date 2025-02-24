const appConfigs = require('../configs/AppConfigs');
const { Logger } = require('../utilities/Utils');

const logger = Logger('GoogleSheetService');

// Mock service for non-production environments
class MockGoogleSheetService {
    constructor() {
        logger.info("Initializing mock GoogleSheetService for non-production environment");
    }

    async init() {
        logger.info("Mock GoogleSheetService init called - doing nothing in non-production environment");
        return Promise.resolve(true);
    }

    isConnected() {
        return false;
    }

    prepareRequestLog() {
        return null;
    }

    prepareResponseLog() {
        return null;
    }

    async appendLog() {
        return Promise.resolve(null);
    }
}

// Factory function to create the appropriate service instance
function createGoogleSheetService() {
    const expectedEnvironment = 'production';
    if (appConfigs.environment !== expectedEnvironment) {
        return new MockGoogleSheetService();
    }

    // Only import dependencies if in production
    const { GoogleSpreadsheet } = require('google-spreadsheet');
    const { JWT } = require('google-auth-library');
    const { formatBkkTime } = require('../utilities/Utils');
    const creds = require(appConfigs.googleSheet.pathToServiceAccount);

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
            this.serviceAccount = null;
            this.columnMapping = null;
            this.logColumns = null;

            this.expectedEnvironment = expectedEnvironment;

            // Bind all methods to the class
            Object.getOwnPropertyNames(GoogleSheetService.prototype).forEach(key => {
                if (typeof this[key] === 'function') {
                    this[key] = this[key].bind(this);
                }
            });
        }

        initializeAuth() {
            logger.info('Initializing GoogleSheet authentication...');
            this.serviceAccount = new JWT({
                email: creds.client_email,
                key: creds.private_key,
                scopes: this.SCOPES,
            });
        }

        initializeLogColumns() {
            logger.info('Initializing log columns...');
            // Define log columns with clear mapping to request/response fields
            this.logColumns = [
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
            if (!this._verifyEnvironment()) {
                logger.info('GoogleSheetService initialization skipped in non-production environment');
                return true;
            }
            try {
                // Only initialize if in production environment
                if (this._verifyEnvironment()) {
                    this.initializeAuth();
                    this.initializeLogColumns();
                } else {
                    logger.info('GoogleSheetService disabled in non-production environment');
                    return false;
                }

                if (!this.serviceAccount) {
                    logger.warn('GoogleSheet authentication not initialized');
                    return false;
                }

                await this._initializeSpreadsheet();
                await this.setActiveSheet();
                this.targetSheetid = this.activeSheet?.sheetId;
                if (this.activeSheet) {
                    logger.debug(`metadata: ${JSON.stringify(await this.metadata())}`);
                }
                Object.keys(appConfigs.googleSheet).forEach(key => {
                    logger.debug(`typeof appConfigs.googleSheet.${key}: ${typeof appConfigs.googleSheet[key]}`);
                    if (appConfigs.googleSheet[key] === undefined || appConfigs.googleSheet[key] === '' || appConfigs.googleSheet[key] === null) {
                        logger.warn(`appConfigs.googleSheet.${key} is undefined or empty or null. Please set it in .env file, examine missing key in 🔗  \x1b[38;5;51mhttps://github.com/SawatKia/WealthTracking.git\x1b[0m`);
                    } else {
                        appConfigs.environment === 'development' ? logger.debug(`appConfigs.googleSheet.${key}: ${appConfigs.googleSheet[key]}`) :
                            logger.debug(`appConfigs.googleSheet.${key}: ${'*'.repeat(appConfigs.googleSheet[key].length)}`);
                    }
                });

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

        _verifyEnvironment() {
            logger.info('Verifying environment...');
            if (appConfigs.environment !== this.expectedEnvironment) {
                logger.warn('GoogleSheetService is disabled in non-production environments');
                return false;
            }
            return true;
        }

        /**
         * Checks if the GoogleSheetService is connected to a spreadsheet
         * @returns {boolean} True if connected, false otherwise
         */
        isConnected() {
            return this.connected;
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
                this.connected = true;
                return true;
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
                const headers = await this.activeSheet.loadHeaderRow();
                logger.debug(`Sheet headers: ${JSON.stringify(headers)}`);
                logger.debug(`Sheet dimensions - Rows: ${this.activeSheet.rowCount}, Columns: ${this.activeSheet.columnCount}`);

                // Validate headers
                await this.validateAndInitializeHeaders();
            } catch (error) {
                logger.error('Error validating sheet structure', error);
            }
        }

        async validateAndInitializeHeaders() {
            logger.info("Validating headers...");
            try {
                const currentHeaders = await this.retryWithExponentialBackoff(async () => {
                    return await this.activeSheet.loadHeaderRow();
                });

                logger.debug(`current headers: ${JSON.stringify(currentHeaders)}`);
                const currentHeaderSet = new Set(currentHeaders);
                const requiredHeaders = this.logColumns;

                const missingHeaders = requiredHeaders.filter(header => !currentHeaderSet.has(header));

                if (missingHeaders.length > 0) {
                    logger.debug(`missing headers: ${missingHeaders.join(', ')}`);

                    if (!Array.isArray(requiredHeaders)) {
                        logger.error('requiredHeaders is not an array');
                        throw new Error("requiredHeaders is not an array");
                    }

                    await this.retryWithExponentialBackoff(async () => {
                        await this.activeSheet.setHeaderRow(requiredHeaders, 1);
                    });

                    logger.info('Headers updated successfully');
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
                if (!this._verifyEnvironment()) {
                    return;
                }
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
            if (this._verifyEnvironment()) {
                logger.info('Log append skipped in non-production environment');
                return;
            }

            logger.info('Appending log entry to sheet...');
            if (!this.connected) {
                logger.warn('GoogleSheetService not connected');
                return;
            }

            try {
                if (!this.activeSheet) {
                    await this.setActiveSheet();
                }

                const formattedData = await this._formatRowData(logEntry);

                // Ensure the sheet is loaded with the latest data with retry
                await this.retryWithExponentialBackoff(async () => {
                    await this.activeSheet.loadCells();
                });

                // Add the row and save with retry
                const row = await this.retryWithExponentialBackoff(async () => {
                    const newRow = await this.activeSheet.addRow(formattedData);
                    await this.activeSheet.saveUpdatedCells();
                    return newRow;
                });

                logger.info(`Log entry successfully added to sheet with row ID: ${row._rowNumber}`);
                return row;
            } catch (error) {
                logger.error(`Failed to append log entry: ${error.message}`);
                throw error;
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
                // Centralize certificate error handling
                if (error.message && error.message.includes("unable to verify the first certificate")) {
                    logger.warn("internet connection error, retrying...");
                    // Trigger auto-authentication script
                    // This is executed only once per error even if retries are remaining
                    exec("nohup python3 /home/kksurin/Documents/auto-authen-kmitl-main/authen.py", (err, stdout, stderr) => {
                        if (err) {
                            logger.error(`Failed to run auto-auth script: ${err.message}`);
                        } else {
                            logger.info("Auto-auth script executed successfully.");
                        }
                    });
                }

                // If error is related to rate limiting and we haven't exceeded retries, retry the operation
                if (error.code === 429 && retryCount < MAX_RETRIES) {
                    const waitTime = Math.min(
                        (Math.pow(2, retryCount) * INITIAL_BACKOFF_MS) + Math.random() * 1000,
                        MAX_BACKOFF_MS
                    );

                    logger.warn(`Rate limit exceeded. Retrying in ${waitTime}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));

                    return retryWithExponentialBackoff(operation, retryCount + 1);
                }
                throw error;
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

    return new GoogleSheetService();
}

// Export a single instance
module.exports = createGoogleSheetService();