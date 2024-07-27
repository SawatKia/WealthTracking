const BaseModel = require("./BaseModel");
const mongoose = require('mongoose');
const Logging = require('../configs/logger');
const bcrypt = require('bcrypt');
require('dotenv').config();

const logger = new Logging('UserModel');
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    hashedPassword: { type: String, required: true },
    memberSince: { type: Date, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
});
const saltRounds = parseInt(process.env.SALT_ROUNDS);

class UserModel extends BaseModel {
    constructor() {
        super('User', userSchema);
    }

    async _hashPassword(password) {
        try {
            if (this instanceof UserModel) {
                logger.info('Hashing password');
                return await bcrypt.hash(password, saltRounds);
            } else {
                throw new Error("cannot call '_hashPassword', this method is private");
            }
        } catch (error) {
            logger.error(`Error hashing password: ${error.message}`);
            throw error;
        }
    }

    async checkPassword(username, password) {
        try {
            logger.info('Checking password');
            logger.debug(`User to check password, Username: ${username} Password: ${password}`);

            const user = await this.find("username", username);
            logger.debug(`User from find: ${JSON.stringify(user)}`);

            if (!user) {
                logger.error('User not found');
                return false;
            }

            logger.debug(`User found: ${JSON.stringify(user)}`);

            return bcrypt.compare(password, user.hashedPassword)
                .then(result => {
                    logger.debug(`Password compare result: ${result}`);
                    if (result) {
                        logger.info('Password match');
                        return true;
                    } else {
                        logger.info('Password does not match');
                        return false;
                    }
                })
                .catch(err => {
                    logger.error(`Error checking password: ${err.message}`);
                    throw err;
                });
        } catch (error) {
            logger.error(`Error checking password: ${error.message}`);
            throw error;
        }
    }

    async createUser(data, isAdmin = false) {
        try {
            logger.info('Creating user');
            logger.debug(`User data to store: ${JSON.stringify(data)}`);
            data.hashedPassword = await this._hashPassword(data.password);
            delete data.password;
            // Set role if the request is made by an admin
            if (isAdmin && data.role) {
                data.role = data.role; // Admin can specify role
            } else {
                data.role = 'user'; // Default role for regular users
            }
            return await this.create(data);
        } catch (error) {
            logger.error(`Error creating user: ${error.message}`);
            throw error;
        }
    }

    async getAllUsers() {
        try {
            logger.info('getting all users');
            let users = await this.model.find({}).lean(); // Convert Mongoose documents to plain JS objects
            if (users.length === 0) {
                logger.error('No users found');
                return [];
            }
            logger.debug(`Users found: ${JSON.stringify(users)}`);
            users = users.map(user => {
                delete user.hashedPassword;
                return user;
            });
            return users;
        } catch (error) {
            logger.error(`Error fetching users: ${error.message}`);
            throw error;
        }
    }


    async updateById(id, data) {
        try {
            logger.info('Updating user by id');
            logger.debug(`Updating user id: ${id} with data: ${JSON.stringify(data)}`);
            if (data.password) {
                data.hashedPassword = await this._hashPassword(data.password);
                delete data.password;
                logger.info('Password hashed');
            }
            return await this.model.findByIdAndUpdate(id, data, { new: true });
        } catch (error) {
            logger.error(`Error updating user: ${error.message}`);
            throw error;
        }
    }

}

module.exports = UserModel;