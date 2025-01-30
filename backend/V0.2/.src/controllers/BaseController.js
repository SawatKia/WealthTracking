const { Logger, formatResponse } = require('../utilities/Utils');
const MyAppErrors = require('../utilities/MyAppErrors');
const UserModel = require('../models/UserModel');
const { log } = require('winston');
const types = require('../../statics/types.json');

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
                logger.info('req.user not found, getting from cookies');
                const accessToken = req.cookies['access_token'] || req.headers.authorization?.split(' ')[1];
                if (!accessToken) {
                    throw MyAppErrors.unauthorized('Access token not found');
                }
                req.user = await verifyToken(accessToken);
                logger.debug(`req.user decodedfrom cookies: ${JSON.stringify(req.user, null, 2)}`);
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
                    // throw MyAppErrors.badRequest(`Missing required field: ${field}`);
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
                                // Remove commas from number strings before conversion
                                const cleanValue = typeof value === 'string' ? value.replace(/,/g, '') : value;
                                convertedBody[key] = cleanValue === '' ? null : Number(cleanValue);
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

    /**
     * Verifies if the user owns the resource
     * @param {Object} user - The user object
     * @param {Object|Array} resource - The resource object or array of resource objects
     * @returns {Boolean} - True if the user owns the resource, false otherwise
     */
    verifyOwnership(user, resource) {
        logger.info('verifyOwnership');

        if (!user || typeof user !== 'object') {
            logger.error('User is empty or not an object');
            throw new Error('User is empty or not an object');
        }
        logger.info(`user is valid`);
        logger.debug(`user: ${JSON.stringify(user, null, 2)}`);

        if (!resource || (typeof resource !== 'object' && !Array.isArray(resource))) {
            logger.error('Resource is empty or not an object or array');
            throw new Error('Resource is empty or not an object or array');
        }
        logger.info(`resource is valid`);
        // Convert single object to array if needed
        const resourceArray = Array.isArray(resource) ? resource : [resource];
        if (!resourceArray || resourceArray.length === 0) {
            logger.error('Resource is empty');
            throw new Error('Resource is empty');
        }
        const maxLength = 5;
        logger.debug(`resourceArray: ${JSON.stringify(resourceArray, null, 2).slice(0, maxLength)}, ${resourceArray.length > maxLength ? '...remaining: ' + (resourceArray.length - maxLength) + ' items...' : ''}`);


        // Check if any resource doesn't match the user's national_id
        const hasUnauthorizedAccess = resourceArray.some(item => {
            if (item.national_id !== user.national_id) {
                logger.error(`User does not own resource with national_id: ${item.national_id}`);
                return true;    // Found an unauthorized item
            }
            return false;       // This item is authorized
        });

        if (hasUnauthorizedAccess) {
            logger.error('User does not own one or more resources');
            return false;
        }

        logger.info('User owns all the resources');
        return true;
    }

    filterUserData(user) {
        logger.info('Filtering user data for client');
        if (!user) return null;

        const allowedFields = ['national_id', 'email', 'username', 'date_of_birth', 'profile_picture_url'];
        const filteredUser = Object.keys(user)
            .filter(key => allowedFields.includes(key))
            .reduce((obj, key) => {
                // Convert date_of_birth to Bangkok time and extract only the date part
                if (key === 'date_of_birth' && user[key]) {
                    const utcDate = new Date(user[key]);
                    // Add 7 hours to convert to Bangkok time
                    utcDate.setHours(utcDate.getHours() + 7);
                    // Format date as YYYY-MM-DD
                    const year = utcDate.getFullYear();
                    const month = String(utcDate.getMonth() + 1).padStart(2, '0');
                    const day = String(utcDate.getDate()).padStart(2, '0');
                    obj[key] = `${year}-${month}-${day}`;
                } else {
                    obj[key] = user[key];
                }
                return obj;
            }, {});

        logger.debug(`Filtered user data: ${JSON.stringify(filteredUser)}`);
        return filteredUser;
    }

    verifyType(category, type) {
        logger.info('Verifying type');
        logger.debug(`category: ${category}, type: ${type}`);

        // Validate category first if provided
        if (category && !['Income', 'Expense', 'Transfer'].includes(category)) {
            throw MyAppErrors.badRequest('Invalid category. Must be Income, Expense, or Transfer');
        }

        // If no type provided, just validate category
        if (!type) {
            return true;
        }

        // Get allowed types for the category
        const allowedTypes = types[category] || [];
        if (allowedTypes.length === 0) {
            throw MyAppErrors.badRequest(`Invalid category: ${category}`);
        }

        logger.info(`verify if type is allowed for category`);
        if (!allowedTypes.includes(type)) {
            // Find similar types using string similarity
            let similarTypes = allowedTypes.filter(t =>
                t.toLowerCase().includes(type.toLowerCase()) ||
                type.toLowerCase().includes(t.toLowerCase())
            );
            logger.debug(`similarTypes: ${JSON.stringify(similarTypes)}`);

            const mostSimilarWord = this.findMostSimilarWord(type, allowedTypes);
            if (mostSimilarWord && !similarTypes.includes(mostSimilarWord)) {
                similarTypes.push(mostSimilarWord); // Append similar word if not duplicate
            }
            logger.debug(`mostSimilarWord: ${mostSimilarWord}`);


            const errorMessage = `type "${type}" is not allowed for "${category}". Must be one of: ${allowedTypes.join(', ')}` +
                (similarTypes.length > 0 ? `. Did you mean: ${[...new Set(similarTypes)].join(', ')}?` : ''); // Use Set to remove duplicates in suggestions

            logger.error(errorMessage);
            throw MyAppErrors.badRequest(errorMessage);
        }

        logger.info('Type verification successful');
        return true;
    }

    jaroWinklerSimilarity(s1, s2) {
        // Convert to lowercase for case insensitivity
        s1 = s1.toLowerCase();
        s2 = s2.toLowerCase();

        const len1 = s1.length;
        const len2 = s2.length;

        if (len1 === 0 || len2 === 0) return 0;

        const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;
        const matches1 = Array(len1).fill(false);
        const matches2 = Array(len2).fill(false);

        // Count matches
        let matches = 0;
        for (let i = 0; i < len1; i++) {
            const start = Math.max(0, i - matchDistance);
            const end = Math.min(i + matchDistance + 1, len2);

            for (let j = start; j < end; j++) {
                if (!matches2[j] && s1[i] === s2[j]) {
                    matches1[i] = true;
                    matches2[j] = true;
                    matches++;
                    break;
                }
            }
        }

        if (matches === 0) return 0;

        // Count transpositions
        let t = 0;
        let point = 0;
        for (let i = 0; i < len1; i++) {
            if (matches1[i]) {
                while (!matches2[point]) point++;
                if (s1[i] !== s2[point]) t++;
                point++;
            }
        }
        t /= 2;

        // Jaro similarity
        const jaro =
            (matches / len1 + matches / len2 + (matches - t) / matches) / 3;

        // Winkler adjustment
        let prefix = 0;
        for (let i = 0; i < Math.min(len1, len2); i++) {
            if (s1[i] === s2[i]) prefix++;
            else break;
        }
        prefix = Math.min(4, prefix);

        const scalingFactor = 0.1; // Winkler's adjustment factor
        return jaro + prefix * scalingFactor * (1 - jaro);
    }

    // Function to find the most similar word
    findMostSimilarWord(target, wordArray) {
        logger.info('Finding most similar word');
        logger.debug(`target: ${target}, wordArray: ${JSON.stringify(wordArray)}`);
        let mostSimilarWord = null;
        let highestSimilarity = -1;

        for (const word of wordArray) {
            const similarity = this.jaroWinklerSimilarity(target, word); // Use class method
            if (similarity > highestSimilarity) {
                highestSimilarity = similarity;
                mostSimilarWord = word;
            }
        }
        logger.info(`most similar word: ${mostSimilarWord} with similarity: ${highestSimilarity}`);
        return mostSimilarWord;
    }
}
module.exports = BaseController;
