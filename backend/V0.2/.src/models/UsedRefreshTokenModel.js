const Joi = require('joi');

const BaseModel = require('./BaseModel');
const { Logger } = require('../utilities/Utils');

const logger = Logger('UsedRefreshTokenModel');

class UsedRefreshTokenModel extends BaseModel {
    constructor() {
        super('used_refresh_tokens');
        this.schema = Joi.object({
            jti: Joi.string().required(),
            created_at: Joi.date().required(),
            expires_at: Joi.date().required()
        });
        logger.info('UsedRefreshTokenModel initialized');
    }

    /**
     * Check if a JTI exists in the blacklist
     * @param {string} jti - The JWT ID to check
     * @returns {Promise<boolean>} - True if JTI exists, false otherwise
     */
    async has(jti) {
        logger.info('Checking if JTI is used');
        try {
            const result = await this.findOne({ jti: jti });
            logger.debug(`raw result: ${JSON.stringify(result)}`);
            logger.debug(`JTI check result: ${!!result}`);
            return !!result; // Convert result to boolean
        } catch (error) {
            logger.error(`Error checking JTI: ${error.message}`);
            throw error;
        }
    }

    /**
     * Add a JTI to the blacklist
     * @param {string} jti - The JWT ID to add
     * @param {Date} expiresAt - Token expiration date
     * @returns {Promise<void>}
     */
    async add(jti, expiresAt) {
        logger.info('Adding JTI to used tokens list');
        try {
            const result = await this.create({
                jti: jti,
                created_at: new Date(),
                expires_at: expiresAt
            });
            logger.debug('JTI added successfully:', result);
        } catch (error) {
            logger.error(`Error adding JTI: ${error.message}`);
            throw error;
        }
    }

    /**
     * Remove expired JTIs from the blacklist
     * @returns {Promise<void>}
     */
    async cleanup() {
        logger.info('Cleaning up expired JTIs');
        try {
            const query = 'DELETE FROM used_refresh_tokens WHERE expires_at < NOW()';
            await this.pgClient.query(query);
            logger.debug('Expired JTIs cleaned up');
        } catch (error) {
            logger.error(`Error cleaning up JTIs: ${error.message}`);
            throw error;
        }
    }
}

module.exports = UsedRefreshTokenModel; 