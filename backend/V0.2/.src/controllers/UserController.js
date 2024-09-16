const Utils = require('../utilities/Utils');
const User = require('../models/UserModel');
const BaseController = require('./BaseController');
const logger = Utils.Logger('UserController');
const MyAppErrors = require('../utilities/MyAppErrors')
const { formatResponse } = Utils;

class UserController extends BaseController {
    constructor() {
        super();
        this.User = new User();
    }

    normalizeUsernameEmail(username = null, email = null) {
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
    }

    validateEmail(email) {
        logger.info('validateEmail');
        logger.debug(`email: ${email}`);
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        logger.debug(`email regex test: ${emailRegex.test(email)}`);
        return emailRegex.test(email);
    }

    async registerUser(req, res, next) {
        try {
            const { username, email, password, confirm_password } = req.body;
            logger.debug(`Destructuring req.body: ${JSON.stringify(req.body)}`);

            // Verify all required fields
            super.verifyField(req.body, ['national_id', 'username', 'email', 'password', 'confirm_password']);
            // Check if password length is at least 8 characters
            if (password.length < 8) {
                throw MyAppErrors.badRequest('Password must be at least 8 characters long');
            }
            logger.info('password length is at least 8 characters');
            // Check if passwords match
            if (password !== confirm_password) {
                throw MyAppErrors.badRequest('Passwords do not match');
            }
            logger.info('password and confirm password match');

            // Validate email format
            if (!this.validateEmail(email)) {
                throw MyAppErrors.badRequest('Invalid email address');
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
            if (error.message.includes('Missing required field: ')) {
                next(MyAppErrors.badRequest(error.message));
            }
            if (error.message === 'duplicate key value') {
                next(MyAppErrors.userDuplicateError());
            }
            if (error.name === 'ValidationError') {
                next(MyAppErrors.badRequest(error.message));
            }

            next(error);
        }
    }

    async checkPassword(req, res, next) {
        try {
            const { email, password } = req.body;
            logger.debug(`Destructuring req.body: ${JSON.stringify(req.body)}`);
            super.verifyField(req.body, ['email', 'password']);
            const normalizedEmail = this.normalizeUsernameEmail(null, email);
            const { result, user } = await this.User.checkPassword(normalizedEmail['email'], password);
            logger.debug(`Password check result: ${result}, user: ${JSON.stringify(user)}`);
            if (!result) throw MyAppErrors.passwordError();
            req.formattedResponse = formatResponse(200, 'Password check successful', result);
            next();
        }
        catch (error) {
            if (error.message.includes('Missing required field: ')) {
                next(MyAppErrors.badRequest(error.message));
            }
            if (error.name === 'ValidationError') {
                next(MyAppErrors.badRequest(error.message));
            }
            next(error);
        }
    }
}

module.exports = new UserController();