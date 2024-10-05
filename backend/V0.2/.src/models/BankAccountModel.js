const Joi = require('joi');

const BaseModel = require('./BaseModel');
const Utils = require('../utilities/Utils');
const appConfigs = require('../configs/AppConfigs');
const { BankAccountUtils } = require('../utilities/BankAccountUtils');

const { Logger, formatResponse } = Utils;
const logger = Logger('BankAccountModel');

class BankAccountModel extends BaseModel {
    constructor() {
        const bankSchema = Joi.object({
            account_number: Joi.string()
                .max(20)
                .pattern(/^[0-9]*$/, 'numeric characters only')
                .when(Joi.ref('$operation'), {
                    is: Joi.valid('create', 'read', 'update', 'delete'),
                    then: Joi.required(),
                    otherwise: Joi.optional(),
                })
                .messages({
                    'string.max': 'Account number must not exceed 20 characters.',
                    'string.pattern.name': 'Account number must contain only numeric characters.',
                    'any.required': 'Account number is required for this operation.',
                }),

            fi_code: Joi.string()
                .max(20)
                .pattern(/^[0-9]*$/, 'numeric characters only')
                .when(Joi.ref('$operation'), {
                    is: Joi.valid('create', 'read', 'update', 'delete'),
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
                    is: Joi.valid('create', 'read', 'update', 'delete'),
                    then: Joi.required(),
                    otherwise: Joi.optional(),
                })
                .messages({
                    'string.length': 'National ID must be 13 characters long.',
                    'string.pattern.name': 'National ID must contain only numeric characters.',
                    'any.required': 'National ID is required for this operation.',
                }),

            display_name: Joi.string()
                .max(100)
                .when(Joi.ref('$operation'), {
                    is: 'create',
                    then: Joi.required(),
                    otherwise: Joi.optional(),
                })
                .messages({
                    'string.max': 'Display name must not exceed 100 characters.',
                    'any.required': 'Display name is required when creating a bank account.',
                }),

            account_name: Joi.string()
                .max(100)
                .when(Joi.ref('$operation'), {
                    is: 'create',
                    then: Joi.required(),
                    otherwise: Joi.optional(),
                })
                .messages({
                    'string.max': 'Account name must not exceed 100 characters.',
                    'any.required': 'Account name is required when creating a bank account.',
                }),

            balance: Joi.number()
                .precision(2)
                .when(Joi.ref('$operation'), {
                    is: 'create',
                    then: Joi.required(),
                    otherwise: Joi.optional(),
                })
                .messages({
                    'number.base': 'Balance must be a number.',
                    'number.precision': 'Balance must have at most 2 decimal places.',
                    'any.required': 'Balance is required when creating a bank account.',
                }),
        });
        super('bank_accounts', bankSchema);
        this.bankAccountUtils = new BankAccountUtils();
    }

    async get(accountNumber, fiCode) {
        try {
            const result = await this.findOne({ account_number: accountNumber, fi_code: fiCode });
            if (result) {
                result.account_number = this.bankAccountUtils.formatAccountNumber(result.account_number, result.fi_code);
            }
            return result;
        } catch (error) {
            logger.error(`Error in get method: ${error.message}`);
            throw error;
        }
    }

    async getAll(nationalId) {
        try {
            const results = await this.findAll({ national_id: nationalId });
            return results.map(account => {
                account.account_number = this.bankAccountUtils.formatAccountNumber(account.account_number, account.fi_code);
                return account;
            });
        } catch (error) {
            logger.error(`Error in getAll method: ${error.message}`);
            throw error;
        }
    }
}

module.exports = BankAccountModel

