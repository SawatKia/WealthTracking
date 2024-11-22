const { v4: uuidv4 } = require('uuid');

const BaseController = require("./BaseController");
const DebtModel = require("../models/DebtModel");

const MyAppErrors = require("../utilities/MyAppErrors");
const { ValidationError } = require("../utilities/ValidationErrors");
const { uuidValidateV4 } = require("../utilities/AuthUtils");
const { Logger, formatResponse } = require("../utilities/Utils");
const logger = Logger("DebtController");

class DebtController extends BaseController {
    constructor() {
        super();
        this.DebtModel = new DebtModel();

        this.createDebt = this.createDebt.bind(this);
        this.getDebt = this.getDebt.bind(this);
        this.getAllDebts = this.getAllDebts.bind(this);
        this.updateDebt = this.updateDebt.bind(this);
        this.deleteDebt = this.deleteDebt.bind(this);
    }

    async createDebt(req, res, next) {
        try {
            logger.info('request to create debt');

            const debtData = req.body;
            logger.debug(`debtData: ${JSON.stringify(debtData, null, 2)}`);
            debtData.debt_id = uuidv4();

            const currentUser = await super.getCurrentUser(req);
            if (!currentUser) {
                logger.error('user not found');
                throw MyAppErrors.unauthorized('user not found');
            }
            debtData.national_id = currentUser.national_id;

            const requiredFields = ['debt_id', 'fi_code', 'national_id', 'debt_name', 'start_date', 'current_installment', 'total_installments', 'loan_principle', 'loan_balance'];
            const validatedDebt = await super.verifyField(debtData, requiredFields, this.DebtModel);


            const debt = await this.DebtModel.findOne({ debt_id: validatedDebt.debt_id });
            logger.debug(`debt: ${JSON.stringify(debt, null, 2)}`);
            if (debt) {
                logger.error('debt already exists');
                throw MyAppErrors.conflict('debt already exists');
            }

            const result = await this.DebtModel.create(validatedDebt);
            req.formattedResponse = formatResponse(201, "debt created successfully", result);
            next();
        } catch (error) {
            logger.error(`error creating debt: ${error}`);
            if (error.message.includes('duplicate key value')) {
                throw MyAppErrors.conflict('debt already exists');
            } else if (error.message.includes('missing required field')) {
                throw MyAppErrors.badRequest(error.message);
            } else if (error instanceof MyAppErrors) {
                next(error);
            } else {
                next(MyAppErrors.internalServerError(error.message));
            }
        }
    }

    async getDebt(req, res, next) {
        try {
            logger.info('request to get debt');
            const debt_id = req.params.debt_id;
            logger.debug(`debt_id: ${debt_id}`);
            const validatedDebtId = await super.verifyField({ debt_id }, ['debt_id'], this.DebtModel);
            if (!uuidValidateV4(validatedDebtId)) {
                logger.error('invalid debt_id');
                throw MyAppErrors.badRequest('invalid debt_id');
            }

            const currentUser = await super.getCurrentUser(req);
            if (!currentUser) {
                logger.error('user not found');
                throw MyAppErrors.unauthorized('user not found');
            }

            const debt = await this.DebtModel.findOne({ debt_id });
            if (!debt) {
                logger.error('debt not found');
                throw MyAppErrors.notFound('debt not found');
            }

            if (!super.verifyOwnership(currentUser, debt)) {
                logger.error('user does not own the debt');
                throw MyAppErrors.forbidden('user does not own the debt');
            }

            req.formattedResponse = formatResponse(200, "debt retrieved successfully", debt);
            next();
        } catch (error) {
            logger.error(`error getting debt: ${error}`);
            next(error);
        }
    }

    async getAllDebts(req, res, next) {
        try {
            logger.info('request to get all debts');
            const currentUser = await super.getCurrentUser(req);
            if (!currentUser) {
                logger.error('user not found');
                throw MyAppErrors.unauthorized('user not found');
            }

            const debts = await this.DebtModel.list(currentUser.national_id);
            logger.debug(`debts: ${JSON.stringify(debts, null, 2)}`);
            if (!debts) {
                logger.error('no debts found');
                throw MyAppErrors.notFound('no debts found');
            }
            if (!super.verifyOwnership(currentUser, debts)) {
                logger.error('user does not own the debts');
                throw MyAppErrors.forbidden('user does not own the debts');
            }
            const message = debts.length > 0 ? `${debts.length} debts retrieved successfully` : "no debts found";
            req.formattedResponse = formatResponse(200, message, debts);
            next();
        } catch (error) {
            logger.error(`error getting all debts: ${error}`);
            next(error);
        }
    }

    async updateDebt(req, res, next) {
    }

    async deleteDebt(req, res, next) {
    }
}

module.exports = DebtController;