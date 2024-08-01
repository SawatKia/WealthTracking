const BankAccountModel = require('../Models/BankAccountModel');
const BaseController = require('./BaseController');
const logging = require('../configs/logger');
const formatResponse = require('../utils/responseFormatter');
const { BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError, PasswordError, DuplicateError } = require('../utils/error');

const logger = new logging('BankAccountController');

class BankAccountController extends BaseController {
    constructor() {
        super();
        this.BankAccountModel = new BankAccountModel();
    }

    //TODO - complete this after security was implemented
    async verifyRightToModify(request, entityId) {
        //FIXME - check if the current user is the owner of the account
        // const { id } = this.getCurrentUser(request);
        // const account = await this.BankAccountModel.findOne({ _id: entityId });
    }

    async addBankAccount(req, res, next) {
        try {
            logger.info('addBankAccount');
            logger.debug(`Request body: ${JSON.stringify(req.body)}`);

            //FIXME - id should get from getCurrentUser and check if this user exist before creating a bank account
            // const { id } = this.getCurrentUser(req);
            let { userId } = req.params;
            if (!userId) {
                throw new BadRequestError("'UserId' is required");
            }
            if (!this.BankAccountModel.isValidObjectId(userId)) {
                throw new BadRequestError("Invalid 'UserId'");
            }
            userId = this.BankAccountModel.toObjectId(userId);
            const { accountNumber, accountDisplayName, accountName, bankName, balance } = req.body;
            const requiredFields = ['accountNumber', 'accountDisplayName', 'accountName', 'bankName', 'balance'];
            this.verifyBody(req.body, requiredFields);

            const numericBalance = parseFloat(balance);
            const account = await this.BankAccountModel.create({
                accountNumber,
                accountDisplayName,
                accountName,
                bankName,
                balance: numericBalance,
                userId
            });
            const createdId = this.BankAccountModel.toStringId(account._id);
            res.status(201).json(formatResponse(201, 'Bank account created successfully', { id: createdId }));
        } catch (error) {
            next(error);
        }
    }

    async getBankAccountById(req, res, next) {
        try {
            logger.info('getBankAccountById');
            let { accountId } = req.params;
            //FIXME - check if the current user is the owner of the account
            if (!accountId) {
                throw new BadRequestError("'AccountId' is required");
            }
            if (!this.BankAccountModel.isValidObjectId(accountId)) {
                throw new BadRequestError("Invalid 'AccountId'");
            }
            const accountIdObj = this.BankAccountModel.toObjectId(accountId);
            const account = await this.BankAccountModel.findOne({ _id: accountIdObj });
            if (!account) {
                throw new NotFoundError('Bank account not found');
            }
            res.status(200).json(formatResponse(200, `Bank account id ${accountId} retrieved successfully`, account));
        } catch (error) {
            next(error);
        }
    }

    async getBankAccountsByUserId(req, res, next) {
        try {
            logger.info('getBankAccountByUserId');
            let { userId } = req.params;
            //FIXME - check if the current user is the owner of the account
            if (!userId) {
                throw new BadRequestError("'UserId' is required");
            }
            if (!this.BankAccountModel.isValidObjectId(userId)) {
                throw new BadRequestError("Invalid 'UserId'");
            }
            userId = this.BankAccountModel.toObjectId(userId);
            const accounts = await this.BankAccountModel.finds("userId", userId);
            res.status(200).json(formatResponse(200, `Bank accounts of user ${userId} retrieved successfully`, this.BankAccountModel.toObjects(accounts)));
        } catch (error) {

        }
    }

    async updateBankAccount(req, res, next) {
        try {
            logger.info('updateBankAccount');
            let { accountId } = req.params;
            //FIXME - check if the current user is the owner of the account or get the user id from the token
            if (!accountId) {
                throw new BadRequestError("'AccountId' is required");
            }
            if (!this.BankAccountModel.isValidObjectId(accountId)) {
                throw new BadRequestError("Invalid 'AccountId'");
            }
            let { newAccountNumber, newAccountDisplayName, newAccountName, newBankName, newBalance } = req.body;
            if (!newAccountNumber && !newAccountDisplayName && !newAccountName && !newBankName && !newBalance) {
                throw new BadRequestError('At least one field is required to update');
            }
            logger.debug(`Request body: ${JSON.stringify(req.body)}`);
            //FIXME - verify if current user is the owner of the account
            const accountIdObj = this.BankAccountModel.toObjectId(accountId);
            const account = await this.BankAccountModel.findOne({ _id: accountIdObj });
            if (!account) {
                throw new NotFoundError('Bank account not found');
            }
            const updateFields = {
                accountNumber: newAccountNumber || account.accountNumber,
                accountDisplayName: newAccountDisplayName || account.accountDisplayName,
                accountName: newAccountName || account.accountName,
                bankName: newBankName || account.bankName,
                balance: newBalance ? parseFloat(newBalance) : account.balance
            };
            const updatedAccount = await this.BankAccountModel.updateById(accountIdObj, updateFields);
            logger.debug(`Updated account: ${JSON.stringify(updatedAccount)}`);
            res.status(200).json(formatResponse(200, `Bank account id ${accountId} updated successfully`, { updatedAccount: updatedAccount }));
        } catch (error) {
            next(error);
        }
    }
    //FIXME - when user do deposit tranfer or withdraw from transaction must cascade to update the balance of the account
    async deleteBankAccount(req, res, next) {
        //get password
        //check password not null
        // checkPassword
        //delete
    }

}
module.exports = BankAccountController;