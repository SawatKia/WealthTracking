const UserModel = require("../Models/UserModel");
const BaseController = require("./BaseController");
const Logging = require("../configs/logger");
const { BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError } = require('../utils/error');
const formatResponse = require('../utils/responseFormatter');

const logger = new Logging('UserController');

class UserController extends BaseController {
    constructor() {
        super();
        this.UserModel = new UserModel();
    }

    normalizeUsernameEmail(newUserData) {
        logger.info('Normalizing username and email');
        logger.debug(`newUserData: ${JSON.stringify(newUserData)}`);
        newUserData['username'] = newUserData['username'].toLowerCase();
        newUserData['email'] = newUserData['email'].toLowerCase();
        logger.debug(`normalized newUserData: ${JSON.stringify(newUserData)}`);
        return newUserData;
    }

    validateEmail(email) {
        logger.debug(`email: ${email}`);
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        logger.debug(`email regex test: ${emailRegex.test(email)}`);
        return emailRegex.test(email);
    }

    async register(req, res, next) {
        try {
            logger.info('request to /create endpoint');
            logger.debug(`parse request body: ${JSON.stringify(req.body)}`);
            let newUserData = req.body;
            logger.debug(`newUserData from body: ${JSON.stringify(newUserData)}`);
            const requiredFields = ['username', 'email', 'password', 'confirmPassword'];
            await this.verifyParams(newUserData, requiredFields);
            logger.info('Verifying password matchings');
            if (newUserData['password'] != newUserData['confirmPassword']) {
                logger.error('Password do not match');
                throw new BadRequestError("Password don't match");
            }
            delete newUserData['confirmPassword'];
            logger.info('Verifying email');
            if (!this.validateEmail(newUserData['email'])) {
                logger.error('Invalid email');
                throw new BadRequestError("Invalid email");
            }
            newUserData = this.normalizeUsernameEmail(newUserData);
            newUserData['memberSince'] = new Date();
            logger.debug(`newUserData: ${JSON.stringify(newUserData)}`);
            logger.info('Creating user...');
            const user = await this.UserModel.createUser(newUserData);
            res.status(201).json(formatResponse(201, 'User created successfully', { id: user._id }));
        } catch (error) {
            logger.error(`Error creating user: ${JSON.stringify(error)}`);
            if (error.code === 11000) {
                // Duplicate key error
                next(new ConflictError('Username or email already in use'));
            }
            next(error);
        }
    }

    async checkPassword(req, res, next) {
        try {
            logger.info('request to /login endpoint');
            const { username, password } = req.body;
            logger.debug(`parse request body: ${JSON.stringify(req.body)}`);
            const passwordMatch = await this.UserModel.checkPassword(username, password);
            if (!passwordMatch) {
                logger.error('Incorrect password');
                throw new UnauthorizedError('Username or password is incorrect');
            }
            res.status(200).json(formatResponse(200, 'checkPassword pass'));
        } catch (error) {
            logger.error(`Error checkPassword: ${error.message}`);
            next(error);
        }
    }

    // async getUser(request) {
    //     try {
    //         const user = await this.getCurrentUser(request);
    //         return user;
    //     } catch (error) {
    //         throw error;
    //     }
    // }

    // async updateUser(request) {
    //     try {
    //         const user = await this.getCurrentUser(request);
    //         const requiredFields = ['Username', 'email', 'hashedpassword'];
    //         await this.verifyParams(request.body, requiredFields);
    //         await this.verifyRightToModify(request, user._id);
    //         const updatedUser = await this.UserModel.updateUser(user._id, request.body);
    //         return updatedUser;
    //     } catch (error) {
    //         throw error;
    //     }
    // }

    // async deleteUser(request) {
    //     try {
    //         const user = await this.getCurrentUser(request);
    //         await this.verifyRightToModify(request, user._id);
    //         const deletedUser = await this.UserModel.deleteUser(user._id);
    //         return deletedUser;
    //     } catch (error) {
    //         throw error;
    //     }
    // }
}

module.exports = UserController;