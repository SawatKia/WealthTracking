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

            if (!national_id) {
                logger.error('National ID is required');
                throw new Error('National ID is required');
            }

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
            let paramCount = 1;

            // Add optional expense_type filter
            if (expense_type) {
                paramCount++;
                sql += ` AND expense_type = $${paramCount}`;
                params.push(expense_type);
            }

            // Add optional month filter
            if (month) {
                paramCount++;
                // Handle different date formats
                let parsedMonth;
                try {
                    parsedMonth = new Date(month);
                    if (isNaN(parsedMonth.getTime())) {
                        throw new Error('Invalid date format');
                    }
                } catch (error) {
                    logger.error(`Invalid month format: ${month}`);
                    throw new Error('Invalid month format. Expected ISO date string or Date object');
                }

                sql += ` AND DATE_TRUNC('month', month) = DATE_TRUNC('month', $${paramCount}::timestamp)`;
                params.push(parsedMonth);
            }

            // Add sorting
            sql += ' ORDER BY month DESC';

            logger.debug(`Executing query: ${sql} with params: ${JSON.stringify(params)}`);
            const result = await this.pgClient.query(sql, params);
            logger.debug(`Found ${result.rows.length} budget history records`);

            return result.rows;
        } catch (error) {
            logger.error(`Error in getBudgetHistory: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get budgets for a specific month and national ID
     * @param {Object} params - Query parameters
     * @param {string} params.national_id - User's national ID
     * @param {Date} params.month - Month to query budgets for
     * @returns {Promise<Array>} List of budgets
     */
    async getMonthlyBudgets({ national_id, month }) {
        try {
            logger.info('Getting monthly budgets');
            logger.debug(`Parameters - national_id: ${national_id}, month: ${month}`);

            if (!national_id || typeof national_id !== 'string') {
                throw new Error('National ID is required and must be a string');
            }

            if (!(month instanceof Date)) {
                throw new Error('Month must be a valid Date object');
            }

            const sql = `
                SELECT *
                FROM budgets
                WHERE national_id = $1
                AND DATE_TRUNC('month', month) = DATE_TRUNC('month', $2::timestamp)
                ORDER BY expense_type
            `;

            const result = await this.pgClient.query(sql, [national_id, month]);
            logger.debug(`Found ${result.rows.length} budgets for ${month.toISOString()}`);

            return result.rows;
        } catch (error) {
            logger.error(`Error getting monthly budgets: ${error.message}`);
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
