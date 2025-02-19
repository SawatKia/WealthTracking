const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const appConfigs = require('../configs/AppConfigs');
const { Logger, formatBkkTime } = require('../utilities/Utils');
const creds = require('../configs/nodeJsGoogleSheet-serviceAccount.json');
require('dotenv/config');

const logger = Logger('GoogleSheetService');

class GoogleSheetService {
    constructor() {
        logger.info("starting GoogleSheetService");
        this.SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
        this.connected = false;
        this.activeSheet = null;
        this.targetSheetid = null;
        this.initializeAuth();
        this.initializeLogColumns();

        // Bind all methods to the class
        Object.getOwnPropertyNames(GoogleSheetService.prototype).forEach(key => {
            if (typeof this[key] === 'function') {
                this[key] = this[key].bind(this);
            }
        });
    }

    initializeAuth() {
        this.serviceAccount = new JWT({
            email: creds.client_email,
            key: creds.private_key,
            scopes: this.SCOPES,
        });
    }

    initializeLogColumns() {
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
    }

    /**
     * Initializes the GoogleSheetService by verifying environment variables, setting up
     * authentication, selecting the active sheet and setting up the log columns.
     * @returns {Promise<boolean>} true if initialization was successful, false otherwise.
     */
    async init() {
        logger.info('GoogleSheetService initializing...');
        try {
            if (!this._verifyEnvironment()) {
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
                logger.debug(`metadata: ${JSON.stringify(await this.metadata(), null, 2)}`);
            }


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
            // Load the document properties and sheets
            await this.doc.loadInfo();
            logger.debug(`Loaded spreadsheet: ${this.doc.title}`);
        } catch (error) {
            logger.error('Error initializing spreadsheet:', error);
            throw error;
        }
    }

    _verifyEnvironment() {
        if (appConfigs.environment !== 'production') {
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
                    logger.error('Error creating new sheet:', error);
                    throw error;
                }
            }

            await this._validateSheetStructure();
            logger.info(`Active sheet set to: ${this.activeSheet.title}`);
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
            logger.debug(`slected sheet: ${sheet}`);

            // Try to find the sheet using different methods
            return sheet
        } catch (error) {
            logger.error("Error finding sheet:", error);
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
            const currentHeaders = await this.activeSheet.loadHeaderRow();
            logger.debug(`current headers: ${JSON.stringify(currentHeaders)}`);
            const currentHeaderSet = new Set(currentHeaders);
            logger.debug(`current header set: ${typeof currentHeaderSet} - ${JSON.stringify(currentHeaderSet)}`);
            const requiredHeaders = this.logColumns;
            logger.debug(`required headers: ${JSON.stringify(requiredHeaders)}`);

            // Check for missing headers
            const missingHeaders = requiredHeaders.filter(header => !currentHeaderSet.has(header));

            if (missingHeaders.length > 0) {
                logger.debug(`missing headers: ${missingHeaders.join(', ')}`);

                // re-write the headers
                logger.debug(`headers to add: ${typeof requiredHeaders} - ${JSON.stringify(requiredHeaders)}`);
                if (Array.isArray(requiredHeaders)) {
                    requiredHeaders.map((header) => {
                        if (typeof header !== "string") {
                            logger.error(`Header ${header} is not a string`);
                            throw new Error(`Header ${header} is not a string`);
                        }
                    })
                } else {
                    logger.error('requiredHeaders is not an array');
                    throw new Error("requiredHeaders is not an array");
                }

                this.activeSheet.setHeaderRow(requiredHeaders, 1);

                logger.info('Headers updated successfully');
            }
        } catch (error) {
            logger.error('Error validating headers:', error);
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
            logger.error('Error preparing request log:', error);
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
            // Calculate processing duration
            const responseTimeMs = new Date().getTime();
            const processingDurationMs = responseTimeMs - request.requestTimeMs;

            logger.debug(`Request processing took ${processingDurationMs}ms`);

            // Combine request log with response data and processing duration
            const logEntry = {
                ...request.requestLog, // Get the stored request log
                responseTimestamp: formatBkkTime(new Date(responseTimeMs)),
                responseHeader: JSON.stringify(response.headers),
                responseStatus: response.status_code,
                responseMessage: response.message,
                responseData: JSON.stringify(response.data),
                processingDurationMs: processingDurationMs
            };

            logger.debug(`Complete log entry prepared: ${JSON.stringify(logEntry)}`);
            return logEntry;
        } catch (error) {
            logger.error('Error preparing response log:', error);
            throw error;
        }
    }

    async _formatRowData(logEntry) {
        // Create a mapping between hyphenated and camelCase keys
        const columnMapping = {
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

        // Create the row data object using the mapping
        const rowData = {};
        for (const column of this.logColumns) {
            const camelCaseKey = columnMapping[column];
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

        if (!this._verifyEnvironment() || !this.connected) {
            return;
        }

        try {
            if (!this.activeSheet) {
                await this.setActiveSheet();
            }

            // Format the row data before adding
            const formattedData = await this._formatRowData(logEntry);

            // Ensure the sheet is loaded with the latest data
            await this.activeSheet.loadCells();

            // Add the row and save
            const row = await this.activeSheet.addRow(formattedData);
            await this.activeSheet.saveUpdatedCells();

            logger.info(`Log entry successfully added to sheet with row ID: ${row._rowNumber}`);
            return row;
        } catch (error) {
            logger.error('Failed to append log entry:', error);
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
        const offset = startRowIdx - 1; // Convert to 0-based index
        const limit = finalRowIdx - startRowIdx + 1;
    }
    //TODO - shows first 10 rows
}

module.exports = new GoogleSheetService();