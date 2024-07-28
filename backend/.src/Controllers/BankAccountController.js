const BankAccountModel = require('../Models/BankAccountModel');
const BaseController = require('./BaseController');
const logging = require('../configs/logger');
const formatResponse = require('../utils/responseFormatter');
const MongoObject = require('../Models/MongoObject');
const { BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError, PasswordError, DuplicateError } = require('../utils/error');

const logger = new logging('BankAccountController');

class BankAccountController extends BaseController {
    constructor() {
        super();
        this.BankAccountModel = new BankAccountModel();
    }

    async createBankAccount(req, res, next) {
        try {
            logger.info('Creating a new bank account');
            logger.debug(`Request body: ${JSON.stringify(req.body)}`);

            //FIXME - id should get from getCurrentUser and check if this user exist before creating a bank account
            // const { id } = this.getCurrentUser(req);
            const { userId } = req.params;
            if (!userId) {
                throw new BadRequestError("'UserId' is required");
            }
            //MongoObject has no constructor, so don't need to call new MongoObject()
            const ownerId = MongoObject.toObjectId(userId);
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
                owner: ownerId
            });
            res.status(201).json(formatResponse(201, 'Bank account created successfully', account));
        } catch (error) {
            next(error);
        }
    }
}
module.exports = BankAccountController;