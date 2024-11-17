const bcrypt = require('bcrypt');
const Joi = require('joi');

const BaseModel = require('./BaseModel');
const Utils = require('../utilities/Utils');
const appConfigs = require('../configs/AppConfigs');

const { Logger, formatResponse } = Utils;
const logger = Logger('UserModel');

class UserModel extends BaseModel {
    //TODO - add google_id to the schema
    //TODO - user need to have a profile picture, find a way to store it
    constructor() {
        const userSchema = Joi.object({
            national_id: Joi.string()
                .max(255)
                .when('auth_service', {
                    is: 'local',
                    then: Joi.string().length(13).pattern(/^[0-9]*$/, 'numeric characters only'),
                    otherwise: Joi.string().max(255)
                })
                .when(Joi.ref('$operation'), {
                    is: Joi.valid('create', 'read', 'delete', 'google_register'),
                    then: Joi.required(),
                    otherwise: Joi.optional(),
                })
                .messages({
                    'string.max': 'National ID cannot exceed 255 characters',
                    'string.length': 'Local auth national ID must be 13 digit characters',
                    'string.pattern.name': 'Local auth national ID must be numeric',
                    'any.required': 'National ID is required for this operation.',
                }),
            email: Joi.string()
                .email()
                .pattern(/^[a-zA-Z0-9@.]*$/, 'valid email format') // Prevent special characters outside email format
                .when(Joi.ref('$operation'), {
                    is: Joi.valid('create', 'check', 'google_register'),
                    then: Joi.required(),
                    otherwise: Joi.allow('').optional(),
                })
                .messages({
                    'string.email': 'Invalid email',
                    'string.pattern.name': 'Invalid email',
                    'any.required': 'Email is required for this operation.',
                }),

            // national_id_or_email: Joi.alternatives().try(
            //     Joi.ref('national_id'),
            //     Joi.ref('email'),
            // ).when(Joi.ref('$operation'), {
            //     is: 'read',
            //     then: Joi.required(),
            //     otherwise: Joi.optional(),
            // }).messages({
            //     'any.required': 'At least one of national_id or email must be provided when reading a user.',
            // }),

            username: Joi.string()
                .pattern(/^[a-zA-Z0-9_. -]*$/)
                .when(Joi.ref('$operation'), {
                    is: Joi.valid('create', 'google_register'),
                    then: Joi.required(),
                    otherwise: Joi.allow('').optional()
                })
                .messages({
                    'string.pattern.base': 'Invalid username',
                    'any.required': 'Username is required when creating a user.',
                }),

            hashed_password: Joi.string()
                .min(8)
                .when('$operation', {
                    is: Joi.valid('create', 'delete'),
                    then: Joi.when('auth_service', {
                        is: 'local',
                        then: Joi.required(),
                        otherwise: Joi.optional()
                    }),
                    otherwise: Joi.optional()
                })
                .messages({
                    'string.min': 'Invalid password',
                    'any.required': 'Password is required for local authentication.',
                }),

            role: Joi.string()
                .pattern(/^[a-zA-Z0-9]*$/, 'alphanumeric characters only') // Prevent special characters
                .when(Joi.ref('$operation'), {
                    is: Joi.valid('create', 'google_register'),
                    then: Joi.required(),
                    otherwise: Joi.optional(),
                })
                .messages({
                    'string.empty': 'Role is required when creating a user.',
                    'any.required': 'Role is required when creating a user.',
                    'string.pattern.name': 'Role must not contain special characters.',
                }),

            member_since: Joi.date() // Date fields are allowed
                .when(Joi.ref('$operation'), {
                    is: Joi.valid('create', 'google_register'),
                    then: Joi.required(),
                    otherwise: Joi.optional(),
                })
                .messages({
                    'date.base': 'Member since must be a valid date.',
                    'any.required': 'Member since is required when creating a user.',
                }),

            date_of_birth: Joi.date() // Date fields are allowed
                .optional() // Make it optional for all operations
                .messages({
                    'date.base': 'Invalid date of birth',
                }),

            auth_service: Joi.string()
                .valid('local', 'google', 'facebook', 'apple')
                .when(Joi.ref('$operation'), {
                    is: Joi.valid('create', 'google_register'),
                    then: Joi.required(),
                    otherwise: Joi.optional(),
                })
                .messages({
                    'any.required': 'Auth service is required when creating a user from google.',
                }),

            profile_picture_uri: Joi.string()
                .when(Joi.ref('$operation'), {
                    is: Joi.valid('google_register'),
                    then: Joi.required(),
                    otherwise: Joi.optional(),
                })
                .messages({
                    'any.required': 'Profile picture URI is required when creating a user from google.',
                }),
        });

        super('users', userSchema);
        this.saltRounds = parseInt(appConfigs.saltRounds);
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
     * @param {string} password - The plain text password to check
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
            delete userObject.role;
            delete userObject.auth_service;
            delete userObject.hashed_password;
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
            const userObject = await super.findOne({ national_id: newUserData.national_id }) || await super.findOne({ email: newUserData.email });
            if (userObject) {
                logger.error('User with this national_id or email already exists');
                throw new Error('duplicate key value');
            }
            newUserData = {
                ...newUserData,
                auth_service: 'local',
                member_since: new Date().toISOString(),
                role: 'user'
            }
            logger.debug(`userdata to be create: ${JSON.stringify(newUserData)}`);
            const validationResult = await super.validateSchema(newUserData, 'create');
            if (validationResult instanceof Error) {
                logger.error(`Validation error: ${validationResult.message}`);
                throw validationResult;
            }

            let createdResult = await super.create(newUserData);
            createdResult = {
                national_id: createdResult.national_id,
                email: createdResult.email,
                date_of_birth: createdResult.date_of_birth,
            }
            logger.debug(`create result: ${JSON.stringify(createdResult)}`);
            return createdResult;
        } catch (error) {
            if (!(error instanceof Error)) {
                logger.info('creating Error instance')
                error = new Error(error);
            } else if (error.message.includes('check_national_id_length') ||
                error.message.includes('value too long for type character(13)')) {
                throw new Error('invalid national_id length');
            } else if (error.code === '23505') { // Postgres duplicate key error
                throw new Error('duplicate key value');
            }
            logger.error(`Error creating new user: ${error.message}`);
            throw error;
        }
    }

    async createGoogleUser(newUserData) {
        try {
            logger.info('creating google user');
            logger.debug(`newUserData: ${JSON.stringify(newUserData, null, 2)}`);

            // verify if user already exists
            const userObject = await super.findOne({ national_id: newUserData.national_id }) ||
                await super.findOne({ email: newUserData.email });
            if (userObject) {
                logger.error('User with this national_id or email already exists');
                throw new Error('duplicate key value');
            }
            logger.info('user deuplicated not found')

            const userData = {
                ...newUserData,
                auth_service: 'google',
                member_since: new Date().toISOString(),
                role: 'user'
            };

            // validate schema
            const validationResult = await super.validateSchema(userData, 'google_register');
            if (validationResult instanceof Error) {
                logger.error(`Validation error: ${validationResult.message}`);
                throw validationResult;
            }

            // create new user
            const createdResult = await super.create(userData);
            logger.info(`Google user created successfully: ${JSON.stringify(createdResult)}`);
            return createdResult;
        } catch (error) {
            logger.error(`Error creating Google user: ${error.message}`);
            throw error;
        }
    }


    /**
     * Finds a user by their national_id
     * @param {String} national_id - the national_id to search for
     * @returns {Object} the user object if found, null otherwise
     * @throws {Error} if the input is invalid or the user is not found
     */
    async findUser(national_id) {
        try {
            logger.info('Finding user by national_id');
            logger.debug(`national_id: ${JSON.stringify(national_id)}`);

            // Validate input
            const validationResult = await super.validateSchema({ national_id }, 'read');
            if (validationResult instanceof Error) {
                logger.warn('Invalid input for finding user');
                throw validationResult;
            }

            // find a user by national ID
            const query = `SELECT * FROM users 
            WHERE national_id = $1
            LIMIT 1`;
            const result = await super.executeQuery(query, [national_id]);
            const user = result.rows[0];
            if (!user) {
                logger.warn('User not found');
                return null;
            }
            delete user.hashed_password;
            delete user.role;
            delete user.auth_service;
            logger.debug(`user found: ${JSON.stringify(user)}`);
            return user;
        } catch (error) {
            logger.error(`Error finding user by national_id: ${error.message}`);
            throw error;
        }
    }

    async updateUser(national_id, updateFields) {
        logger.info('Updating user');
        logger.debug(`updateFields: ${JSON.stringify(updateFields)}`);
        if (updateFields.password) {
            updateFields.hashed_password = await this._hashPassword(updateFields.password);
            delete updateFields.password;
        }
        const updatedUser = await super.update({ national_id }, updateFields);
        delete updatedUser.national_id;
        delete updatedUser.hashed_password;
        delete updatedUser.role;
        delete updatedUser.auth_service;
        logger.debug(`updatedUser: ${JSON.stringify(updatedUser)}`);
        return updatedUser;
    }

    async delete(primaryKeys) {
        try {
            logger.info('Deleting user');
            logger.debug(`primaryKeys: ${JSON.stringify(primaryKeys, null, 2)}`);

            // Validate the national_id for delete operation
            const validationResult = await super.validateSchema(
                { national_id: primaryKeys.national_id },
                'delete'
            );
            if (validationResult instanceof Error) {
                throw validationResult;
            }

            // Delete the user
            const deletedUser = await super.delete(primaryKeys);
            if (!deletedUser) {
                logger.error('User not found for deletion');
                return null;
            }

            // Remove sensitive data before returning
            delete deletedUser.hashed_password;
            logger.debug(`deletedUser: ${JSON.stringify(deletedUser)}`);
            return deletedUser;
        } catch (error) {
            logger.error(`Error deleting user: ${error.message}`);
            throw error;
        }
    }
}
module.exports = UserModel;