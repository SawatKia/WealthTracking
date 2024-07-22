const BaseModel = require("./BaseModel");
const mongoose = require('mongoose');
const Logging = require('../configs/logger');

const logger = new Logging('UserModel');
const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    hashedPassword: String,
    memberSince: Date,
});

class UserModel extends BaseModel {
    constructor() {
        super('User', userSchema);
    }

    async createUser(data) {
        try {
            logger.info('Creating user');
            logger.debug(`User data to store: ${JSON.stringify(data)}`);
            return await this.create(data);
        } catch (error) {
            logger.error(`Error creating user: ${error.message}`);
            throw error;
        }
    }
}

module.exports = UserModel;