const BaseModel = require("./BaseModel");
const mongoose = require('mongoose');
const logger = require('../configs/logger');

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
            logger.info('[UserModel] - Creating user');
            logger.debug(`[UserModel] - User data to store: ${JSON.stringify(data)}`);
            return await this.create(data);
        } catch (error) {
            logger.error(`[UserModel] - Error creating user: ${error.message}`);
            throw error;
        }
    }
}

module.exports = UserModel;