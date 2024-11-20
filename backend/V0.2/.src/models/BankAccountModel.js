const Joi = require('joi');

const BaseModel = require('./BaseModel');
const { Logger } = require('../utilities/Utils');
const appConfigs = require('../configs/AppConfigs');
const { BankAccountUtils } = require('../utilities/BankAccountUtils');

const logger = Logger('BankAccountModel');

class BankAccountModel extends BaseModel {
    constructor() {
        // TODO - add favourite field
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
                .max(255)
                .when('auth_service', {
                    is: 'local',
                    then: Joi.string().length(13).pattern(/^[0-9]*$/, 'numeric characters only'),
                    otherwise: Joi.string().max(255)
                })
                .when(Joi.ref('$operation'), {
                    is: Joi.valid('create', 'read', 'update', 'delete'),
                    then: Joi.required(),
                    otherwise: Joi.optional(),
                })
                .messages({
                    'string.max': 'National ID cannot exceed 255 characters',
                    'string.length': 'Local auth national ID must be 13 digit characters',
                    'string.pattern.name': 'Local auth national ID must be numeric',
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
            logger.info(`get bankAccount`);
            logger.debug(`accountNumber: ${accountNumber}, fiCode: ${fiCode}`);
            const result = await this.findOne({ account_number: accountNumber, fi_code: fiCode });
            if (result) {
                result.account_number = this.bankAccountUtils.formatAccountNumber(result.account_number, result.fi_code);
                // Convert balance to number, format to 2 decimal places, then back to string
                result.balance = Number(result.balance).toFixed(2).toString();
            }
            return result;
        } catch (error) {
            logger.error(`Error in get method: ${error.message}`);
            throw error;
        }
    }

    async getAll(nationalId) {
        try {
            const results = await this.findAll(nationalId);
            return results.map(account => {
                account.account_number = this.bankAccountUtils.formatAccountNumber(account.account_number, account.fi_code);
                // Convert balance to number, format to 2 decimal places, then back to string
                account.balance = Number(account.balance).toFixed(2).toString();
                return account;
            });
        } catch (error) {
            logger.error(`Error in getAll method: ${error.message}`);
            throw error;
        }
    }
}

module.exports = BankAccountModel

