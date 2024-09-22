require('dotenv').config();
const Joi = require('joi');

const pgClient = require('./PgClient');
const Utils = require('../utilities/Utils');
const { ValidationError } = require('../utilities/ValidationErrors')

const { Logger, formatResponse } = Utils;
const logger = Logger('BaseModel');

class BaseModel {
    constructor(tableName, schema) {
        this.tableName = `"${tableName}"`;
        this.schema = schema;
        this.pgClient = pgClient;
    }

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

    async create(data) {
        try {
            const validated = await this.validateSchema(data, 'create');
            logger.debug(`Validated data: ${JSON.stringify(validated)}`);
            if (validated instanceof Error) throw validated;
            const keys = Object.keys(data);
            const value = Object.values(data);
            const placeholder = keys.map((_, index) => `$${index + 1}`).join(',');

            const sql = `INSERT INTO ${this.tableName} (${keys.join(',')}) VALUES (${placeholder}) RETURNING *`;
            logger.debug(`create sql prepared query: ${sql}`);
            const result = await this.pgClient.query(sql, value);
            logger.debug(`create result: ${JSON.stringify(result)}`);
            return result; // Return the result for further use
        } catch (error) {
            logger.error(`Error creating: ${error.message}`);
            throw error;
        }
    }

    async findAll(userEmail) {
        try {
            const sql = `SELECT * FROM ${this.tableName} WHERE userEmail = $1`;
            const result = await this.pgClient.query(sql, [userEmail]);
            return result;
        } catch (error) {
            throw new Error(error)
        }
    }

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

            const result = await this.pgClient.query(sql, values);
            logger.debug(`findOne result: ${JSON.stringify(result.rows[0])}`);
            return result.rows[0];  // Assuming you want the first result
        } catch (error) {
            logger.error(`Error in findOne: ${error.message}`);
            throw new Error(error);
        }
    }

    async update(primaryKeys, data) {
        try {
            const keys = Object.keys(primaryKeys);
            const value = Object.values(primaryKeys);
            const placeholder = keys.map((_, index) => `$${index + 1}`).join(',');

            const sql = `UPDATE ${this.tableName} SET ${Object.keys(data).map((key, index) => `${key} = $${index + 1}`).join(',')} WHERE ${keys.join(' = $')} = ${placeholder} RETURNING *`;
            const result = await this.pgClient.query(sql, [...value, ...Object.values(data)]);
            return result;
        } catch (error) {
            if (error === 'duplicate key value') {
                throw new Error('duplicate key value')
            }
            throw new Error(error)
        }
    }

    async delete(primaryKeys) {
        try {
            const keys = Object.keys(primaryKeys);
            const value = Object.values(primaryKeys);
            const placeholder = keys.map((_, index) => `$${index + 1}`).join(',');

            const sql = `DELETE FROM ${this.tableName} WHERE ${keys.join(' = $')} = ${placeholder} RETURNING *`;
            const result = await this.pgClient.query(sql, value);
            return result;
        } catch (error) {
            throw new Error(error)
        }
    }
}
module.exports = BaseModel