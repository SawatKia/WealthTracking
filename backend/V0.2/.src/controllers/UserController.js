const Utils = require('../utilities/Utils');
const User = require('../models/UserModel');
const BaseController = require('./BaseController');
const MyAppErrors = require('../utilities/MyAppErrors')

const { Logger, formatResponse } = Utils;
const logger = Logger('UserController');

class UserController extends BaseController {
    constructor() {
        super();
        this.UserModel = new User();

        // Bind all methods to ensure correct 'this' context
        this.normalizeUsernameEmail = this.normalizeUsernameEmail.bind(this);
        this.validateEmail = this.validateEmail.bind(this);
        this.registerUser = this.registerUser.bind(this);
        this.checkPassword = this.checkPassword.bind(this);
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
            const requiredFields = ['national_id', 'username', 'email', 'password', 'confirm_password', 'date_of_birth'];
            await super.verifyField(req.body, requiredFields, this.UserModel);
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
            };
            delete normalizedData['confirm_password'];
            logger.debug(`combined normalized data: ${JSON.stringify(normalizedData)}`);

            // Create user
            const createdUser = await this.UserModel.createUser(normalizedData);
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
            await super.verifyField(req.body, ['email', 'password'], this.UserModel);
            const normalizedEmail = this.normalizeUsernameEmail(null, email);
            const { result, user } = await this.UserModel.checkPassword(normalizedEmail['email'], password);
            logger.debug(`Password check result: ${result}, user: ${JSON.stringify(user)}`);
            if (!result) throw MyAppErrors.passwordError();
            req.formattedResponse = formatResponse(200, 'Password check successful. CAUTION!!: This endpoint is available for development purposes only. Do not rely on it in production. If you have any questions, please contact the developer.', result);
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

module.exports = UserController;