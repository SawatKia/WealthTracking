require('dotenv').config();

const PgClient = require('./PgClient');
const Utils = require('../utilities/Utils');

const logger = Utils.Logger('BaseModel');

class BaseModel extends PgClient {
    constructor(tableName) {
        super();
        this.tableName = `"${tableName}"`;
    }

    async validateSchema(data) {
        logger.info('Validating schema...');
        try {
            logger.debug(`data: ${JSON.stringify(data)}`);
            logger.debug(`Validating result: true`)
            return true;
        } catch (error) {
            throw new Error(`${field} is invalid`)
        }
    }

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


    async findAll(userEmail) {
        try {
            const sql = `SELECT * FROM ${this.tableName} WHERE userEmail = $1`;
            const result = await super.query(sql, [userEmail]);
            return result;
        } catch (error) {
            throw new Error(error)
        }
    }

    async findOne(primaryKeys) {
        try {
            const keys = Object.keys(primaryKeys);
            const value = Object.values(primaryKeys);
            const placeholder = keys.map((_, index) => `$${index + 1}`).join(',');

            const sql = `SELECT * FROM ${this.tableName} WHERE ${keys.join(' = $')} = ${placeholder}`;
            const result = await super.query(sql, value);
            return result;
        } catch (error) {
            throw new Error(error)
        }
    }

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