const mongoose = require('mongoose');
const Logging = require('../configs/logger');
const logger = new Logging('MongoObject');

class MongoObject {
    /**
     * Converts a string to ObjectId
     * @param {string} stringId - The string to convert
     * @returns {ObjectId|null} - The converted ObjectId or null if invalid
     */
    static toObjectId(stringId) {
        if (!mongoose.Types.ObjectId.isValid(stringId)) {
            logger.warn(`Invalid 'ObjectId' format: ${stringId}`);
            return null;
        }
        logger.info(`Converted string to ObjectId: ${stringId}`);
        return new mongoose.Types.ObjectId(stringId);
    }

    /**
     * Converts an ObjectId to a string
     * @param {ObjectId} objectId - The ObjectId to convert
     * @returns {string|null} - The converted string or null if invalid
     */
    static toStringId(objectId) {
        if (!(objectId instanceof mongoose.Types.ObjectId)) {
            logger.warn(`Invalid ObjectId instance: ${objectId}`);
            return null;
        }
        const stringId = objectId.toString();
        logger.info(`Converted ObjectId to string: ${stringId}`);
        return stringId;
    }

    /**
     * Converts a document to a plain object
     * @param {Document} result - The document to convert
     * @returns {Object|null} - The plain object or null if the input is null
     */
    static toObject(result) {
        if (!result) {
            logger.info('Null document provided to toObject');
            return null;
        }
        logger.info('Converted document to plain object');
        return result.toObject();
    }

    /**
     * Converts an array of documents to plain objects
     * @param {Array<Document>} results - The array of documents to convert
     * @returns {Array<Object>} - The array of plain objects
     */
    static toObjects(results) {
        if (!Array.isArray(results)) {
            logger.warn('Non-array input provided to toObjects');
            return [];
        }
        logger.info(`Converted ${results.length} documents to plain objects`);
        return results.map(result => result.toObject());
    }

    /**
     * Validates if a string is a valid ObjectId
     * @param {string} stringId - The string to validate
     * @returns {boolean} - True if valid, otherwise false
     */
    static isValidObjectId(stringId) {
        const isValid = mongoose.Types.ObjectId.isValid(stringId);
        logger.info(`ObjectId validation result for ${stringId}: ${isValid}`);
        return isValid;
    }

    /**
     * Safely extracts ObjectId from request parameters or body
     * @param {Object} req - The request object
     * @param {string} field - The field name to extract
     * @returns {ObjectId|null} - The extracted ObjectId or null if invalid
     */
    static extractObjectId(req, field) {
        const id = req.params[field] || req.body[field];
        if (!id || !MongoObject.isValidObjectId(id)) {
            logger.warn(`Invalid or missing '${field}' in request`);
            return null;
        }
        logger.info(`Extracted ObjectId for field '${field}': ${id}`);
        return MongoObject.toObjectId(id);
    }

    /**
     * Converts and validates nested ObjectId fields in documents
     * @param {Object} doc - The document to process
     * @param {Array<string>} fields - The list of fields to convert
     */
    static convertNestedObjectIds(doc, fields) {
        fields.forEach(field => {
            if (doc[field] && typeof doc[field] === 'string') {
                const convertedId = MongoObject.toObjectId(doc[field]);
                if (convertedId) {
                    doc[field] = convertedId;
                    logger.info(`Converted nested ObjectId for field '${field}'`);
                } else {
                    logger.warn(`Failed to convert nested ObjectId for field '${field}'`);
                }
            }
        });
    }
}

module.exports = MongoObject;