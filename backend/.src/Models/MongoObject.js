const mongoose = require('mongoose');
const Logging = require('../configs/logger');

class MongoObject {
    //create constructor
    constructor() {
        if (this.constructor === MongoObject) {
            throw new Error("Abstract classes can't be instantiated.");
        }
        this.logger = new Logging('MongoObject');
    }
    /**
     * Converts a string to ObjectId
     * @param {string} stringId - The string to convert
     * @returns {ObjectId|null} - The converted ObjectId or null if invalid
     */
    toObjectId(stringId) {
        this.logger.info(`Converting string to ObjectId`);
        this.logger.debug(`String to convert: ${stringId}`);
        if (!mongoose.isObjectIdOrHexString(stringId)) {
            this.logger.warn(`Invalid 'ObjectId' format: ${stringId}`);
            return null;
        }
        this.logger.debug(`Converted string to ObjectId: ${stringId}`);
        return new mongoose.Types.ObjectId(stringId);
    }

    /**
     * Converts an ObjectId to a string
     * @param {ObjectId} objectId - The ObjectId to convert
     * @returns {string|null} - The converted string or null if invalid
     */
    toStringId(objectId) {
        this.logger.info('Converting ObjectId to string');
        this.logger.debug(`ObjectId to convert: ${objectId}`);
        if (!(objectId instanceof mongoose.Types.ObjectId)) {
            this.logger.warn(`Invalid ObjectId instance: ${objectId}`);
            return null;
        }
        const stringId = objectId.toString();
        this.logger.debug(`Converted ObjectId to string: ${stringId}`);
        return stringId;
    }

    /**
     * Converts a document to a plain object
     * @param {Document} result - The document to convert
     * @returns {Object|null} - The plain object or null if the input is null
     */
    toObject(result) {
        this.logger.info('Converting document to plain object');
        this.logger.debug(`Document to convert: ${result}`);
        if (!result) {
            this.logger.warn('Null document provided to toObject');
            return null;
        }
        this.logger.debug(`Converted document to plain object: ${result.toObject()}`);
        return result.toObject();
    }

    /**
     * Converts an array of documents to plain objects
     * @param {Array<Document>} results - The array of documents to convert
     * @returns {Array<Object>} - The array of plain objects
     */
    toObjects(results) {
        this.logger.info('Converting documents to plain objects');
        this.logger.debug(`Documents to convert: ${results}`);
        if (!Array.isArray(results)) {
            this.logger.warn('Non-array input provided to toObjects');
            return [];
        }
        this.logger.debug(`Converted documents to plain objects: ${results.map(result => result.toObject())}`);
        return results.map(result => result.toObject());
    }

    /**
     * Validates if a string is a valid ObjectId
     * @param {string} stringId - The string to validate
     * @returns {boolean} - True if valid, otherwise false
     */
    isValidObjectId(stringId) {
        this.logger.info(`Validating ObjectId format`);
        this.logger.debug(`String to validate: ${stringId}`);
        const isValid = mongoose.isObjectIdOrHexString(stringId);
        /** isObjectIdOrHexString 
         * return true for:
         * 1. ObjectId instance
         * 2. 24-character hex string
         * 
         * return false for:
         * 1. numbers
         * 2. string with length other than 24
         * 3. documents
         */
        this.logger.info(`ObjectId validation result for ${stringId}: ${isValid}`);
        return isValid;
    }

    /**
     * Safely extracts ObjectId from request parameters or body
     * @param {Object} req - The request object
     * @param {string} field - The field name to extract
     * @returns {ObjectId|null} - The extracted ObjectId or null if invalid
     */
    extractObjectId(req, field) {
        this.logger.info(`Extracting ObjectId from request`);
        this.logger.debug(`Field to extract: ${field}`);
        const id = req.params[field] || req.body[field];
        if (!id || !MongoObject.isValidObjectId(id)) {
            this.logger.warn(`Invalid or missing '${field}' in request`);
            return null;
        }
        this.logger.info(`Extracted ObjectId for field '${field}': ${id}`);
        return MongoObject.toObjectId(id);
    }

    /**
     * Converts and validates nested ObjectId fields in documents
     * @param {Object} doc - The document to process
     * @param {Array<string>} fields - The list of fields to convert
     */
    convertNestedObjectIds(doc, fields) {
        this.logger.info('Converting nested ObjectId fields');
        fields.forEach(field => {
            if (doc[field] && typeof doc[field] === 'string') {
                const convertedId = MongoObject.toObjectId(doc[field]);
                if (convertedId) {
                    doc[field] = convertedId;
                    this.logger.info(`Converted nested ObjectId for field '${field}'`);
                } else {
                    this.logger.warn(`Failed to convert nested ObjectId for field '${field}'`);
                }
            }
        });
    }
}

module.exports = MongoObject;