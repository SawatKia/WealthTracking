const BaseController = require("./BaseController");
const Utils = require("../utilities/Utils");
const BankAccountModel = require("../models/BankAccountModel");
const MyAppErrors = require("../utilities/MyAppErrors");
const FinancialInstitutionModel = require('../models/FinancialInstitutionModel');
const { BankAccountUtils } = require('../utilities/BankAccountUtils');

const { Logger, formatResponse } = Utils;
const logger = Logger("BankAccountController");

class BankAccountController extends BaseController {
    constructor() {
        super();
        this.BankAccountModel = new BankAccountModel();
        this.FiModel = new FinancialInstitutionModel();
        this.BankAccountUtils = new BankAccountUtils();

        this.createBankAccount = this.createBankAccount.bind(this);
        this.getBankAccount = this.getBankAccount.bind(this);
        this.getAllBankAccounts = this.getAllBankAccounts.bind(this);
        this.updateBankAccount = this.updateBankAccount.bind(this);
        this.deleteBankAccount = this.deleteBankAccount.bind(this);
    }

    async createBankAccount(req, res, next) {
        logger.info('Creating bank account...');
        try {
            const { fi_code, account_number } = req.body;
            logger.debug(`Destructuring req.body: ${JSON.stringify(req.body)}`);

            req.body.account_number = this.BankAccountUtils.normalizeAccountNumber(account_number);
            logger.debug(`req.body after normalized account_number: ${req.body}`);

            const requiredFields = ["account_number", "fi_code", "national_id", "display_name", "account_name", "balance"];
            const convertedBody = super.verifyField(req.body, requiredFields, this.BankAccountModel);

            //TODO - change the method after modifying the BankAccounModel
            const bankData = await this.FiModel.findOne({ fi_code });
            if (!bankData) {
                throw MyAppErrors.notFound('specified fi_code not found. to get list of available fi_code please use /fi/ endpoint');
            }

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

            const result = await this.BankAccountModel.create(bankAccountData);
            req.formattedResponse = formatResponse(201, 'Bank account created successfully', result);
            next();
        } catch (error) {
            logger.error(`Failed to create bank account: ${error.message}`);
            next(error);
        }
    }

    async getAllBankAccounts(req, res, next) {
        //TODO - get current user
        //TODO - model find by user Pk
        //TODO - not found error
        //TODO - verify ownership
        //TODO - send response
    }

    async getBankAccount(req, res, next) {
        //TODO - extract query string
        //TODO - verify fields of bank account Pk
        //TODO - get current user
        //TODO - model find by bank account Pk
        //TODO - not found
        //TODO - verify ownership
        //TODO - send response
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