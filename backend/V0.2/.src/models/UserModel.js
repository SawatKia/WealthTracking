const bcrypt = require('bcrypt');

const BaseModel = require('./BaseModel');
require('dotenv').config();
const Utils = require('../utilities/Utils');

const logger = Utils.Logger('UserModel');

class UserModel extends BaseModel {

    constructor() {
        super('users');
        this.saltRounds = parseInt(process.env.SALT_ROUNDS);
    }

    async _hashPassword(password) {
        logger.info('Hashing password');
        try {
            if (this instanceof UserModel) {
                logger.debug(`password: ${password}, saltRounds: ${this.saltRounds}`);
                return await bcrypt.hash(password, this.saltRounds);
            } else {
                throw new Error("cannot call '_hashPassword', this method is private");
            }
        } catch (error) {
            logger.error(`Error hashing password: ${error.message}`);
            throw error;
        }
    }

    async checkPassword(email, password) {
        try {
            logger.info('Checking password');
            email = email.toLowerCase();
            logger.debug(`User to check password, email: ${email} Password: ${password}`);
            //TODO - test below line changed from this.find to this.findOne
            const user = await super.findOne([email]);
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

    async createUser(newUserData) {
        try {
            logger.info('Creating new user from Raw data');
            logger.debug(`newUserData: ${JSON.stringify(newUserData)}`);
            super.validateSchema(newUserData);
            const hashed_password = await this._hashPassword(newUserData.password);
            newUserData = {
                ...newUserData,
                hashed_password
            };
            delete newUserData.password;
            logger.debug(`userdata to be create: ${JSON.stringify(newUserData)}`);
            return await super.create(newUserData);
        } catch (error) {
            logger.error(`${error.message}`);
            throw error;
        }
    }
}
module.exports = UserModel