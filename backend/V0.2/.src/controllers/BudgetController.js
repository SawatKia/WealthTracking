const BaseController = require("./BaseController");
const BudgetModel = require("../models/BudgetModel");
const TransactionModel = require("../models/TransactionModel");

const MyAppErrors = require("../utilities/MyAppErrors");
const { ValidationError } = require("../utilities/ValidationErrors");
const { Logger, formatResponse } = require("../utilities/Utils");

const logger = Logger('BudgetController');
const types = require('../../statics/types.json');

class BudgetController extends BaseController {
    constructor() {
        super();
        this.BudgetModel = new BudgetModel();
        this.TransactionModel = new TransactionModel();

        // this.createBudget = this.createBudget.bind(this);
        // this.getBudget = this.getBudget.bind(this);
        // this.getAllBudgets = this.getAllBudgets.bind(this);
        // this.updateBudget = this.updateBudget.bind(this);
        // this.deleteBudget = this.deleteBudget.bind(this);

        // Bind all methods to the class
        Object.getOwnPropertyNames(BudgetController.prototype).forEach(key => {
            if (typeof this[key] === 'function') {
                this[key] = this[key].bind(this);
            }
        });
    }

    async checkAndCreateMonthlyBudgets(nationalId) {
        try {
            logger.info('Checking if new month budgets need to be created');

            // Get the current month's first day
            const currentMonth = new Date();
            currentMonth.setDate(1);
            currentMonth.setHours(0, 0, 0, 0);

            // Check if any budgets exist for current month
            const currentBudgets = await this.BudgetModel.getMonthlyBudgets({
                national_id: nationalId,
                month: currentMonth
            });
            logger.debug(`Current budgets: ${JSON.stringify(currentBudgets)}`);

            if (currentBudgets.length === 0) {
                logger.info('No budgets found for current month, creating new ones');
                await this.BudgetModel.createBudgetsForNewMonth(nationalId);
            }
        } catch (error) {
            logger.error(`Error checking monthly budgets: ${error.message}`);
            throw error;
        }
    }

    async createBudget(req, res, next) {
        try {
            logger.info('Creating budget');
            logger.debug(`Request body: ${JSON.stringify(req.body)}`);
            const requiredFields = ['expense_type', 'monthly_limit'];
            const validatedFields = await super.verifyField(req.body, requiredFields, this.BudgetModel);
            logger.debug(`Validated fields: ${JSON.stringify(validatedFields, null, 2)}`);
            super.verifyType('Expense', validatedFields.expense_type);

            const currentUser = await super.getCurrentUser(req);
            logger.debug(`Current user: ${JSON.stringify(currentUser)}`);

            const current_spending = await this.TransactionModel.getSummaryExpenseOnSpecificMonthByType(currentUser.national_id, validatedFields.expense_type);
            logger.debug(`current_spending: ${JSON.stringify(current_spending)}`);

            const data = {
                ...validatedFields,
                current_spending: current_spending || 0,
                national_id: currentUser.national_id,
                month: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
            logger.debug(`Data to be created: ${JSON.stringify(data, null, 2)}`);
            const budget = await this.BudgetModel.createBudget(data);
            logger.debug(`Budget created: ${JSON.stringify(budget, null, 2)}`);

            req.formattedResponse = formatResponse(201, 'Budget created successfully', budget);
            next();
        } catch (error) {
            logger.error(`Error creating budget: ${error.message}`);
            if (error.message.includes('duplicate key value violates unique constraint')) {
                next(MyAppErrors.badRequest('Budget already exists'));
            } else if (error instanceof MyAppErrors) {
                next(error);
            } else {
                next(MyAppErrors.internalServerError(error.message));
            }
        }
    }

    async getBudget(req, res, next) {
        try {
            logger.info('Getting budget');
            const currentUser = await super.getCurrentUser(req);

            // Check and create new month's budgets if needed
            await this.checkAndCreateMonthlyBudgets(currentUser.national_id);

            // Use query params instead of path params
            const { expenseType } = req.query;
            if (!expenseType) {
                throw MyAppErrors.badRequest('expenseType query parameter is required');
            }
            super.verifyType('Expense', expenseType);

            let budget = await this.BudgetModel.findOne({
                national_id: currentUser.national_id,
                expense_type: expenseType,
                month: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            });
            if (!budget) {
                logger.debug(`budget not found.`);
                throw MyAppErrors.notFound(`Budget not found`);
            }
            logger.debug(`Budget retrieved: ${JSON.stringify(budget)}`);

            const summary = await this.TransactionModel.getSummaryExpenseOnSpecificMonthByType(currentUser.national_id, expenseType);
            logger.debug(`Raw summary expense by type: ${JSON.stringify(summary)}`);

            logger.debug(`budget.current_spending: ${budget.current_spending}`);
            if (!super.verifyOwnership(currentUser, budget)) {
                logger.error('User does not own the budget');
                throw MyAppErrors.unauthorized('You are not authorized to access this budget');
            }
            if (budget.current_spending != summary) {
                logger.info('the cache(current_spending) in budget table and source of truth(summary) in transaction table are different');
                budget.current_spending = summary.total_amount;
                budget = await this.BudgetModel.update({
                    national_id: currentUser.national_id,
                    expense_type: expenseType,
                    month: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                }, { current_spending: summary });
                logger.debug(`updated budget to correct the cache(current_spending): ${JSON.stringify(budget)}`);
            }
            logger.debug(`Budget retrieved: ${JSON.stringify(budget)}`);
            req.formattedResponse = formatResponse(200, 'Budget retrieved successfully', budget);
            next();
        } catch (error) {
            logger.error(`Error getting budget: ${error.message}`);
            if (error.message.includes('Invalid expense type')) {
                next(MyAppErrors.badRequest(error.message));
            } else if (error.message.includes('not found')) {
                next(MyAppErrors.notFound(error.message));
            } else if (error instanceof MyAppErrors) {
                next(error);
            } else {
                next(MyAppErrors.internalServerError(error.message));
            }
        }
    }

    async getAllBudgets(req, res, next) {
        try {
            logger.info('Getting all budgets');
            const currentUser = await super.getCurrentUser(req);

            // Check and create new month's budgets if needed
            await this.checkAndCreateMonthlyBudgets(currentUser.national_id);

            const budgets = await this.BudgetModel.list(currentUser.national_id);
            logger.debug(`Budgets retrieved: ${JSON.stringify(budgets)}`);

            if (budgets.length > 0 && !super.verifyOwnership(currentUser, budgets[0])) {
                logger.error('User does not own the budget');
                throw MyAppErrors.unauthorized('You are not authorized to access this budget');
            }

            const message = budgets.length > 0 ? `${budgets.length} budgets retrieved successfully` : 'No budgets found';
            req.formattedResponse = formatResponse(200, message, budgets);
            next();
        } catch (error) {
            logger.error(`Error getting all budgets: ${error.message}`);
            if (error instanceof MyAppErrors) {
                next(error);
            } else {
                next(MyAppErrors.internalServerError(error.message));
            }
        }
    }

    /**
     * Getting Budgets history for provided query
     * @param {object} req - request
     * @param {string} req.query.budget - get all butget-historys for provided budget
     * @param {number} req.query.month - get budgets and data of each budget for the provided month
     * @param {Object} res - The HTTP response object.
     * @param {function} next - The next middleware function.
     */
    async getBudgetHistory(req, res, next) {
        try {
            logger.info('Getting budget history');
            const currentUser = await super.getCurrentUser(req);

            // Create merged data object with correct national_id
            const dataToValidate = {
                national_id: currentUser.national_id,
                ...req.query  // Add query parameters after to not override national_id
            };

            logger.debug(`Data to validate: ${JSON.stringify(dataToValidate)}`);

            // Validate fields
            const validatedFields = await super.verifyField(
                dataToValidate,
                ['national_id'],
                this.BudgetModel
            );

            // Verify expense type
            if (validatedFields.expenseType) {
                super.verifyType('Expense', validatedFields.expenseType);
            }

            // Format query parameters
            const queryParams = {
                national_id: validatedFields.national_id,
                expense_type: validatedFields.expenseType || undefined,
                month: validatedFields.month ? new Date(validatedFields.month) : undefined
            };

            // Remove undefined values
            Object.keys(queryParams).forEach(key =>
                queryParams[key] === undefined && delete queryParams[key]
            );

            const history = await this.BudgetModel.getBudgetHistory(queryParams);

            const message = history.length > 0
                ? 'Budget history retrieved successfully'
                : 'No budget history found';

            req.formattedResponse = formatResponse(200, message, history);
            next();
        } catch (error) {
            logger.error(`Error getting budget history: ${error.message}`);
            if (error instanceof MyAppErrors) {
                next(error);
            } else if (error.message.includes("Missing required field")) {
                next(MyAppErrors.badRequest(error.message));
            } else {
                next(MyAppErrors.internalServerError(error.message));
            }
        }
    }

    async updateBudget(req, res, next) {
        try {
            logger.info('Updating budget');
            logger.debug(`Request body: ${JSON.stringify(req.body)}`);
            // TODO - use query oaram instead of path param
            const data = {
                ...req.body,
                expense_type: req.params.expenseType
            }
            logger.debug(`new merged data: ${JSON.stringify(data)}`);
            const requiredFields = ['expense_type', 'monthly_limit'];
            const validatedFields = await super.verifyField(data, requiredFields, this.BudgetModel);
            logger.debug('Validated fields: ', JSON.stringify(validatedFields, null, 2));

            super.verifyType('Expense', validatedFields.expense_type);

            const currentUser = await super.getCurrentUser(req);

            logger.info('verifying if budget exists');
            const budget = await this.BudgetModel.findOne({
                national_id: currentUser.national_id,
                expense_type: validatedFields.expense_type,
                month: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            });
            logger.debug(`Budget retrieved: ${JSON.stringify(budget)}`);

            if (!super.verifyOwnership(currentUser, budget)) {
                logger.error('User does not own the budget');
                throw MyAppErrors.unauthorized('You are not authorized to access this budget');
            }

            let updatedBudget;
            if (!budget) {
                logger.warn(`[${validatedFields.expense_type}] budget not found. might be the first time the user is creating a budget for this month, creating new budget`);
                const data = {
                    ...validatedFields,
                    national_id: currentUser.national_id,
                    month: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                }
                logger.debug(`Data to be created: ${JSON.stringify(data)}`);
                updatedBudget = await this.BudgetModel.createBudget(data);
                logger.debug(`created new budget for this month: ${JSON.stringify(updatedBudget)}`);
            } else {
                logger.info(`[${validatedFields.expense_type}] budget of this month found, updating budget`);
                if (Object.values(validatedFields).every(field => field == null || field === undefined)) {
                    throw new Error('At least one field is required for updating');
                }
                logger.debug(`data to be updated: ${JSON.stringify(validatedFields)}`);
                updatedBudget = await this.BudgetModel.update({
                    national_id: currentUser.national_id,
                    expense_type: validatedFields.expense_type,
                    month: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                }, validatedFields);
                logger.debug(`update the budget of this month: ${JSON.stringify(updatedBudget)}`);
            }

            logger.debug(`Budget updated: ${JSON.stringify(updatedBudget)}`);
            req.formattedResponse = formatResponse(200, 'Budget updated successfully', updatedBudget);
            next();
        } catch (error) {
            logger.error(`Error updating budget: ${error.message}`);
            if (error.message.includes('Invalid expense type')) {
                next(MyAppErrors.badRequest(error.message));
            } else if (error instanceof MyAppErrors) {
                next(error);
            } else {
                next(MyAppErrors.internalServerError(error.message));
            }
        }
    }

    async deleteBudget(req, res, next) {
        try {
            logger.info('Deleting budget');
            const currentUser = await super.getCurrentUser(req);

            // TODO - use query oaram instead of path param
            super.verifyType('Expense', req.params.expenseType);

            const budget = await this.BudgetModel.findOne({
                national_id: currentUser.national_id,
                expense_type: req.params.expenseType,
                month: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            });
            if (!budget) {
                logger.debug(`budget not found.`);
                throw MyAppErrors.notFound('Budget not found');
            }
            logger.debug(`budget found: ${JSON.stringify(budget)}`);
            if (!super.verifyOwnership(currentUser, budget)) {
                logger.error('User does not own the budget');
                throw MyAppErrors.unauthorized('You are not authorized to access this budget');
            }
            await this.BudgetModel.delete({
                national_id: currentUser.national_id,
                expense_type: req.params.expenseType,
                month: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            });
            logger.info('Budget deleted');
            req.formattedResponse = formatResponse(200, 'Budget deleted successfully');
            next();
        } catch (error) {
            logger.error(`Error deleting budget: ${error.message}`);
            if (error instanceof MyAppErrors) {
                next(error);
            } else {
                next(MyAppErrors.internalServerError(error.message));
            }
        }
    }
};

module.exports = BudgetController;
