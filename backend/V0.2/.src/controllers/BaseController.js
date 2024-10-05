require('dotenv').config();
const Utils = require('../utilities/Utils');
const User = require('../models/UserModel');

const { Logger, formatResponse } = Utils;
const logger = Logger('BaseController');

class BaseController {

    /**
     * Verifies required fields and performs type conversion based on the model schema
     * @param {Object} body - The request body
     * @param {Array} requiredFields - Array of required field names
     * @param {Object} model - The model instance containing the schema
     * @returns {Object} - The body with converted types
     */
    verifyField(body, requiredFields, model) {
        logger.info('verifyField');
        logger.debug(`requiredFields: ${requiredFields}`);

        if (!body || typeof body !== 'object') {
            logger.debug('Invalid request body');
            throw new Error('Invalid request body');
        }
        logger.info(`body: ${JSON.stringify(body)}`);
        if (!requiredFields || !Array.isArray(requiredFields)) {
            logger.debug('Invalid required fields');
            throw new Error('Invalid required fields');
        }
        logger.info(`requiredFields: ${requiredFields}`);

        if (model && typeof model !== 'object') {
            logger.debug('Invalid model');
            throw new Error('Invalid model');
        }
        logger.info(`model is valid`);

        // Verify required fields
        if (requiredFields && requiredFields.length > 0) {
            logger.debug(`body: ${JSON.stringify(body)}`);
            for (const field of requiredFields) {
                if (body[field] === undefined || body[field] === null || !body[field]) {
                    logger.error(`Missing required field: ${field}`);
                    throw new Error(`Missing required field: ${field}`);
                }
                logger.debug(`${field} is present in body`);
            }
        }

        // Perform type conversion if model is provided
        if (model && model.schema) {
            const schema = model.schema;
            const convertedBody = {};

            for (const [key, value] of Object.entries(body)) {
                if (schema.describe().keys[key]) {
                    const fieldSchema = schema.describe().keys[key];
                    logger.debug(`[${key}] expected type: ${fieldSchema.type}, current type: ${typeof value}`);
                    try {
                        switch (fieldSchema.type) {
                            case 'number':
                                convertedBody[key] = value === '' ? null : Number(value);
                                if (isNaN(convertedBody[key])) {
                                    throw new Error(`Invalid number format for field: ${key}`);
                                }
                                break;
                            case 'string':
                                convertedBody[key] = String(value);
                                break;
                            case 'boolean':
                                if (typeof value === 'string') {
                                    convertedBody[key] = value.toLowerCase() === 'true';
                                } else {
                                    convertedBody[key] = Boolean(value);
                                }
                                break;
                            default:
                                convertedBody[key] = value;
                        }
                    } catch (error) {
                        logger.error(`Type conversion failed for field ${key}: ${error.message}`);
                        throw new Error(`Invalid format for field ${key}: ${error.message}`);
                    }
                } else {
                    // If the field is not in the schema, keep it as is
                    convertedBody[key] = value;
                }
            }

            return convertedBody;
        }

        // If no model is provided, return the original body
        return body;
    }

    /**
     * Retrieves the current user from the request.
     * @param {Object} req - The request object
     * @returns {Object} - The user object
     * @throws {Error} - If the user is not found
     */
    async getCurrentUser(req) {
        //TODO - get user from jwt
        req.user = {
            national_id: '1234567890123',
            email: 'V2yF3@example.com',
            username: 'test_user',
            role: 'user',
            memberSince: '2021-05-06T14:39:54.981Z',
        }
        if (!req.user) {
            throw new Error('User not found');
        }
        return req.user;
    }

    verifyOwnership(user, resource) {
        if (!user || !resource.length > 0) {
            throw new Error('User or resource are empty');
        }
        resource.map((i) => {
            if (i.email !== user.email) {
                return false;
            }
        })
        return true;
    }
}
module.exports = BaseController;