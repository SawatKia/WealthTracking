require('dotenv').config();
const Joi = require('joi');

const PgClient = require('./PgClient');
const Utils = require('../utilities/Utils');
const { ValidationError } = require('../utilities/ValidationErrors')

const logger = Utils.Logger('BaseModel');

class BaseModel extends PgClient {
    constructor(tableName, schema) {
        super();
        this.tableName = `"${tableName}"`;
        this.schema = schema;
    }

    /**
     * Validates the schema using Joi
     * @param {object} data - Data to be validated
     * @param {string} operation - The operation type: create, update, etc.
     * @throws {Error} - If there is an issue with the validation
     * @returns {Promise<object>} - The validated data
     */
    async validateSchema(data, operation = 'create') {
        logger.info('Validating schema...');
        logger.debug(`Data to be validate: ${JSON.stringify(data)}`);

        try {
            // Validate data using the Joi schema and appropriate context (operation)
            const validated = await this.schema.validateAsync(data, { context: { operation } });
            logger.debug(`Validation passed for data: ${JSON.stringify(validated)}`);
            return validated;
        } catch (error) {
            logger.error(`Validation error: ${error.message}`);
            return new ValidationError(error.message);
        }
    }

    /**
     * Creates a new entry in the table
     * @param {object} data - Data to be inserted
     * @returns {Promise<object>} - The newly inserted entry
     * @throws {Error} - If there is an issue with the insertion
     */
    async create(data) {
        try {
            const keys = Object.keys(data);
            const value = Object.values(data);
            const placeholder = keys.map((_, index) => `$${index + 1}`).join(',');

            const sql = `INSERT INTO ${this.tableName} (${keys.join(',')}) VALUES (${placeholder}) RETURNING *`;
            logger.debug(`create sql prepared query: ${sql}`);
            const result = await super.query(sql, value);
            logger.debug(`create result: ${JSON.stringify(result)}`);
            return result; // Return the result for further use
        } catch (error) {
            logger.error(`Error creating new user: ${error.message}`);
            // Handle custom validation error for 'national_id'
            if (error.message.includes('check_national_id_length') ||
                error.message.includes('value too long for type character(13)')) {
                throw new Error('invalid national_id length');
            }
            if (error.code === '23505') { // Postgres duplicate key error
                throw new Error('duplicate key value');
            }
            throw new Error(error);
        }
    }


    /**
     * Retrieves all entries in the table for a given user
     * @param {string} userEmail - The email address of the user to retrieve entries for
     * @returns {Promise<object[]>} - An array of entries for the given user
     * @throws {Error} - If there is an issue with the retrieval
     */
    async findAll(userEmail) {
        try {
            const sql = `SELECT * FROM ${this.tableName} WHERE userEmail = $1`;
            const result = await super.query(sql, [userEmail]);
            return result;
        } catch (error) {
            throw new Error(error)
        }
    }

    /**
     * Retrieves a single entry in the table based on given primary keys
     * @param {object} primaryKeys - An object containing the primary keys to search for
     * @returns {Promise<object>} - The entry in the table matching the given primary keys
     * @throws {Error} - If there is an issue with the retrieval
     */
    async findOne(primaryKeys) {
        try {
            if (typeof primaryKeys !== 'object') {
                throw new Error('primaryKeys must be an object');
            }
            logger.info('Finding one...');
            logger.debug(`primaryKeys: ${JSON.stringify(primaryKeys)}`);

            const keys = Object.keys(primaryKeys); // Assuming primaryKeys is an object
            const values = Object.values(primaryKeys);
            logger.debug(`keys: ${keys}, values: ${values}`);

            // Construct the WHERE clause with proper placeholders
            const condition = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');

            // Correct the query by ensuring the placeholders match the values
            const sql = `SELECT * FROM ${this.tableName} WHERE ${condition}`;

            const result = await super.query(sql, values);
            logger.debug(`findOne result: ${JSON.stringify(result.rows[0])}`);
            return result.rows[0];  // Assuming you want the first result
        } catch (error) {
            logger.error(`Error in findOne: ${error.message}`);
            throw new Error(error);
        }
    }


    /**
     * Updates a single entry in the table based on given primary keys
     * @param {object} primaryKeys - An object containing the primary keys to search for
     * @param {object} data - An object containing the data to update the entry with
     * @returns {Promise<object>} - The updated entry in the table
     * @throws {Error} - If there is an issue with the update
     */
    async update(primaryKeys, data) {
        try {
            const keys = Object.keys(primaryKeys);
            const value = Object.values(primaryKeys);
            const placeholder = keys.map((_, index) => `$${index + 1}`).join(',');

            const sql = `UPDATE ${this.tableName} SET ${Object.keys(data).map((key, index) => `${key} = $${index + 1}`).join(',')} WHERE ${keys.join(' = $')} = ${placeholder} RETURNING *`;
            const result = await super.query(sql, [...value, ...Object.values(data)]);
            return result;
        } catch (error) {
            if (error === 'duplicate key value') {
                throw new Error('duplicate key value')
            }
            throw new Error(error)
        }
    }

    /**
     * Deletes a single entry in the table based on given primary keys
     * @param {object} primaryKeys - An object containing the primary keys to search for
     * @returns {Promise<object>} - The deleted entry in the table
     * @throws {Error} - If there is an issue with the deletion
     */
    async delete(primaryKeys) {
        try {
            const keys = Object.keys(primaryKeys);
            const value = Object.values(primaryKeys);
            const placeholder = keys.map((_, index) => `$${index + 1}`).join(',');

            const sql = `DELETE FROM ${this.tableName} WHERE ${keys.join(' = $')} = ${placeholder} RETURNING *`;
            const result = await super.query(sql, value);
            return result;
        } catch (error) {
            throw new Error(error)
        }
    }
}
module.exports = BaseModel