const Joi = require('joi');

const BaseModel = require("./BaseModel");
const { Logger } = require("../utilities/Utils");
const logger = Logger("DebtModel");

class DebtModel extends BaseModel {
    constructor() {
        const debtSchema = Joi.object({
            debt_id: Joi.string()
                .max(50)
                .pattern(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/, 'UUID v4 format')
                .when(Joi.ref('$operation'), {
                    is: Joi.valid('create', 'read', 'update', 'delete'),
                    then: Joi.required(),
                    otherwise: Joi.optional(),
                })
                .messages({
                    'string.max': 'Debt ID must not exceed 50 characters.',
                    'string.pattern.name': 'Debt ID must be a valid UUID v4.',
                    'any.required': 'Debt ID is required for this operation.',
                }),

            fi_code: Joi.string()
                .max(20)
                .pattern(/^[0-9]*$/, 'numeric characters only')
                .when(Joi.ref('$operation'), {
                    is: Joi.valid('create'),
                    then: Joi.required(),
                    otherwise: Joi.optional(),
                })
                .messages({
                    'string.max': 'Financial institution code must not exceed 20 characters.',
                    'string.pattern.name': 'Financial institution code must contain only numeric characters.',
                    'any.required': 'Financial institution code is required for this operation.',
                }),

            national_id: Joi.string()
                .length(13)
                .pattern(/^[0-9]*$/, 'numeric characters only')
                .when(Joi.ref('$operation'), {
                    is: Joi.valid('create'),
                    then: Joi.required(),
                    otherwise: Joi.optional(),
                })
                .messages({
                    'string.length': 'National ID must be 13 characters long.',
                    'string.pattern.name': 'National ID must contain only numeric characters.',
                    'any.required': 'National ID is required for this operation.',
                }),

            debt_name: Joi.string()
                .max(100)
                .when(Joi.ref('$operation'), {
                    is: 'create',
                    then: Joi.required(),
                    otherwise: Joi.optional(),
                })
                .messages({
                    'string.max': 'Debt name must not exceed 100 characters.',
                    'any.required': 'Debt name is required when creating a debt.',
                }),

            start_date: Joi.date()
                .when(Joi.ref('$operation'), {
                    is: 'create',
                    then: Joi.required(),
                    otherwise: Joi.optional(),
                })
                .messages({
                    'date.base': 'Start date must be a valid date.',
                    'any.required': 'Start date is required when creating a debt.',
                }),

            current_installment: Joi.number() // งวดปัจจุบัน
                .integer()
                .min(0)
                .when(Joi.ref('$operation'), {
                    is: 'create',
                    then: Joi.required(),
                    otherwise: Joi.optional(),
                })
                .messages({
                    'number.base': 'Current installment must be a number.',
                    'number.integer': 'Current installment must be an integer.',
                    'number.min': 'Current installment cannot be negative.',
                    'any.required': 'Current installment is required when creating a debt.',
                }),

            total_installments: Joi.number() // จำนวนงวดทั้งหมด
                .integer()
                .min(1)
                .when(Joi.ref('$operation'), {
                    is: 'create',
                    then: Joi.required(),
                    otherwise: Joi.optional(),
                })
                .messages({
                    'number.base': 'Total installments must be a number.',
                    'number.integer': 'Total installments must be an integer.',
                    'number.min': 'Total installments must be at least 1.',
                    'any.required': 'Total installments is required when creating a debt.',
                }),

            loan_principle: Joi.number() // เงินต้นที่กู้
                .precision(2)
                .min(0)
                .when(Joi.ref('$operation'), {
                    is: 'create',
                    then: Joi.required(),
                    otherwise: Joi.optional(),
                })
                .messages({
                    'number.base': 'Loan principle must be a number.',
                    'number.precision': 'Loan principle must have at most 2 decimal places.',
                    'number.min': 'Loan principle cannot be negative.',
                    'any.required': 'Loan principle is required when creating a debt.',
                }),

            loan_balance: Joi.number() // เงินต้นคงเหลือ
                .precision(2)
                .min(0)
                .when(Joi.ref('$operation'), {
                    is: 'create',
                    then: Joi.required(),
                    otherwise: Joi.optional(),
                })
                .messages({
                    'number.base': 'Loan balance must be a number.',
                    'number.precision': 'Loan balance must have at most 2 decimal places.',
                    'number.min': 'Loan balance cannot be negative.',
                    'any.required': 'Loan balance is required when creating a debt.',
                }),
        });
        super('debts', debtSchema);
    }

    async createDebt(debtData) {
        try {
            logger.info('creating debt');
            logger.debug(`debtData: ${JSON.stringify(debtData, null, 2)}`);
            if (typeof debtData != "object" || debtData === null) {
                logger.error('debtData is not an object');
                throw new Error('debtData is not an object');
            }
            const validatedDebt = await this.validateSchema(debtData, 'create');
            logger.debug(`validatedDebt: ${JSON.stringify(validatedDebt, null, 2)}`);
            return await super.create(validatedDebt);
        } catch (error) {
            logger.error(`error creating debt: ${error}`);
            throw error;
        }
    }

}

module.exports = DebtModel;