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
            logger.info('Create user...');
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

    /**
     * Check the password for a given username.
     *
     * @param {Object} req - The request object.
     * @param {Object} res - The response object.
     * @param {Function} next - The next middleware function.
     * @returns {Promise<void>} - A promise that resolves when the password check is complete.
     * @throws {UnauthorizedError} - If the username or password is incorrect.
     */
    async checkPassword(req, res, next) {
        try {
            logger.info('request to /checkPassword endpoint');
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


    //TODO - getCurrentUser need to call security.js to decode the JWT token
    async getCurrentUser(req) {
        try {
            const currentUser = await security.getCurrentUser(req);
            const userData = await this.UserModel.findById(currentUser._Id)
            return user;
        } catch (error) {
            next(error);
        }
    }

    async updateUser(req, res, next) {
        try {
            logger.info('request to /update endpoint');
            if (!req.body.id) {
                throw new BadRequestError('User ID is required');
            }
            //FIXME - waititng for getCurrentUser to be implemented
            /*NOTE - getCurrentUser is decode the JWT token and return the user data
            * we need to check if the user is authorized to update the user data*/
            // const user = await this.getCurrentUser(req);
            const { id } = req.body
            logger.debug(`parse request body: ${JSON.stringify(req.body)}`);
            const user = await this.UserModel.findById(id);
            if (!user) {
                logger.error('User not found');
                throw new NotFoundError('User not found');
            }
            logger.debug(`user found: ${JSON.stringify(user)}`);
            const { currentPassword, newPassword, confirmNewPassword, username, email } = req.body;

            // Verify that the current password is provided
            if (!currentPassword) {
                throw new BadRequestError("'currentPassword' is required to update user information");
            }

            // Verify that the new password and confirm new password match
            if (newPassword !== confirmNewPassword) {
                throw new BadRequestError('New password and confirm new password do not match');
            }

            // Verify the current password
            const isPasswordValid = await this.UserModel.checkPassword(user.username, currentPassword);
            if (!isPasswordValid) {
                throw new UnauthorizedError('Invalid current password');
            }

            // Prepare the fields to be updated
            const updateFields = {};
            if (username) updateFields.username = username;
            if (email) updateFields.email = email;
            if (newPassword) updateFields.password = newPassword;
            logger.debug(`Fields to be update: ${JSON.stringify(updateFields)}`);
            // Update the user
            const updatedUser = await this.UserModel.updateById(user._id, updateFields);
            logger.debug(`updated User: ${JSON.stringify(updatedUser)}`);
            res.status(200).json(formatResponse(200, 'User updated successfully', { id: updatedUser._id }));
        } catch (error) {
            logger.error(`Error updating user: ${error.message}`);
            next(error);
        }
    }

    // async deleteUser(req) {
    //     try {
    //         const user = await this.getCurrentUser(req);
    //         await this.verifyRightToModify(req, user._id);
    //         const deletedUser = await this.UserModel.deleteUser(user._id);
    //         return deletedUser;
    //     } catch (error) {
    //         throw error;
    //     }
    // }
}

module.exports = UserController;