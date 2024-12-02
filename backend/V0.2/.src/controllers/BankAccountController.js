const BaseController = require("./BaseController");
const { Logger, formatResponse } = require("../utilities/Utils");
const BankAccountModel = require("../models/BankAccountModel");
const MyAppErrors = require("../utilities/MyAppErrors");
const { ValidationError } = require("../utilities/ValidationErrors");
const FinancialInstitutionModel = require('../models/FinancialInstitutionModel');
const { BankAccountUtils } = require('../utilities/BankAccountUtils');
const UserModel = require('../models/UserModel');

const logger = Logger("BankAccountController");

class BankAccountController extends BaseController {
    constructor() {
        super();
        this.BankAccountModel = new BankAccountModel();
        this.FiModel = new FinancialInstitutionModel();
        this.BankAccountUtils = new BankAccountUtils();
        this.UserModel = new UserModel();

        this.createBankAccount = this.createBankAccount.bind(this);
        this.getBankAccount = this.getBankAccount.bind(this);
        this.getAllBankAccounts = this.getAllBankAccounts.bind(this);
        this.updateBankAccount = this.updateBankAccount.bind(this);
        this.deleteBankAccount = this.deleteBankAccount.bind(this);
    }

    async createBankAccount(req, res, next) {
        logger.info('Creating bank account...');
        try {
            const { fi_code, account_number, balance } = req.body;
            logger.debug(`Destructuring req.body: ${JSON.stringify(req.body)}`);

            const requiredFields = ["account_number", "fi_code", "display_name", "account_name", "balance"];
            let convertedBody;
            try {
                convertedBody = await super.verifyField(req.body, requiredFields, this.BankAccountModel);
            } catch (error) {
                if (error.message.startsWith('Invalid number format for field:')) {
                    throw new ValidationError(error.message);
                }
                throw error;
            }

            // Verify balance is a valid number
            if (isNaN(parseFloat(balance))) {
                throw new ValidationError("balance must be a valid number.");
            }

            // Verify balance is not negative
            if (parseFloat(balance) < 0) {
                throw new ValidationError("balance must not be negative.");
            }

            // Verify balance has at most 2 decimal places
            if (!/^\d+(\.\d{1,2})?$/.test(balance)) {
                throw new ValidationError("Balance must have at most 2 decimal places.");
            }

            // Clean up the account number before further processing
            const cleanedAccountNumber = this.BankAccountUtils.normalizeAccountNumber(account_number);
            convertedBody.account_number = cleanedAccountNumber;
            logger.debug(`convertedBody after normalized account_number: ${JSON.stringify(convertedBody)}`);
            logger.debug(`Searching for bank data with fi_code: ${fi_code}, type: ${typeof fi_code}`);
            const bankData = await this.FiModel.findOne({ fi_code: fi_code });
            if (!bankData) {
                logger.debug('Bank data not found');
                logger.error(`Financial institution with fi_code '${fi_code}' not found. To get a list of available fi_codes, please use the /fi/ endpoint.`);
                throw MyAppErrors.notFound(`Financial institution with fi_code '${fi_code}' not found. To get a list of available fi_codes, please use the /fi/ endpoint.`);
            }
            logger.debug(`Bank data found: ${JSON.stringify(bankData)}`);

            const currentUser = await super.getCurrentUser(req);
            logger.debug(`Current user: ${JSON.stringify(currentUser)}`);
            if (!currentUser) {
                throw MyAppErrors.userNotFound();
            }

            const bankAccountData = {
                ...convertedBody,
                national_id: currentUser.national_id,
            }
            logger.debug(`bankAccountData to be create: ${JSON.stringify(bankAccountData)}`);

            const createResult = await this.BankAccountModel.create(bankAccountData);
            logger.debug(`createResult: ${JSON.stringify(createResult)}`);
            const result = await this.BankAccountModel.get(createResult.account_number, createResult.fi_code);
            logger.debug(`get create result: ${JSON.stringify(result), null, 2}`);
            req.formattedResponse = formatResponse(201, 'Bank account created successfully', result);
            next();
        } catch (error) {
            logger.error(`Failed to create bank account: ${error.message}`);
            if (error.message.startsWith('Missing required field:')) {
                next(MyAppErrors.badRequest(error.message));
            } else if (error.message.includes('violates foreign key constraint')) {
                next(MyAppErrors.badRequest('Invalid national ID. The user does not exist.'));
            } else if (error.message.includes('duplicate key value') || error.code === '23505') {
                next(MyAppErrors.badRequest('Bank account already exists for this user.'));
            } else if (error.message.includes('Account number should contain only digits or digits with dashes')) {
                next(MyAppErrors.badRequest(error.message));
            } else if (error instanceof ValidationError) {
                next(MyAppErrors.badRequest(error.message));
            } else {
                next(error);
            }
        }
    }

    async getAllBankAccounts(req, res, next) {
        try {
            const currentUser = await super.getCurrentUser(req);
            if (!currentUser) {
                throw MyAppErrors.userNotFound();
            }
            logger.debug(`currentUser: ${JSON.stringify(currentUser)}`);

            logger.info('Retrieving all bank accounts...');
            const bankAccounts = await this.BankAccountModel.getAll(currentUser.national_id);
            if (!bankAccounts || bankAccounts.length === 0) {
                logger.info('No bank accounts found');
                req.formattedResponse = formatResponse(200, 'No bank accounts found', []);
                next();
                return;
            }

            logger.debug(`bankAccounts: ${JSON.stringify(bankAccounts)}`);

            const isOwner = await super.verifyOwnership(currentUser, bankAccounts);
            if (!isOwner) {
                throw MyAppErrors.forbidden('You are not allowed to access this resource');
            }
            const message = `Retrieved ${bankAccounts.length} bank account${bankAccounts.length > 1 ? 's' : ''} successfully`;
            logger.debug(`message: ${message}`);
            req.formattedResponse = formatResponse(200, message, { bankAccounts });
            next();
        } catch (error) {
            logger.error(`Failed to retrieve bank accounts: ${error.message}`);
            next(error);
        }
    }

    async getBankAccount(req, res, next) {
        try {
            logger.info('Getting a bank account...');
            logger.debug(`req.params: ${JSON.stringify(req.params)}`);
            const requiredFields = ['account_number', 'fi_code'];
            const convertedParams = await super.verifyField(req.params, requiredFields, this.BankAccountModel);
            logger.debug(`convertedParams: ${JSON.stringify(convertedParams)}`);

            const { account_number, fi_code } = convertedParams;
            logger.info('extracted params:');
            logger.debug(`account_number: ${account_number}, fi_code: ${fi_code}`);

            const currentUser = await super.getCurrentUser(req);
            if (!currentUser) {
                throw MyAppErrors.userNotFound();
            }
            logger.debug(`currentUser: ${JSON.stringify(currentUser)}`);

            const convertedAccountNumber = this.BankAccountUtils.normalizeAccountNumber(account_number);
            logger.debug(`convertedAccountNumber: ${convertedAccountNumber}`);
            const bankAccount = await this.BankAccountModel.get(convertedAccountNumber, fi_code);
            if (!bankAccount) {
                throw MyAppErrors.notFound('Bank account not found');
            }
            logger.debug(`bankAccount retrieved: ${JSON.stringify(bankAccount)}`);

            const isOwner = await super.verifyOwnership(currentUser, [bankAccount]);
            if (!isOwner) {
                throw MyAppErrors.forbidden('You are not allowed to access this resource');
            }
            logger.debug(`isOwner: ${isOwner}, ${isOwner ? "sending response" : "not sending response"} to client`);
            req.formattedResponse = formatResponse(200, 'Bank account retrieved successfully', { bankAccount });
            next();
        } catch (error) {
            logger.error(`Failed to retrieve bank account: ${error.message}`);
            next(error);
        }
    }

    async updateBankAccount(req, res, next) {
        logger.info('Updating bank account...');
        try {
            // Extract and verify query parameters
            const { account_number, fi_code } = req.params;
            logger.debug(`Params received: account_number=${account_number}, fi_code=${fi_code}`);

            const validationResult = this.BankAccountUtils.validateAccountNumber(account_number, fi_code);
            logger.debug(`validationResult: ${JSON.stringify(validationResult)}`);
            if (!validationResult.isValid) {
                logger.error(`validationResult.isValid is false, throwing badRequest error`);
                throw MyAppErrors.badRequest(validationResult.error);
            }

            const updateData = {
                ...req.body,
                ...req.params
            }
            logger.debug(`RAW updateData: ${JSON.stringify(updateData)}`);

            // Verify required fields in params
            const requiredParams = ['account_number', 'fi_code'];
            let convertedUpdateData;
            try {
                convertedUpdateData = await super.verifyField(updateData, requiredParams, this.BankAccountModel);
                convertedUpdateData.account_number = this.BankAccountUtils.normalizeAccountNumber(convertedUpdateData.account_number);
            } catch (error) {
                throw new ValidationError(error.message);
            }

            Object.keys(convertedUpdateData).forEach((field) => {
                logger.debug(`field: ${field}`);
                if (convertedUpdateData[field] === '' || convertedUpdateData[field] === null) {
                    logger.debug(`field ${field} is empty or null, deleting the field`);
                    delete convertedUpdateData[field];
                }
            });
            logger.debug(`convertedUpdateData after deleting empty fields: ${JSON.stringify(convertedUpdateData)}`);

            // Destructure and validate request body
            if (Object.keys(convertedUpdateData).length === 0) {
                logger.error('convertedUpdateData is empty');
                throw MyAppErrors.badRequest('At least one field is required to update bank account information');
            }

            // Get current user
            const currentUser = await super.getCurrentUser(req);
            if (!currentUser) {
                throw MyAppErrors.userNotFound();
            }
            logger.debug(`currentUser: ${JSON.stringify(currentUser)}`);

            // Find existing bank account
            const existingAccount = await this.BankAccountModel.get(convertedUpdateData.account_number, convertedUpdateData.fi_code);
            logger.debug(`existingAccount: ${JSON.stringify(existingAccount)}`);
            if (!existingAccount) {
                logger.error('existingAccount not found');
                throw MyAppErrors.notFound('Bank account not found');
            }
            logger.info('existingAccount found');

            // Verify ownership
            const isOwner = await super.verifyOwnership(currentUser, [existingAccount]);
            if (!isOwner) {
                logger.error('verifyOwnership failed');
                throw MyAppErrors.forbidden('You are not allowed to access this resource');
            }
            logger.info('verifyOwnership passed');

            // Update bank account
            const primaryKeys = {
                national_id: currentUser.national_id,
                account_number: convertedUpdateData.account_number,
                fi_code: convertedUpdateData.fi_code
            }
            delete convertedUpdateData.account_number;
            delete convertedUpdateData.fi_code;
            let updatedAccount = await this.BankAccountModel.update(
                primaryKeys,
                convertedUpdateData
            );
            logger.debug(`updatedAccount: ${JSON.stringify(updatedAccount)}`);

            if (updatedAccount.account_number) {
                logger.info('account_number was updated, need to format it');
                // Get complete account information after update
                const getUpdatedAccount = await this.BankAccountModel.get(updatedAccount.account_number, updatedAccount.fi_code);
                logger.debug(`getUpdatedAccount: ${JSON.stringify(getUpdatedAccount)}`);

                // Format account number
                updatedAccount.account_number = await this.BankAccountUtils.formatAccountNumber(getUpdatedAccount.account_number, getUpdatedAccount.fi_code);
                logger.debug(`updatedAccount after formatting: ${JSON.stringify(updatedAccount)}`);
            }

            // Format and send response
            req.formattedResponse = formatResponse(
                200,
                'Bank account updated successfully',
                { updatedAccount }
            );
            next();
        } catch (error) {
            logger.error(`Failed to update bank account: ${error.message}`);
            if (error instanceof ValidationError) {
                next(MyAppErrors.badRequest(error.message));
            } else if (error.code === '23505') {
                next(MyAppErrors.conflict('Bank account with these details already exists'));
            } else {
                next(error);
            }
        }
    }

    async deleteBankAccount(req, res, next) {
        logger.info('Deleting bank account...');
        try {
            // Extract and verify query parameters
            const requiredFields = ['account_number', 'fi_code'];
            const convertedParams = await super.verifyField(req.params, requiredFields, this.BankAccountModel);
            logger.debug(`Verified params: ${JSON.stringify(convertedParams)}`);

            // Clean up account number
            const cleanedAccountNumber = this.BankAccountUtils.normalizeAccountNumber(convertedParams.account_number);
            convertedParams.account_number = cleanedAccountNumber;

            // Get current user
            const currentUser = await super.getCurrentUser(req);
            if (!currentUser) {
                throw MyAppErrors.userNotFound();
            }
            logger.debug(`Current user: ${JSON.stringify(currentUser)}`);

            // Find existing bank account
            const existingAccount = await this.BankAccountModel.get(convertedParams.account_number, convertedParams.fi_code);
            if (!existingAccount) {
                throw MyAppErrors.notFound('Bank account not found');
            }
            logger.debug(`Existing account found: ${JSON.stringify(existingAccount)}`);

            // Verify ownership
            const isOwner = await super.verifyOwnership(currentUser, [existingAccount]);
            if (!isOwner) {
                throw MyAppErrors.forbidden('You are not allowed to access this resource');
            }

            // Delete bank account
            await this.BankAccountModel.delete({
                national_id: currentUser.national_id,
                account_number: convertedParams.account_number,
                fi_code: convertedParams.fi_code
            });

            // Format and send response
            req.formattedResponse = formatResponse(200, 'Bank account deleted successfully');
            next();
        } catch (error) {
            logger.error(`Failed to delete bank account: ${error.message}`);
            next(error);
        }
    }
}

module.exports = BankAccountController;