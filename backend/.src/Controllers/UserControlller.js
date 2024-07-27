const UserModel = require("../Models/UserModel");
const BaseController = require("./BaseController");
const Logging = require("../configs/logger");
const { BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError, PasswordError } = require('../utils/error');
const formatResponse = require('../utils/responseFormatter');
const { log } = require("winston");

const logger = new Logging('UserController');

class UserController extends BaseController {
    constructor() {
        super();
        this.UserModel = new UserModel();
    }

    normalizeUsernameEmail(username = null, email = null) {
        logger.info('Normalizing username and email');
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
            const normalizedData = this.normalizeUsernameEmail(newUserData['username'], newUserData['email']);
            newUserData = { ...newUserData, ...normalizedData };
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
            let { username, password } = req.body;
            if (!username || !password) {
                throw new BadRequestError('Username and password are required');
            }
            username = username.toLowerCase();
            logger.debug(`parse request body: ${JSON.stringify(req.body)}`);
            const passwordMatch = await this.UserModel.checkPassword(username, password);
            if (!passwordMatch) {
                logger.error('Invalid username or password');
                throw new PasswordError();
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
            const userData = await this.UserModel.findById(currentUser._Id);
            return user;
        } catch (error) {
            next(error);
        }
    }

    /**
     * Updates a user's information by ID.
     *
     * @param {Object} req - The request object.
     * @param {Object} res - The response object.
     * @param {Function} next - The next middleware function.
     * @returns {Promise<void>} - A promise that resolves when the user is updated.
     * @throws {BadRequestError} - If the user ID is missing, current password is missing, or new password and confirm new password do not match.
     * @throws {NotFoundError} - If the user is not found.
     * @throws {UnauthorizedError} - If the current password is invalid.
     * @throws {Error} - If there is an error updating the user.
     */
    //FIXME - future plan after getCurrentUser is implemented, update to currentUser instetad of update by Id
    // get id from current
    async updateUser(req, res, next) {
        try {
            logger.info('request to /update endpoint');
            if (!req.body.id) {
                throw new BadRequestError("'id' is required");
            }
            const { id, currentPassword, newPassword, confirmNewPassword, newusername, email } = req.body;
            //FIXME - waiting for getCurrentUser to be implemented
            /*NOTE - getCurrentUser is decode the JWT token and return the user data
            * we need to check if the user is authorized to update the user data*/
            // const user = await this.getCurrentUser(req);
            // const id = user._id;
            logger.debug(`parse request body: ${JSON.stringify(req.body)}`);
            const user = await this.UserModel.findById(id);

            if (!user) {
                logger.error('User not found');
                throw new NotFoundError('User not found');
            }
            logger.debug(`user found: ${JSON.stringify(user)}`);

            // Verify that the current password is provided
            if (!currentPassword) {
                throw new BadRequestError("'currentPassword' is required to update user information");
            }
            // Verify the current password
            const passwordMatch = await this.UserModel.checkPassword(user.username, currentPassword);
            if (!passwordMatch) {
                logger.error('Invalid username or password');
                throw new PasswordError();
            }

            // Verify that the new password and confirm new password match
            if (newPassword !== confirmNewPassword) {
                throw new BadRequestError('New password and confirm new password do not match');
            }

            const normalizedData = this.normalizeUsernameEmail(newusername, email);
            const updateFields = { ...normalizedData };
            if (newPassword) updateFields.password = newPassword;
            logger.debug(`Fields and datas to be updated: ${JSON.stringify(updateFields)}`);
            const updatedUser = await this.UserModel.updateById(user._id, updateFields);
            logger.debug(`updated User: ${JSON.stringify(updatedUser)}`);
            res.status(200).json(formatResponse(200, 'User updated successfully', { id: updatedUser._id }));
        } catch (error) {
            logger.error(`Error updating user: ${error.message}`);
            next(error);
        }
    }

    //FIXME - future plan after getCurrentUser is implemented, delete currentUser instetad of delete by Id
    // get id from current
    async deleteUser(req, res, next) {
        try {
            // const user = await this.getCurrentUser(req);
            // const id = user.id
            if (!req.body.id) {
                throw new BadRequestError("'id' is required");
            }
            const { id, currentPassword } = req.body;
            if (!currentPassword) {
                throw new BadRequestError("'currentPassword' is required to delete user");
            }
            const user = await this.UserModel.findById(id);
            if (!user) {
                logger.error('User not found');
                throw new NotFoundError('User not found');
            }
            logger.debug(`user found: ${JSON.stringify(user)}`);
            const passwordMatch = await this.UserModel.checkPassword(user.username, currentPassword);
            if (!passwordMatch) {
                logger.error('Invalid username or password');
                throw new PasswordError();
            }
            const deletedUser = await this.UserModel.deleteById(id);
            logger.debug(`deleted user: ${JSON.stringify(deletedUser)}`);
            res.status(200).json(formatResponse(200, 'User deleted successfully', { id: deletedUser._id }));
        } catch (error) {
            logger.error(`Error deleting user: ${error.message}`);
            next(error);
        }
    }
}

module.exports = UserController;