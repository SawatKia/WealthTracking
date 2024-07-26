const mongoose = require('mongoose');
const Logging = require('../configs/logger')

const logger = new Logging('BaseModel');

class BaseModel {
    constructor(modelName, schema) {
        if (this.constructor === BaseModel) {
            throw new Error("Abstract classes can't be instantiated.");
        }
        this.model = mongoose.model(modelName, schema);
    }

    _verifyData(data) {
        try {
            logger.info(`Verifying data`);
            logger.debug(`Data to verify: ${JSON.stringify(data)}`);
            // Check if all required fields exist
            const requiredPaths = this.model.schema.requiredPaths();
            logger.info(`Checking for required fields`);
            logger.debug(`Required fields: ${requiredPaths}`);
            for (const path of requiredPaths) {
                logger.debug(`Checking for required field: ${path}`);
                if (!data.hasOwnProperty(path)) {
                    logger.error(`Missing required field: ${path}`);
                    throw new Error(`Missing required field: ${path}`);
                }
            }
            logger.info(`All required fields are present`);

            // Verify types of all fields
            logger.info('Verifying types of all fields');
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    const value = data[key];
                    const schemaType = this.model.schema.path(key);
                    logger.debug(`Field ${key} has type ${schemaType.instance}`);

                    // Compare the type correctly using Mongoose's schema type
                    if (schemaType && schemaType.instance !== value.constructor.name) {
                        logger.error(`Invalid type for field ${key}. Expected ${schemaType.instance}, got ${value.constructor.name}`);
                        throw new Error(`Invalid type for field ${key}. Expected ${schemaType.instance}, got ${value.constructor.name}`);
                    }
                    logger.debug(`Field ${key} has valid type`);
                }
            }
            logger.info('all fields have valid types');
        } catch (error) {
            logger.error(`Error verifying data: ${error.message}`);
            throw new Error(`Verify data operation failed: ${error.message}`);
        }
    }

    async create(data) {
        try {
            logger.info(`Creating new ${this.model.modelName}`);
            this._verifyData(data);
            const newDoc = new this.model(data);
            logger.debug(`Creating new ${this.model.modelName}: ${JSON.stringify(newDoc)}`);
            return await newDoc.save();
        } catch (error) {
            logger.error(`Error creating new ${this.model.modelName}: ${error.message}`);
            throw error;
        }
    }

    async findById(id) {
        try {
            logger.debug(`Finding by id: ${id}`);
            return await this.model.findById(id);
        } catch (error) {
            logger.error(`Error finding by id: ${error.message}`);
            throw new Error(`FindById operation failed: ${error.message}`);
        }
    }

    async find(criteria, value) {
        try {
            logger.info(`Finding ${this.model.modelName}`);
            logger.debug(`Finding in ${this.model.modelName} with ${criteria}: ${value}`);
            const query = { [criteria]: value };
            return await this.model.findOne(query);
        } catch (error) {
            logger.error(`Error finding ${this.model.modelName}: ${error.message}`);
            throw new Error(`Find operation failed: ${error.message}`);
        }
    }

    async finds(criteria, value, sorting = { field: '_id', order: 'asc' }) {
        try {
            logger.info(`finds`)
            const query = { [criteria]: value };
            const sortOrder = sorting.order === 'asc' ? 1 : -1;
            logger.debug(``)
            return await this.model.find(query).sort({ [sorting.field]: sortOrder });
        } catch (error) {
            throw new Error(`Find operation failed: ${error.message}`);
        }
    }

    async updateById(id, data) {
        try {
            logger.info(`Updating ${this.model.modelName} with id: ${id}`);
            return await this.model.findByIdAndUpdate(id, data, { new: true });
        } catch (error) {
            throw new Error(`Update operation failed: ${error.message}`);
        }
    }

    async deleteById(id) {
        try {
            return await this.model.findByIdAndDelete(id);
        } catch (error) {
            throw new Error(`Delete operation failed: ${error.message}`);
        }
    }
}

module.exports = BaseModel;