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
}

module.exports = BudgetModel;
