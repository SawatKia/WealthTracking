const BaseController = require("./BaseController");
const Utils = require("../utilities/Utils");
const BankAccountModel = require("../models/BankAccountModel");
const MyAppErrors = require("../utilities/MyAppErrors");

const { Logger, formatResponse } = Utils;
const logger = Logger("BankAccountController");

class BankAccountController extends BaseController {
    constructor() {
        super();
        this.BankAccountModel = new BankAccountModel();

        this.createBankAccount = this.createBankAccount.bind(this);
        this.getBankAccount = this.getBankAccount.bind(this);
        this.getAllBankAccounts = this.getAllBankAccounts.bind(this);
        this.updateBankAccount = this.updateBankAccount.bind(this);
        this.deleteBankAccount = this.deleteBankAccount.bind(this);
    }
    async createBankAccount(req, res, next) {
        const { account_number, fi_code, national_id, display_name, account_name, balance } = req.body;
        logger.debug(`Destructuring req.body: ${JSON.stringify(req.body)}`);

        const requiredFields = ["account_number", "fi_code", "national_id", "display_name", "account_name", "balance"];
        const convertedBody = super.verifyField(req.body, requiredFields, this.BankAccountModel);

        const currentUser = await super.getCurrentUser(req);
        if (!currentUser) {
            throw MyAppErrors.userNotFound();
        }

        const bankAccountData = {
            ...convertedBody,
            national_id: currentUser.national_id,
        }

        const result = await this.BankAccountModel.create(bankAccountData);
        //TODO - send response
        req.formattedResponse = formatResponse(200, 'Bank account created successfully', result);
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