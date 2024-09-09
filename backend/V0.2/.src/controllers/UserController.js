require('dotenv').config();
const Utils = require('../utilities/Utils');
const User = require('../models/UserModel');
const BaseController = require('./BaseController');
const logger = Utils.Logger('UserController');
const {
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    MethodNotAllowedError,
    ConflictError,
    PasswordError,
    UserDuplicateError
} = require('../utilities/AppErrors');
const { formatResponse } = Utils;

class UserController extends BaseController {
    constructor() {
        super();
        this.User = new User();
    }

    normalizeUsernameEmail = (username = null, email = null) => {
        logger.info('Normalizing username and email');
        logger.debug(`before norm username: ${username}, email: ${email}`);
        let normalizedData = {};
        if (username) {
            normalizedData['username'] = username.toLowerCase();
        }
        if (email) {
            normalizedData['email'] = email.toLowerCase();
        }
        logger.debug(`normalized data: ${JSON.stringify(normalizedData)}`);
        return normalizedData;
    };

    validateEmail = (email) => {
        logger.info('validateEmail');
        logger.debug(`email: ${email}`);
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        logger.debug(`email regex test: ${emailRegex.test(email)}`);
        return emailRegex.test(email);
    };

    registerUser = async (req, res, next) => {
        try {
            const { username, email, password, confirm_password } = req.body;
            logger.debug(`Destructuring req.body: ${JSON.stringify(req.body)}`);

            // Verify all required fields
            super.verifyField(req.body, ['national_id', 'username', 'email', 'password', 'confirm_password']);

            // Check if passwords match
            if (password !== confirm_password) {
                throw new BadRequestError('Password and confirm password do not match');
            }
            logger.info('password and confirm password match');

            // Validate email format
            if (!this.validateEmail(email)) {
                throw new BadRequestError('Invalid email address');
            }

            // Normalize data
            let normalizedData = this.normalizeUsernameEmail(username, email);
            normalizedData = {
                ...req.body,
                ...normalizedData,
                role: 'user',
                member_since: new Date().toISOString(),
            };
            delete normalizedData['confirm_password'];
            logger.debug(`combined normalized data: ${JSON.stringify(normalizedData)}`);

            // Create user
            const createdUser = await this.User.createUser(normalizedData);
            logger.debug(`createdUser: ${JSON.stringify(createdUser)}`);

            // Success response
            req.formattedResponse = formatResponse(201, 'User created successfully', createdUser);
            next();
        } catch (error) {
            logger.error(`Error registering user: ${error.message}`);

            // Handle specific validation errors
            if (error.message === 'invalid national_id length') {
                next(new BadRequestError('National ID length is invalid'));
            } else if (error.message === 'duplicate key value') {
                next(new UserDuplicateError());
            } else {
                // For all other errors
                next(error);
            }
        }
    };

}

module.exports = UserController;
