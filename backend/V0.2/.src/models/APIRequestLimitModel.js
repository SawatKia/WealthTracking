const BaseModel = require('./BaseModel');
const Joi = require('joi');
const { Logger } = require('../utilities/Utils');

const logger = Logger('APIRequestLimitModel');

class APIRequestLimitModel extends BaseModel {
    constructor() {
        const schema = Joi.object({
            service_name: Joi.string().required(),
            request_date: Joi.date().required(),
            tracking_type: Joi.string().valid('minute', 'daily').required(),
            request_count: Joi.number().integer().min(0).required(),
            token_count: Joi.number().integer().min(0).default(0)
        });

        super('api_request_limits', schema);
        // this.verifyTableSchema(schema);
    }

    // async verifyTableSchema(schema) {
    //     try {
    //         logger.info('Verifying table schema...');

    //         const tableName = 'api_request_limits'.toLowerCase();

    //         // Step 1: Check if the table exists
    //         const tableExistsQuery = `
    //             SELECT EXISTS (
    //                 SELECT 1 FROM information_schema.tables 
    //                 WHERE table_name = $1
    //             ) AS table_exists;
    //         `;
    //         const tableExistsResult = await super.executeQuery(tableExistsQuery, [tableName], { silent: false, withTransaction: false }, "temp");

    //         if (!tableExistsResult.rows[0].table_exists) {
    //             logger.error(`❌ Table '${tableName}' does not exist.`);
    //             return; // Stop execution
    //         }

    //         // Step 2: Fetch column details from PostgreSQL
    //         const columnQuery = `
    //             SELECT column_name, data_type, is_nullable, column_default
    //             FROM information_schema.columns
    //             WHERE table_name = $1
    //             ORDER BY ordinal_position;
    //         `;
    //         const columnResult = await super.executeQuery(columnQuery, [tableName], { silent: false, withTransaction: false }, "temp");

    //         if (columnResult.rowCount === 0) {
    //             logger.error(`❌ Table '${tableName}' exists but has no columns.`);
    //             return; // Stop execution
    //         }

    //         const actualColumns = columnResult.rows.reduce((acc, row) => {
    //             acc[row.column_name] = {
    //                 type: row.data_type,
    //                 notNull: row.is_nullable === "NO",
    //                 defaultValue: row.column_default,
    //             };
    //             return acc;
    //         }, {});

    //         // Convert Joi schema to expected column details
    //         const expectedColumns = {};
    //         Object.entries(schema.describe().keys).forEach(([key, value]) => {
    //             expectedColumns[key] = {
    //                 type: this.getPostgresType(value.type),
    //                 notNull: !value.flags?.presence || value.flags.presence === "required",
    //                 defaultValue: value.flags?.default ? value.flags.default.toString() : null,
    //             };
    //         });

    //         // Step 3: Compare schemas
    //         const mismatches = [];
    //         for (const [key, expected] of Object.entries(expectedColumns)) {
    //             const actual = actualColumns[key];
    //             if (!actual) {
    //                 mismatches.push(`❌ Missing column: ${key}`);
    //             } else {
    //                 if (actual.type !== expected.type) mismatches.push(`❌ Type mismatch for ${key}: Expected ${expected.type}, got ${actual.type}`);
    //                 if (actual.notNull !== expected.notNull) mismatches.push(`❌ NOT NULL mismatch for ${key}`);
    //                 if ((actual.defaultValue || null) !== (expected.defaultValue || null)) mismatches.push(`❌ Default value mismatch for ${key}`);
    //             }
    //         }

    //         if (mismatches.length === 0) {
    //             logger.info("✅ Table schema is valid.");
    //         } else {
    //             logger.info("❌ Table schema is invalid.");
    //             logger.info(mismatches.join("\n"));
    //         }
    //     } catch (error) {
    //         logger.error("Error verifying table schema:", error);
    //     }
    // }

    // getPostgresType(joiType) {
    //     switch (joiType) {
    //         case "string":
    //             return "character varying";
    //         case "number":
    //             return "integer";
    //         case "date":
    //             return "date";
    //         default:
    //             return "unknown";
    //     }
    // }

    async getRequestLimit(serviceName, date, trackingType = 'daily') {
        try {
            logger.debug(`Getting request limit for ${serviceName} on ${date} (${trackingType})`);

            const reqLimitCount = await this.findOne({
                service_name: serviceName,
                request_date: date,
                tracking_type: trackingType
            });

            return reqLimitCount;
        } catch (error) {
            logger.error(`Error getting request limit for ${serviceName}: ${error.message}`);
            throw error;
        }
    }

    async createRequestLimit(serviceName, date, trackingType = 'daily') {
        try {
            logger.info('Creating a new request limit for this day...');
            return await this.create({
                service_name: serviceName,
                request_date: date,
                tracking_type: trackingType,
                request_count: 0,  // Initialize request count to 0
                token_count: 0
            });
        } catch (error) {
            logger.error(`Error creating request limit for ${serviceName}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Increments the request count and token count for a given service on a specified date.
     *
     * @param {string} serviceName - The name of the service for which to increment the request count.
     * @param {Date} date - The date for which to increment the request count.
     * @param {number} [tokens=0] - The number of tokens to add to the token count (default is 0).
     * @returns {Promise<Object>} - The updated request limit record.
     * @throws {Error} - If there is an error incrementing the request count.
     */
    async incrementRequestCount(serviceName, date, tokens = 0, trackingType = 'daily') {
        try {
            logger.info('Incrementing request count...');
            logger.debug(`serviceName: ${serviceName}, date: ${date}, tokens: ${tokens}`);
            logger.info("Checking if request limit exists for this day...");
            const currentLimit = await this.getRequestLimit(serviceName, date, trackingType);
            if (!currentLimit) {
                logger.info('No request limit found for this day, creating new record...');
                logger.info(`Creating new request limit record for ${serviceName} on ${date}`);
                return await this.createRequestLimit(serviceName, date, trackingType);
            }
            logger.info('Request limit found for this day');
            logger.debug(`Current request limit: ${JSON.stringify(currentLimit)}`);

            const newRequestCount = currentLimit.request_count + 1;
            const newTokenCount = currentLimit.token_count + tokens;
            logger.debug(`Incrementing ${serviceName} usage to: requests ${newRequestCount}, tokens ${newTokenCount}`);

            return await this.update(
                { service_name: serviceName, request_date: date, tracking_type: trackingType },
                {
                    request_count: newRequestCount,
                    token_count: newTokenCount
                }
            );
        } catch (error) {
            logger.error(`Error incrementing request count for ${serviceName}: ${error.message}`);
            throw error;
        }
    }

    async getTokenCount(serviceName, date) {
        try {
            const currentLimit = await this.getRequestLimit(serviceName, date);
            return currentLimit ? currentLimit.token_count : 0;
        } catch (error) {
            logger.error(`Error getting token count for ${serviceName}: ${error.message}`);
            throw error;
        }
    }
}

module.exports = APIRequestLimitModel;
