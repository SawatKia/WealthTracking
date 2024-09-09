const bcrypt = require('bcrypt');
const Joi = require('joi');

const BaseModel = require('./BaseModel');
require('dotenv').config();
const Utils = require('../utilities/Utils');
const { ValidationError } = require('../utilities/AppErrors');

const logger = Utils.Logger('UserModel');
const stringRegex = /^[a-zA-Z0-9\s]+$/;

class UserModel extends BaseModel {

    constructor() {
        const userSchema = Joi.object({
            // National ID should be required for read, update, and delete but optional for create
            national_id: Joi.string().length(13).when(Joi.ref('$operation'), {
                is: Joi.valid('read', 'update', 'delete'),
                then: Joi.required(),
                otherwise: Joi.optional(),
            }).messages({
                'string.length': 'National ID must be 13 characters long.',
                'any.required': 'National ID is required for this operation.',
            }),

            // Email should be required for create and optional for other operations
            email: Joi.string().email().when(Joi.ref('$operation'), {
                is: Joi.valid('create', 'check'),
                then: Joi.required(),
                otherwise: Joi.optional(),
            }).messages({
                'string.email': 'Email must be a valid email address.',
                'any.required': 'Email is required when creating a user.',
            }),

            // Username should be required for create and optional for others
            username: Joi.string().alphanum().when(Joi.ref('$operation'), {
                is: 'create',
                then: Joi.required(),
                otherwise: Joi.optional(),
            }).messages({
                'string.alphanum': 'Username must contain only alphanumeric characters.',
                'any.required': 'Username is required when creating a user.',
            }),

            // Password should be required for create and optional for others
            password: Joi.string().min(8).when(Joi.ref('$operation'), {
                is: Joi.valid('create', 'check'),
                then: Joi.required(),
                otherwise: Joi.optional(),
            }).messages({
                'string.min': 'Password must be at least 8 characters long.',
                'any.required': 'Password is required when creating a user.',
            }),
        });

        super('users', userSchema);
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
            logger.debug(`User to check password, email: ${email} Password: ${password}`);
            const validationResult = await super.validateSchema({ email, password }, 'check');
            if (validationResult instanceof Error) throw validationResult;
            const user = await super.findOne({ email });
            logger.debug(`User from find One: ${JSON.stringify(user)}`);

            if (!user) {
                logger.error('User not found');
                return false;
            }

            logger.debug(`User found: ${JSON.stringify(user)}`);

            return bcrypt.compare(password, user.hashed_password)
                .then(result => {
                    logger.debug(`Password compare result: ${result}`);
                    if (!result) {
                        logger.info('Password does not match');
                        return false;
                    }
                    logger.info('Password match');
                    return true;
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
            const hashed_password = await this._hashPassword(newUserData.password);
            newUserData = {
                ...newUserData,
                hashed_password
            };
            delete newUserData.password;
            const validationResult = await super.validateSchema(newUserData);
            logger.debug(`validation result: ${validationResult}`);
            if (validationResult instanceof Error) throw validationResult;
            logger.debug(`userdata to be create: ${JSON.stringify(newUserData)}`);
            return await super.create(newUserData);
        } catch (error) {
            if (!(error instanceof Error)) {
                logger.info('creating Error instance')
                error = new Error(error);
            }
            logger.error(`Error creating new user: ${error.message}`);
            throw error;
        }
    }

    async findUser(userEmail) {
        try {

        } catch (error) {

        }
    }
}
module.exports = UserModel