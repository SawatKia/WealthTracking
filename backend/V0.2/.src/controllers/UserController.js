const fs = require('fs');

const Utils = require('../utilities/Utils');
const UserModel = require('../models/UserModel');
const BaseController = require('./BaseController');
const MyAppErrors = require('../utilities/MyAppErrors')

const { Logger, formatResponse } = Utils;
const logger = Logger('UserController');

class UserController extends BaseController {
    constructor() {
        super();
        this.userModel = new UserModel();

        // Bind all methods to ensure correct 'this' context
        this.normalizeUsernameEmail = this.normalizeUsernameEmail.bind(this);
        this.validateEmail = this.validateEmail.bind(this);
        this.registerUser = this.registerUser.bind(this);
        this.checkPassword = this.checkPassword.bind(this);
        this.getUser = this.getUser.bind(this);
        this.updateUser = this.updateUser.bind(this);
        this.deleteUser = this.deleteUser.bind(this);
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
            await super.verifyField(req.body, requiredFields, this.userModel);
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
            const createdUser = await this.userModel.createUser(normalizedData);
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
            await super.verifyField(req.body, ['email', 'password'], this.userModel);
            const normalizedEmail = this.normalizeUsernameEmail(null, email);
            const { result, user } = await this.userModel.checkPassword(normalizedEmail['email'], password);
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

    async getUser(req, res, next) {
        try {
            const user = await super.getCurrentUser(req);
            req.formattedResponse = formatResponse(200, 'User retrieved successfully', user);
            next();
        }
        catch (error) {
            if (error instanceof MyAppErrors) {
                next(error);
            } else {
                next(MyAppErrors.internalServerError('Error retrieving user', { details: error.message }));
            }
        }
    }

    async updateUser(req, res, next) {
        try {
            logger.info('updateUser');
            logger.debug(`req.body: ${JSON.stringify(req.body)}`);
            const national_id = req.user.sub;
            if (!national_id) {
                throw MyAppErrors.badRequest('National ID is required');
            }
            logger.debug(`national_id: ${national_id}`);
            const user = await this.userModel.findOne({ national_id });
            if (!user) {
                throw MyAppErrors.notFound('User not found');
            }
            // Verify required password field
            await super.verifyField(req.body, ['password'], this.userModel);

            // Check current password
            const { result } = await this.userModel.checkPassword(user.email, req.body.password);
            if (!result) {
                logger.error('Password check failed');
                throw MyAppErrors.passwordError();
            }
            logger.info('Password check successful');

            // Check if there are any fields to update
            const updateFields = { ...req.body };
            delete updateFields.password;  // Remove current password from update fields
            logger.debug(`updateFields request: ${JSON.stringify(updateFields)}`);

            if (Object.keys(updateFields).length === 0) {
                throw MyAppErrors.badRequest('At least one field is required to update user information');
            }

            if (req.file) {
                logger.info('Profile picture file found');
                updateFields.profile_picture_uri = req.file.path;
            }

            // If updating password, verify confirmation matches
            if (updateFields.newPassword) {
                if (updateFields.newPassword !== updateFields.newConfirmPassword) {
                    throw MyAppErrors.badRequest('newPassword and newConfirmPassword do not match');
                }
                // Replace newPassword with password for the model
                updateFields.password = updateFields.newPassword;
            }
            delete updateFields.newPassword;
            delete updateFields.newConfirmPassword;

            // Validate email if provided
            if (updateFields.email && updateFields.email !== '') {
                if (!this.validateEmail(updateFields.email)) {
                    throw MyAppErrors.badRequest('Invalid email');
                }
            }

            // Normalize username and email if provided
            const normalizedData = this.normalizeUsernameEmail(
                updateFields.username,
                updateFields.email
            );

            // Merge normalized data with update fields and filter out empty strings
            const finalUpdateFields = Object.entries({ ...updateFields, ...normalizedData })
                .reduce((acc, [key, value]) => {
                    if (value !== '') {
                        acc[key] = value;
                    }
                    return acc;
                }, {});

            logger.debug(`finalUpdateFields: ${JSON.stringify(finalUpdateFields)}`);

            // Update user in database
            const updatedUser = await this.userModel.updateUser(national_id, finalUpdateFields);

            req.formattedResponse = formatResponse(200, 'User updated successfully', { updatedUser });
            next();
        } catch (error) {
            logger.error(`updateUser error: ${error.message}`);
            // Delete profile picture if it was uploaded but there was an error
            if (req.file && req.file.path) {
                fs.unlink(req.file.path, (err) => {
                    if (err) {
                        logger.error(`Failed to delete profile picture: ${err.message}`);
                    } else {
                        logger.info('Profile picture deleted');
                    }
                });
            }
            if (error.message.includes('Missing required field: ')) {
                next(MyAppErrors.badRequest(error.message));
            } else if (error.message === 'duplicate key value') {
                next(MyAppErrors.userDuplicateError());
            } else if (error instanceof MyAppErrors) {
                next(error);
            } else {
                next(MyAppErrors.internalServerError('Error updating user', { details: error.message }));
            }
        }
    }

    async deleteUser(req, res, next) {
        try {
            logger.info('request received for deleteUser');

            // Get current user
            const user = await super.getCurrentUser(req);
            if (!user) {
                throw MyAppErrors.notFound('User not found');
            }
            logger.debug(`Current user: ${JSON.stringify(user)}`);

            // Verify required password field
            await super.verifyField(req.body, ['password'], this.userModel);
            logger.debug('Required fields verified');

            // Check current password
            const { result } = await this.userModel.checkPassword(user.email, req.body.password);
            if (!result) {
                logger.error('Password check failed');
                throw MyAppErrors.passwordError();
            }
            logger.info('Password check successful');

            // Delete user's profile picture if exists
            if (user.profile_picture_uri) {
                try {
                    await fs.promises.unlink(user.profile_picture_uri);
                    logger.info('Profile picture deleted');
                } catch (err) {
                    logger.error(`Failed to delete profile picture: ${err.message}`);
                    // Continue with user deletion even if profile picture deletion fails
                }
            }

            // Delete user from database
            const deletedUser = await this.userModel.delete({
                national_id: user.national_id
            });

            if (!deletedUser) {
                throw MyAppErrors.notFound('delete user failed');
            }
            logger.info('User deleted successfully');

            // Format success response
            req.formattedResponse = formatResponse(200, 'User deleted successfully');
            next();
        } catch (error) {
            logger.error(`deleteUser error: ${error.message}`);
            if (error.message.includes('Missing required field: ')) {
                next(MyAppErrors.badRequest(error.message));
            } else if (error instanceof MyAppErrors) {
                next(error);
            } else {
                next(MyAppErrors.internalServerError('Error deleting user', { details: error.message }));
            }
        }
    }
}

module.exports = UserController;