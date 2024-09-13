const bcrypt = require('bcrypt');
const Joi = require('joi');

const BaseModel = require('./BaseModel');
require('dotenv').config();
const Utils = require('../utilities/Utils');
const { ValidationError } = require('../utilities/AppErrors');

const logger = Utils.Logger('UserModel');

class UserModel extends BaseModel {

    constructor() {
        const userSchema = Joi.object({
            national_id: Joi.string().length(13).when(Joi.ref('$operation'), {
                is: Joi.valid('read', 'update', 'delete'),
                then: Joi.required(),
                otherwise: Joi.optional(),
            }).messages({
                'string.length': 'National ID must be 13 characters long.',
                'any.required': 'National ID is required for this operation.',
            }),

            email: Joi.string().email().when(Joi.ref('$operation'), {
                is: Joi.valid('create', 'check'),
                then: Joi.required(),
                otherwise: Joi.optional(),
            }).messages({
                'string.email': 'Email must be a valid email address.',
                'any.required': 'Email is required when creating a user.',
            }),

            username: Joi.string().alphanum().when(Joi.ref('$operation'), {
                is: 'create',
                then: Joi.required(),
                otherwise: Joi.optional(),
            }).messages({
                'string.alphanum': 'Username must contain only alphanumeric characters.',
                'any.required': 'Username is required when creating a user.',
            }),

            hashed_password: Joi.string().min(8).when(Joi.ref('$operation'), {
                is: 'create',
                then: Joi.required(),
                otherwise: Joi.forbidden(), // Don't allow hashed_password for non-create operations
            }).messages({
                'string.min': 'hashed_password must be at least 8 characters long.',
                'any.required': 'hashed_password is required when creating a user.',
            }),

            role: Joi.string().when(Joi.ref('$operation'), {
                is: 'create',
                then: Joi.required(),
                otherwise: Joi.optional(),
            }).messages({
                'string.empty': 'Role is required when creating a user.',
                'any.required': 'Role is required when creating a user.',
            }),

            member_since: Joi.date().when(Joi.ref('$operation'), {
                is: 'create',
                then: Joi.required(),
                otherwise: Joi.optional(),
            }).messages({
                'date.base': 'member_since must be a valid date.',
                'any.required': 'member_since is required when creating a user.',
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


    /**
     * Checks if the provided password matches the one stored for the user
     * @param {string} email - The email of the user to check
     * @param {string} password - The password to check
     * @returns {Promise<boolean>} - The result of the check
     * @throws {Error} - If there is an issue with the check
     */
    async checkPassword(email, password) {
        try {
            logger.info('Checking password');
            logger.debug(`User to check password, email: ${email}`);

            // Validate only the email for this operation
            const validationResult = await super.validateSchema({ email }, 'check');
            if (validationResult instanceof Error) throw validationResult;

            const userObject = await super.findOne({ email });
            if (!userObject) {
                logger.error('User not found');
                return { result: false, user: null };
            }

            logger.debug(`User found: ${JSON.stringify(userObject)}`);
            const passwordMatch = await bcrypt.compare(password, userObject.hashed_password);
            if (!passwordMatch) {
                logger.info('Password does not match');
                return { result: false, user: null };
            }

            logger.info('Password match');
            return { result: true, user: userObject };
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
            // verify if there is a user with this national_id or email
            const userObject = await super.findOne({ national_id: newUserData.national_id }) || await super.findOne({ email: newUserData.email });
            if (userObject) {
                logger.error('User with this national_id or email already exists');
                throw new Error('duplicate key value');
            }
            logger.debug(`userdata to be create: ${JSON.stringify(newUserData)}`);
            let createdResult = await super.create(newUserData);
            createdResult = {
                national_id: createdResult.rows[0].national_id,
                email: createdResult.rows[0].email
            }
            logger.debug(`create result: ${JSON.stringify(createdResult)}`);
            return createdResult;
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