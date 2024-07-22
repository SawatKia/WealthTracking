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

    async create(data) {
        try {
            const newDoc = new this.model(data);
            logger.debug(`Creating new ${this.model.modelName}: ${JSON.stringify(newDoc)}`);
            return await newDoc.save();
        } catch (error) {
            logger.error(`Error creating new ${this.model.modelName}: ${error.message}`);
            throw new Error(`Create operation failed: ${error.message}`);
        }
    }

    async findById(id) {
        try {
            return await this.model.findById(id);
        } catch (error) {
            throw new Error(`FindById operation failed: ${error.message}`);
        }
    }

    async findOne(criteria, value) {
        try {
            const query = { [criteria]: value };
            return await this.model.findOne(query);
        } catch (error) {
            throw new Error(`FindOne operation failed: ${error.message}`);
        }
    }

    async finds(criteria, value, sorting = { field: '_id', order: 'asc' }) {
        try {
            const query = { [criteria]: value };
            const sortOrder = sorting.order === 'asc' ? 1 : -1;
            return await this.model.find(query).sort({ [sorting.field]: sortOrder });
        } catch (error) {
            throw new Error(`Find operation failed: ${error.message}`);
        }
    }

    async updateById(id, data) {
        try {
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