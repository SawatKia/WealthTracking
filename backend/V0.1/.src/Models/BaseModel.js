const mongoose = require('mongoose');
const Logging = require('../configs/logger')
const MongoObject = require('./MongoObject');

const logger = new Logging('BaseModel');

class BaseModel extends MongoObject {
    constructor(modelName, schema) {
        super();
        if (this.constructor === BaseModel) {
            throw new Error("Abstract classes can't be instantiated.");
        }
        this.model = mongoose.model(modelName, schema);
    }


    async create(data) {
        try {
            logger.info(`Creating new ${this.model.modelName}`);
            const document = new this.model(data);
            await document.validate(); // Explicitly validate the data
            await document.save(); // Save the document if validation passes
            logger.debug(`Creating new ${this.model.modelName} document: ${JSON.stringify(document)}`);
            return document;
        } catch (error) {
            logger.error(`Error creating new ${this.model.modelName} document: ${error.message}`);
            throw error;
        }
    }

    async findById(id) {
        try {
            logger.info(`Finding by id`);
            logger.debug(`Finding by id: ${id}`);
            return await this.model.findById(id);
        } catch (error) {
            logger.error(`Error finding by id: ${error.message}`);
            throw new Error(`FindById operation failed: ${error.message}`);
        }
    }

    async findOne(query) {
        try {
            logger.info(`Finding ${this.model.modelName}`);
            logger.debug(`Finding in ${this.model.modelName} with query: ${JSON.stringify(query)}`);
            return await this.model.findOne(query);
        } catch (error) {
            logger.error(`Error finding ${this.model.modelName}: ${error.message}`);
            throw new Error(`Find operation failed: ${error.message}`);
        }
    }

    // async find(criteria, value) {
    //     try {
    //         logger.info(`Finding ${this.model.modelName}`);
    //         logger.debug(`Finding in ${this.model.modelName} with ${criteria}: ${value}`);
    //         const query = { [criteria]: value };
    //         return await this.model.findOne(query);
    //     } catch (error) {
    //         logger.error(`Error finding ${this.model.modelName}: ${error.message}`);
    //         throw new Error(`Find operation failed: ${error.message}`);
    //     }
    // }

    async finds(criteria, value, sorting = { field: '_id', order: 'asc' }) {
        try {
            logger.info(`finds ${this.model.modelName}`);
            logger.debug(`finds in ${this.model.modelName} with ${criteria}: ${value}`);
            const query = { [criteria]: value };
            const sortOrder = sorting.order === 'asc' ? 1 : -1;
            return await this.model.find(query).sort({ [sorting.field]: sortOrder });
        } catch (error) {
            throw new Error(`Find operation failed: ${error.message}`);
        }
    }

    async updateById(id, data) {
        try {
            logger.info(`Updating ${this.model.modelName} with id: ${id}`);
            if (!super.isValidObjectId(id)) {
                throw new Error('Invalid ObjectId');
            }
            const document = await this.model.findById(id);
            if (!document) {
                throw new Error('Document not found');
            }
            Object.assign(document, data);
            await document.validate(); // Explicitly validate the data
            await document.save(); // Save the document if validation passes
            return document;
        } catch (error) {
            throw new Error(`Update operation failed: ${error.message}`);
        }
    }

    async deleteById(id) {
        try {
            logger.info(`Deleting ${this.model.modelName}`);
            if (!super.isValidObjectId(id)) {
                throw new Error('Invalid ObjectId');
            }
            logger.debug(`Deleting ${this.model.modelName} with id: ${id}`);
            return await this.model.findByIdAndDelete(id);
        } catch (error) {
            throw new Error(`Delete operation failed: ${error.message}`);
        }
    }
}

module.exports = BaseModel;