const mongoose = require('mongoose');

class BaseModel {
    constructor(modelName, schema) {
        if (this.constructor === BaseModel) {
            throw new Error("Abstract classes can't be instantiated.");
        }
        this.model = mongoose.model(modelName, schema);
    }

    async create(data) {
        try {
            const newDocument = new this.model(data);
            return await newDocument.save();
        } catch (error) {
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

    async findOne(conditions) {
        try {
            return await this.model.findOne(conditions);
        } catch (error) {
            throw new Error(`FindOne operation failed: ${error.message}`);
        }
    }

    async find(conditions) {
        try {
            return await this.model.find(conditions);
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