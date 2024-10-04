const bcrypt = require('bcrypt');
const Joi = require('joi');

const BaseModel = require('./BaseModel');
const Utils = require('../utilities/Utils');
const appConfigs = require('../configs/AppConfigs');

const { Logger, formatResponse } = Utils;
const logger = Logger('UserModel');

class UserModel extends BaseModel {

    constructor() {
        const userSchema = Joi.object({
            national_id: Joi.string()
                .length(13)
                .pattern(/^[0-9]*$/, 'numeric characters only') // Allow only numeric characters
                .when(Joi.ref('$operation'), {
                    is: Joi.valid('create', 'update', 'delete'),
                    then: Joi.required(),
                    otherwise: Joi.optional(),
                })
                .messages({
                    'string.length': 'Invalid national ID',
                    'string.pattern.name': 'Invalid national ID',
                    'any.required': 'National ID is required for this operation.',
                }),
            email: Joi.string()
                .email()
                .pattern(/^[a-zA-Z0-9@.]*$/, 'valid email format') // Prevent special characters outside email format
                .when(Joi.ref('$operation'), {
                    is: Joi.valid('create', 'check'),
                    then: Joi.required(),
                    otherwise: Joi.optional(),
                })
                .messages({
                    'string.email': 'Invalid email',
                    'string.pattern.name': 'Invalid email',
                    'any.required': 'Email is required for this operation.',
                }),

            national_id_or_email: Joi.alternatives().try(
                Joi.ref('national_id'),
                Joi.ref('email'),
            ).when(Joi.ref('$operation'), {
                is: 'read',
                then: Joi.required(),
                otherwise: Joi.optional(),
            }).messages({
                'any.required': 'At least one of national_id or email must be provided when reading a user.',
            }),

            username: Joi.string()
                .alphanum() // Allow only alphanumeric characters
                .pattern(/^[a-zA-Z0-9]*$/, 'alphanumeric characters only') // Prevent special characters
                .when(Joi.ref('$operation'), {
                    is: 'create',
                    then: Joi.required(),
                    otherwise: Joi.optional(),
                })
                .messages({
                    'string.alphanum': 'Invalid username',
                    'any.required': 'Username is required when creating a user.',
                    'string.pattern.name': 'Invalid username',
                }),

            hashed_password: Joi.string()
                .min(8) // Ensure the password has at least 8 characters
                .when(Joi.ref('$operation'), {
                    is: Joi.valid('create', 'update', 'delete'), // Allow password for create, update, and delete operations
                    then: Joi.required(), // Make it required during these operations
                    otherwise: Joi.forbidden(), // Forbid in other operations
                })
                .messages({
                    'string.min': 'Invalid password',
                    'any.required': 'Password is required for this operation.',
                }),

            role: Joi.string()
                .pattern(/^[a-zA-Z0-9]*$/, 'alphanumeric characters only') // Prevent special characters
                .when(Joi.ref('$operation'), {
                    is: 'create',
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
                    is: 'create',
                    then: Joi.required(),
                    otherwise: Joi.optional(),
                })
                .messages({
                    'date.base': 'Member since must be a valid date.',
                    'any.required': 'Member since is required when creating a user.',
                }),
            date_of_birth: Joi.date() // Date fields are allowed
                .when(Joi.ref('$operation'), {
                    is: 'create',
                    then: Joi.required(),
                    otherwise: Joi.optional(),
                })
                .messages({
                    'date.base': 'Invalid date of birth',
                    'any.required': 'Date of birth is required when creating a user.',
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
            logger.debug(`userdata to be create: ${JSON.stringify(newUserData)}`);
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


    /**
     * Finds a user by their national_id or email
     * @param {String} input - the national_id or email to search for
     * @returns {Object} the user object if found, null otherwise
     * @throws {Error} if the input is invalid or the user is not found
     */
    async findByNationalIdOrEmail(input) {
        try {
            logger.info('Finding user by national_id or email');
            logger.debug(`input: ${JSON.stringify(input)}`);

            // Validate input
            const validationResult = await super.validateSchema({
                national_id_or_email: input
            }, { operation: 'read' });
            if (validationResult instanceof Error) {
                logger.warn('Invalid input for finding user');
                throw validationResult;
            }

            // find a user by either national ID or email, without knowing in advance which one is provided.
            const query = `SELECT * FROM users 
            WHERE national_id = $1 OR email = $1
            LIMIT 1`;
            const result = await super.executeQuery(query, [input]);
            // const result = await super.findOne({ national_id: input }) || await super.findOne({ email: input });
            if (!result) {
                logger.warn('User not found');
                return null;
            }
            logger.debug(`result: ${JSON.stringify(result)}`);

            return result;
        } catch (error) {
            logger.error(`Error finding user by national_id or email: ${error.message}`);
            throw error;
        }
    }
}
module.exports = UserModel