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
            logger.error(`error creating debt: ${error.message}`);
            if (error.message.includes('duplicate key value')) {
                next(MyAppErrors.conflict('debt already exists'));
            } else if (error.message.toLowerCase().includes('missing required field')) {
                next(MyAppErrors.badRequest(error.message));
            } else if (error instanceof ValidationError) {
                next(MyAppErrors.badRequest(error.message));
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
            logger.debug('verifyField successful');
            logger.info('start validating debt_id by uuidValidateV4');
            if (!uuidValidateV4(validatedDebtId.debt_id)) {
                logger.error('invalid debt_id');
                throw MyAppErrors.badRequest('invalid debt_id');
            }
            logger.info('debt_id validated successfully');

            const currentUser = await super.getCurrentUser(req);
            if (!currentUser) {
                logger.error('user not found');
                throw MyAppErrors.unauthorized('user not found');
            }

            const debt = await this.DebtModel.findOne({ debt_id: validatedDebtId.debt_id });
            logger.debug(`debt retrieved: ${JSON.stringify(debt, null, 2)}`);
            if (!debt) {
                logger.info('No debt found');
                req.formattedResponse = formatResponse(200, 'No debt found', null);
                return next();
            }

            if (!super.verifyOwnership(currentUser, debt)) {
                logger.error('user does not own the debt');
                throw MyAppErrors.forbidden('user does not own the debt');
            }

            req.formattedResponse = formatResponse(200, "Debt retrieved successfully", debt);
            next();
        } catch (error) {
            logger.error(`error getting debt: ${error}`);
            if (error instanceof MyAppErrors) {
                next(error);
            } else {
                next(MyAppErrors.internalServerError(error.message));
            }
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

            if (!debts || debts.length === 0) {
                logger.info('No debts found');
                req.formattedResponse = formatResponse(200, 'No debts found', []);
                return next();
            }

            if (!super.verifyOwnership(currentUser, debts)) {
                logger.error('user does not own the debts');
                throw MyAppErrors.forbidden('user does not own the debts');
            }

            const message = `Retrieved ${debts.length} debt${debts.length > 1 ? 's' : ''} successfully`;
            req.formattedResponse = formatResponse(200, message, { debts });
            next();
        } catch (error) {
            logger.error(`error getting all debts: ${error}`);
            if (error instanceof MyAppErrors) {
                next(error);
            } else {
                next(MyAppErrors.internalServerError(error.message));
            }
        }
    }

    async updateDebt(req, res, next) {
        try {
            logger.info('request to update debt');
            const debt_id = req.params.debt_id;
            logger.debug(`debt_id: ${debt_id}`);

            const validatedDebtId = await super.verifyField({ debt_id }, ['debt_id'], this.DebtModel);
            logger.debug(`validatedDebtId: ${validatedDebtId}`);
            if (!uuidValidateV4(validatedDebtId.debt_id)) {
                logger.error('invalid debt_id');
                throw MyAppErrors.badRequest('invalid debt_id');
            }
            logger.info('debt_id validated successfully');

            const debt = await this.DebtModel.findOne({ debt_id: validatedDebtId.debt_id });
            logger.debug(`debt: ${JSON.stringify(debt, null, 2)}`);
            if (!debt) {
                logger.error('the requested debt not found');
                throw MyAppErrors.notFound('the requested debt not found');
            }
            logger.info('the requested debt found');

            const debtData = req.body;
            logger.debug(`extracted debtData: ${JSON.stringify(debtData, null, 2)}`);

            Object.keys(debtData).forEach((field) => {
                logger.debug(`field: ${field}`);
                if (debtData[field] === '' || debtData[field] === null) {
                    logger.debug(`field ${field} is empty or null, deleting the field`);
                    delete debtData[field];
                }
            });
            logger.debug(`debtData after deleting empty fields: ${JSON.stringify(debtData, null, 2)}`);

            const updatedDebt = await this.DebtModel.update({ debt_id: validatedDebtId.debt_id }, debtData);
            logger.debug(`updatedDebt: ${JSON.stringify(updatedDebt, null, 2)}`);

            req.formattedResponse = formatResponse(200, "debt updated successfully", updatedDebt);
            next();
        } catch (error) {
            logger.error(`error updating debt: ${error}`);
            if (error instanceof MyAppErrors) {
                next(error);
            } else if (error instanceof ValidationError) {
                next(MyAppErrors.badRequest(error.message));
            } else {
                next(MyAppErrors.internalServerError(error.message));
            }
        }
    }

    async deleteDebt(req, res, next) {
        try {
            logger.info('request to delete debt');
            const debt_id = req.params.debt_id;
            logger.debug(`debt_id: ${debt_id}`);
            const validatedDebtId = await super.verifyField({ debt_id }, ['debt_id'], this.DebtModel);
            logger.debug(`validatedDebtId: ${validatedDebtId}`);
            if (!uuidValidateV4(validatedDebtId.debt_id)) {
                logger.error('invalid debt_id');
                throw MyAppErrors.badRequest('invalid debt_id');
            }
            logger.info('debt_id validated successfully');

            const debt = await this.DebtModel.findOne({ debt_id: validatedDebtId.debt_id });
            logger.debug(`debt: ${JSON.stringify(debt, null, 2)}`);
            if (!debt) {
                logger.error('the requested debt not found');
                throw MyAppErrors.notFound('the requested debt not found');
            }

            const result = await this.DebtModel.delete({ debt_id: validatedDebtId.debt_id });
            logger.debug(`result: ${JSON.stringify(result, null, 2)}`);

            req.formattedResponse = formatResponse(200, "debt deleted successfully", result);
            next();
        } catch (error) {
            logger.error(`error deleting debt: ${error}`);
            if (error instanceof MyAppErrors) {
                next(error);
            } else {
                next(MyAppErrors.internalServerError(error.message));
            }
        }
    }
}

module.exports = DebtController;