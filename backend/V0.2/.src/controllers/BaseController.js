const Utils = require('../utilities/Utils');
const MyAppErrors = require('../utilities/MyAppErrors');
const UserModel = require('../models/UserModel');

const { Logger } = Utils;
const logger = Logger('BaseController');

class BaseController {
    constructor() {
        try {
            this.userModel = new UserModel();
            // Initialize userModel in constructor
            logger.info('Initializing BaseController');

            // Bind methods to preserve 'this' context
            this.verifyField = this.verifyField.bind(this);
            this.verifyOwnership = this.verifyOwnership.bind(this);
            this.getCurrentUser = this.getCurrentUser.bind(this);
            logger.info('BaseController initialized');
        } catch (error) {
            logger.error(`BaseController initialization failed: ${error.stack}`);
            throw error;
        }
    }

    /**
     * Gets the current user from the request
     * @param {Object} req - The request object
     * @returns {Object} - The current user
     */
    async getCurrentUser(req) {
        try {
            logger.debug('getCurrentUser');
            logger.debug(`req.user: ${JSON.stringify(req.user, null, 2)}`);

            if (!req.user) {
                throw MyAppErrors.unauthorized('Access token or refresh token not found');
            }

            const national_id = req.user.sub;
            if (!national_id) {
                throw MyAppErrors.unauthorized('decoded user national_id not found');
            }
            logger.debug(`decoded user national_id found: ${national_id}`);

            const user = await this.userModel.findUser(national_id);
            if (!user) {
                throw MyAppErrors.notFound('User not found');
            }
            logger.debug(`user found: ${JSON.stringify(user, null, 2)}`);
            return user;
        } catch (error) {
            logger.error(`Error getting current user national_id: ${error.message}`);
            throw error;
        }
    }

    /**
     * Verifies required fields and performs type conversion based on the model schema
     * @param {Object} body - The request body object
     * @param {Array} requiredFields - Array of required field names
     * @param {Object} model - The model instance containing the schema
     * @returns {Object} - The body with converted types
     */
    async verifyField(body, requiredFields, model) {
        logger.info('verifyField');

        if (!body || typeof body !== 'object') {
            logger.debug('Invalid request body');
            throw new Error('Invalid request body');
        }
        logger.info(`received body: ${JSON.stringify(body, null, 2)}`);
        if (!requiredFields || !Array.isArray(requiredFields)) {
            logger.debug('Invalid required fields');
            throw new Error('Invalid required fields');
        }
        logger.info(`requiredFields: ${JSON.stringify(requiredFields, null, 2)} is valid`);

        if (model && typeof model !== 'object') {
            logger.warn('Invalid model');
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
            }
            logger.info(`all required fields are present`);
        }

        // Perform type conversion if model is provided
        if (model && model.schema) {
            const schema = model.schema;
            const convertedBody = {};
            logger.info('type conversion');
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
                            default:
                                convertedBody[key] = value;
                                break;
                        }
                    } catch (error) {
                        logger.error(`Type conversion error: ${error.message}`);
                        throw error;
                    }
                } else {
                    // If the field is not in the schema, keep it as is
                    convertedBody[key] = value;
                }
            }
            logger.info(`type conversion complete: ${JSON.stringify(convertedBody, null, 2)}`);
            return convertedBody;
        }

        // If no model is provided, return the original body
        return body;
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