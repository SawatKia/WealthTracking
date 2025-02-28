const Joi = require('joi');

const BaseModel = require('./BaseModel');
const { Logger } = require('../utilities/Utils');
const appConfigs = require('../configs/AppConfigs');

const types = require('../../statics/types.json');
const logger = Logger('BudgetModel');

class BudgetModel extends BaseModel {
    constructor() {
        const budgetSchema = Joi.object({
            national_id: Joi.string()
                .max(255)
                .when(Joi.ref('$operation'), {
                    is: Joi.valid('create', 'read', 'update', 'delete'),
                    then: Joi.required(),
                    otherwise: Joi.optional(),
                }),
            expense_type: Joi.string()
                .valid(
                    ...types.Expense
                )
                .when(Joi.ref('$operation'), {
                    is: Joi.valid('create', 'read', 'update', 'delete'),
                    then: Joi.required(),
                    otherwise: Joi.optional(),
                }),
            monthly_limit: Joi.number().precision(2)
                .when(Joi.ref('$operation'), {
                    is: Joi.valid('create'),
                    then: Joi.required(),
                    otherwise: Joi.optional(),
                }),
            current_spending: Joi.number().precision(2).default(0),
            month: Joi.date()
                .when(Joi.ref('$operation'), {
                    is: Joi.valid('create'),
                    then: Joi.required(),
                    otherwise: Joi.optional(),
                }),
            created_at: Joi.date().default(() => new Date()),
            updated_at: Joi.date().default(() => new Date())
        });
        super('budgets', budgetSchema);
    }

    async createBudget(data) {
        try {
            logger.info('Creating new budget');
            if (typeof data !== 'object') {
                logger.error('Invalid data type for createBudget method');
                throw new Error('Invalid data type for createBudget method');
            }

            logger.debug(`data to be create: ${JSON.stringify(data)}`);
            return this.create(data);
        } catch (error) {
            logger.error(`Error in createBudget method: ${error.message}`);
            throw error;
        }
    }

    async getBudgetHistory(query) {
        try {
            logger.info('Getting budget history');
            const { national_id, expense_type, month } = query;

            // Base query
            let sql = `
                SELECT 
                    expense_type,
                    monthly_limit,
                    current_spending,
                    month
                FROM budgets
                WHERE national_id = $1
            `;

            const params = [national_id];

            // Add optional filters
            if (expense_type) {
                sql += ' AND expense_type = $2';
                params.push(expense_type);
            }

            if (month) {
                sql += ' AND EXTRACT(MONTH FROM month) = $' + (params.length + 1);
                params.push(month);
            }

            sql += ' ORDER BY month DESC';

            logger.debug(`Executing query: ${sql} with params: ${JSON.stringify(params)}`);
            const result = await this.pgClient.query(sql, params);

            return result.rows;
        } catch (error) {
            logger.error(`Error in getBudgetHistory: ${error.message}`);
            throw error;
        }
    }

    async createBudgetsForNewMonth(nationalId) {
        try {
            logger.info('Creating budgets for new month');

            // Get previous month's budgets
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            lastMonth.setDate(1); // First day of last month

            const sql = `
                SELECT expense_type, monthly_limit
                FROM budgets
                WHERE national_id = $1
                AND month = $2
            `;

            const params = [nationalId, lastMonth];
            logger.debug(`Fetching last month's budgets with params: ${JSON.stringify(params)}`);

            const result = await this.pgClient.query(sql, params);
            const previousBudgets = result.rows;

            if (previousBudgets.length === 0) {
                logger.info('No previous budgets found');
                return [];
            }

            // Current month date
            const currentMonth = new Date();
            currentMonth.setDate(1); // First day of current month

            // Create new budgets based on previous month's data
            const newBudgets = [];
            for (const budget of previousBudgets) {
                const newBudget = await this.createBudget({
                    national_id: nationalId,
                    expense_type: budget.expense_type,
                    monthly_limit: budget.monthly_limit,
                    current_spending: 0,
                    month: currentMonth
                });
                newBudgets.push(newBudget);
            }

            logger.info(`Created ${newBudgets.length} budgets for new month`);
            return newBudgets;
        } catch (error) {
            logger.error(`Error creating budgets for new month: ${error.message}`);
            throw error;
        }
    }
}

module.exports = BudgetModel;
