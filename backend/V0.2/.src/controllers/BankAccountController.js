const BaseController = require("./BaseController");
const Utils = require("../utilities/Utils");
const BankAccountModel = require("../models/BankAccountModel");
const MyAppErrors = require("../utilities/MyAppErrors");
const { ValidationError } = require("../utilities/ValidationErrors");
const FinancialInstitutionModel = require('../models/FinancialInstitutionModel');
const { BankAccountUtils } = require('../utilities/BankAccountUtils');
const UserModel = require('../models/UserModel');

const { Logger, formatResponse } = Utils;
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

            const bankAccounts = await this.BankAccountModel.getAll(currentUser.national_id);
            if (!bankAccounts || bankAccounts.length === 0) {
                throw MyAppErrors.notFound('Bank accounts not found');
            }

            const isOwner = await super.verifyOwnership(currentUser, bankAccounts);
            if (!isOwner) {
                throw MyAppErrors.forbidden('You are not allowed to access this resource');
            }

            req.formattedResponse = formatResponse(200, 'Bank accounts retrieved successfully', { bankAccounts });
            next();
        } catch (error) {
            logger.error(`Failed to retrieve bank accounts: ${error.message}`);
            next(error);
        }
    }

    async getBankAccount(req, res, next) {
        try {
            const requiredFields = ['account_number', 'fi_code'];
            const convertedParams = super.verifyField(req.params, requiredFields, this.BankAccountModel);

            if (!convertedParams.account_number || !convertedParams.fi_code) {
                throw MyAppErrors.badRequest('Account number and financial institution code are required');
            }

            const { account_number, fi_code } = convertedParams;
            const currentUser = await super.getCurrentUser(req);
            if (!currentUser) {
                throw MyAppErrors.userNotFound();
            }

            const bankAccount = await this.BankAccountModel.get(account_number, fi_code);
            if (!bankAccount) {
                throw MyAppErrors.notFound('Bank account not found');
            }

            const isOwner = await super.verifyOwnership(currentUser, [bankAccount]);
            if (!isOwner) {
                throw MyAppErrors.forbidden('You are not allowed to access this resource');
            }

            req.formattedResponse = formatResponse(200, 'Bank account retrieved successfully', { bankAccount });
            next();
        } catch (error) {
            logger.error(`Failed to retrieve bank account: ${error.message}`);
            next(error);
        }
    }


    async updateBankAccount(req, res, next) {
        //TODO - extract query string
        //TODO - verify fields of bank account Pk
        //TODO - destructure req.body
        //TODO - verify existing fields if it valid
        //TODO - get current user
        //TODO - model findOne
        //TODO - not found error
        //TODO - verify ownership
        //TODO - model update
        //TODO - send response
    }

    async deleteBankAccount(req, res, next) {
        //TODO - extract query string
        //TODO - verify fields of bank account Pk
        //TODO - get current user
        //TODO - model findOne
        //TODO - not found error
        //TODO - verify ownership
        //TODO - model delete
        //TODO - send response
    }
}

module.exports = BankAccountController;