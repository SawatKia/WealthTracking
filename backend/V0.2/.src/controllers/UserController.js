const fs = require('fs');
const path = require('path');

const { Logger, formatResponse } = require('../utilities/Utils');
const UserModel = require('../models/UserModel');
const FinancialInstitutionModel = require('../models/FinancialInstitutionModel');
const BankAccountModel = require('../models/BankAccountModel');

const BaseController = require('./BaseController');
const MyAppErrors = require('../utilities/MyAppErrors');
const logger = Logger('UserController');

class UserController extends BaseController {
    constructor() {
        super();
        this.userModel = new UserModel();
        this.bankAccountModel = new BankAccountModel();
        this.fiModel = new FinancialInstitutionModel();
        this.CASH_ACCOUNT_FI_CODE = '000';


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
            logger.info('requesting registerUser');
            const { username, email, password, confirm_password } = req.body;
            logger.debug(`Destructuring req.body: ${JSON.stringify(req.body)}`);

            // Verify all required fields 
            const requiredFields = ['national_id', 'username', 'email', 'password', 'confirm_password'];
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

            const cashFi = await this.fiModel.findOne({ fi_code: this.CASH_ACCOUNT_FI_CODE });
            logger.debug(`cashFi: ${JSON.stringify(cashFi)}`);
            if (!cashFi) {
                logger.error(`${this.CASH_ACCOUNT_FI_CODE} FI code in financial_institutions table NOT FOUND`);
                throw MyAppErrors.notFound(`${this.CASH_ACCOUNT_FI_CODE} FI code not found`);
            }
            // Create default cash account
            const cashAccount = {
                account_number: `${createdUser.national_id}`,
                fi_code: this.CASH_ACCOUNT_FI_CODE,
                national_id: createdUser.national_id,
                display_name: 'เงินสด',
                account_name: 'Cash Account',
                balance: '0.00'
            };

            await this.bankAccountModel.create(cashAccount);
            logger.info('Default cash account created successfully');

            const filteredUser = this.filterUserData(createdUser);

            // Success response
            req.formattedResponse = formatResponse(201, 'User created successfully', filteredUser);
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

            // Filter user data before sending to client
            const filteredUser = this.filterUserData(user);

            req.formattedResponse = formatResponse(200, 'Password check successful', { result, user: filteredUser });
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
            logger.info('request received for getUser');
            const user = await super.getCurrentUser(req);

            // Handle profile picture if it exists
            logger.debug(`Processing profile picture: ${user.profile_picture_uri}`);
            if (user.profile_picture_uri?.startsWith('http')) {
                logger.debug('External profile picture URL detected');
                user.profile_picture_url = user.profile_picture_uri;
                logger.info('profile_picture_url set to external URL');
                delete user.profile_picture_uri;
            } else if (user.profile_picture_uri?.includes('uploads/')) {
                logger.debug(`Processing internal profile picture: ${user.profile_picture_uri}`);
                // Extract the original filename from the stored path
                const pathParts = user.profile_picture_uri.split('/');
                logger.debug(`pathParts: ${pathParts.join(', ')}`);
                const filename = pathParts[pathParts.length - 1];
                logger.debug(`filename: ${filename}`);

                // Split by first two dashes to get the original filename
                const matches = filename.match(/^(\d+)-([^-]+)-(.+)$/);
                logger.debug(`matches: ${JSON.stringify(matches)}`);
                if (matches && matches[2] === user.national_id) {
                    const originalFilename = matches[3];
                    logger.debug(`originalFilename: ${originalFilename}`);
                    // Check if file exists
                    logger.debug(`Checking if file exists: ${user.profile_picture_uri}`);
                    if (fs.existsSync(user.profile_picture_uri)) {
                        // Read and encode the image file
                        const imageBuffer = fs.readFileSync(user.profile_picture_uri);
                        const imageBase64 = imageBuffer.toString('base64');
                        user.profile_picture_data = `data:image/jpeg;base64,${imageBase64}`;
                        user.profile_picture_name = originalFilename;
                        logger.debug(`profile_picture_name: ${user.profile_picture_name}`);
                    } else {
                        logger.warn(`Profile picture file not found: ${user.profile_picture_uri}`);
                        user.profile_picture_uri = null;
                    }
                } else {
                    logger.error('Invalid profile picture filename format or unauthorized access');
                    user.profile_picture_uri = null;
                }
            } else {
                logger.warn('No profile picture to process');
            }
            const filteredUser = this.filterUserData(user);
            logger.debug(`user after profile picture processing: ${JSON.stringify(filteredUser)}`);

            req.formattedResponse = formatResponse(200, 'User retrieved successfully', filteredUser);
            next();
        }
        catch (error) {
            logger.error(`Error in getUser: ${error.message}`);
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
            const user = await super.getCurrentUser(req);
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
            Object.keys(updateFields).forEach((field) => {
                logger.debug(`field: ${field}`);
                if (updateFields[field] === '' || updateFields[field] === null) {
                    logger.debug(`field ${field} is empty or null, deleting the field`);
                    delete updateFields[field];
                }
                if (updateFields.email && !(this.validateEmail(updateFields.email))) {
                    throw MyAppErrors.badRequest('Invalid email');
                }
            });
            logger.debug(`updateFields request: ${JSON.stringify(updateFields)}`);

            const keys = Object.keys({ ...updateFields, ...(req.file ? { file: req.file } : {}) });
            logger.debug(`keys to update: ${keys.join(', ')}`);
            logger.debug(`keys.length: ${keys.length}`);
            if (keys.length === 0) {
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

            // Normalize username and email if provided
            const normalizedData = this.normalizeUsernameEmail(
                updateFields.username,
                updateFields.email
            );

            // Merge normalized data with update fields and filter out empty strings
            const finalUpdateFields = Object.entries({ ...updateFields, ...normalizedData })
                .reduce((acc, [key, value]) => {
                    if (value !== '') {
                        logger.debug(`before handling date_of_birth key: ${key}, value: ${value}`);
                        // Store date_of_birth in UTC
                        if (key === 'date_of_birth') {
                            const date = new Date(value);
                            date.setUTCHours(0, 0, 0, 0);
                            acc[key] = date;
                            logger.debug(`after handling date_of_birth key: ${key}, value: ${date}`);
                        } else {
                            acc[key] = value;
                        }
                    }
                    return acc;
                }, {});

            logger.debug(`finalUpdateFields: ${JSON.stringify(finalUpdateFields)}`);

            // Update user in database
            const updatedUser = await this.userModel.updateUser(user.national_id, finalUpdateFields);
            logger.debug(`updatedUser: ${JSON.stringify(updatedUser)}`);

            const filteredUpdatedUser = this.filterUserData(updatedUser);
            req.formattedResponse = formatResponse(200, 'User updated successfully', filteredUpdatedUser);
            return next();
        } catch (error) {
            logger.error(`updateUser error: ${error.message}`);
            // Delete profile picture if it was uploaded but there was an error
            if (req.file && req.file.path) {
                fs.unlink(req.file.path, (err) => {
                    if (err) {
                        logger.error(`Failed to delete profile picture: ${err.message}`);
                    } else {
                        logger.info('update user error, profile picture deleted');
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

            const filteredDeletedUser = this.filterUserData(deletedUser);
            // Format success response
            req.formattedResponse = formatResponse(200, 'User deleted successfully', filteredDeletedUser);
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