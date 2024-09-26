const BaseController = require("./BaseController");
const Utils = require("../utilities/Utils");
const BankModel = require("../models/BankModel");

const { Logger, formatResponse } = Utils;
const logger = Logger("BankController");

class BankController extends BaseController {
    constructor() {
        super();
        this.BankAccount = BankModel();

        this.createBankAccount = this.createBankAccount.bind(this);
        this.getBankAccount = this.getBankAccount.bind(this);
        this.getAllBankAccounts = this.getAllBankAccounts.bind(this);
        this.updateBankAccount = this.updateBankAccount.bind(this);
        this.deleteBankAccount = this.deleteBankAccount.bind(this);
    }
    async createBankAccount(req, res, next) {
        //TODO - verify field
        //TODO - get current user
        //TODO - model create
        //TODO - send response
    }

    async getAllBankAccounts(req, res, next) {
        //TODO - get current user
        //TODO - model find by user Pk
        //TODO - not found
        //TODO - verify ownership
        //TODO - send response
    }

    async getBankAccount(req, res, next) {
        //TODO - verify fields of bank account Pk
        //TODO - get current user
        //TODO - model find by bank account Pk
        //TODO - not found
        //TODO - verify ownership
        //TODO - send response
    }


    async updateBankAccount(req, res, next) {

    }

    async deleteBankAccount(req, res, next) {

    }
}

module.exports = BankController;