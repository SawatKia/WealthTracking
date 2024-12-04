const Joi = require("joi");
const BaseModel = require('./BaseModel');
const { Logger } = require('../utilities/Utils');
const redis = require('../services/Redis');
const types = require('../utilities/types.json');
const Redis = require('../services/Redis');
const appConfigs = require('../configs/AppConfigs');

const logger = Logger('TransactionModel');

class TransactionModel extends BaseModel {
  constructor() {
    const transactionSchema = Joi.object({
      transaction_id: Joi.string()
        .uuid()
        .when(Joi.ref("$operation"), {
          is: Joi.valid('create', 'read', 'update', 'delete'),
          then: Joi.required(),
          otherwise: Joi.forbidden(),
        })
        .messages({
          "string.base": "Transaction ID must be a string.",
          "string.uuid": "Transaction ID must be a valid UUID.",
          "any.required": "Transaction ID is required when updating a transaction.",
          "any.forbidden": "Transaction ID should not be provided for this operation.",
        }),

      transaction_datetime: Joi.date()
        .when(Joi.ref("$operation"), {
          is: "create",
          then: Joi.required(),
          otherwise: Joi.optional(),
        })
        .messages({
          "date.base": "Transaction datetime must be a valid date.",
          "any.required":
            "Transaction datetime is required when creating a transaction.",
        }),

      category: Joi.string()
        .valid("Income", "Expense", "Transfer")
        .when(Joi.ref("$operation"), {
          is: "create",
          then: Joi.required(),
          otherwise: Joi.optional(),
        })
        .messages({
          "string.valid": 'Category must be either "Income" or "Expense" or "Transfer".',
          "any.required": "Category is required when creating a transaction.",
        }),

      type: Joi.string()
        .max(20)
        .when(Joi.ref("$operation"), {
          is: "create",
          then: Joi.required(),
          otherwise: Joi.optional(),
        })
        .messages({
          "string.max": "Type must not exceed 20 characters.",
          "any.required": "Type is required when creating a transaction.",
        }),

      amount: Joi.number()
        .precision(2)
        .when(Joi.ref("$operation"), {
          is: "create",
          then: Joi.required(),
          otherwise: Joi.optional(),
        })
        .messages({
          "number.base": "Amount must be a number.",
          "number.precision": "Amount must have at most 2 decimal places.",
          "any.required": "Amount is required when creating a transaction.",
        }),

      note: Joi.string().allow(null, "").optional().messages({
        "string.base": "Note must be a string.",
      }),

      national_id: Joi.string()
        .length(13)
        .pattern(/^[0-9]*$/, "numeric characters only")
        .when(Joi.ref("$operation"), {
          is: "create",
          then: Joi.required(),
          otherwise: Joi.optional(),
        })
        .messages({
          "string.length": "National ID must be 13 characters long.",
          "string.pattern.name":
            "National ID must contain only numeric characters.",
          "any.required": "National ID is required for this operation.",
        }),

      debt_number: Joi.string().max(50).allow(null, "").optional().messages({
        "string.max": "Debt number must not exceed 50 characters.",
      }),

      fi_code: Joi.string().max(20).allow(null, "").optional().messages({
        "string.max":
          "Financial institution code must not exceed 20 characters.",
      }),

      sender_account_number: Joi.string()
        .when('$operation', {
          is: 'update',
          then: Joi.when('category', {
            is: Joi.exist(),  // Only apply this validation if category is being updated
            then: Joi.when('category', {
              is: Joi.valid('Expense', 'Transfer'),
              then: Joi.required(),
              otherwise: Joi.optional()
            }),
            otherwise: Joi.optional()  // If category is not being updated, make it optional
          }),
          otherwise: Joi.when('category', {  // For other operations (create)
            is: Joi.valid('Expense', 'Transfer'),
            then: Joi.required(),
            otherwise: Joi.forbidden()
          })
        })
        .messages({
          'any.required': 'Sender account number is required for Expense and Transfer transactions',
          'any.forbidden': 'Sender account number should not be provided for Income transactions'
        }),

      sender_fi_code: Joi.string()
        .when('$operation', {
          is: 'update',
          then: Joi.when('category', {
            is: Joi.exist(),
            then: Joi.when('category', {
              is: Joi.valid('Expense', 'Transfer'),
              then: Joi.required(),
              otherwise: Joi.optional()
            }),
            otherwise: Joi.optional()
          }),
          otherwise: Joi.when('category', {
            is: Joi.valid('Expense', 'Transfer'),
            then: Joi.required(),
            otherwise: Joi.forbidden()
          })
        })
        .messages({
          'any.required': 'Sender FI code is required for Expense and Transfer transactions',
          'any.forbidden': 'Sender FI code should not be provided for Income transactions'
        }),

      receiver_account_number: Joi.string()
        .when('$operation', {
          is: 'update',
          then: Joi.when('category', {
            is: Joi.exist(),
            then: Joi.when('category', {
              is: Joi.valid('Income', 'Transfer'),
              then: Joi.required(),
              otherwise: Joi.optional()
            }),
            otherwise: Joi.optional()
          }),
          otherwise: Joi.when('category', {
            is: Joi.valid('Income', 'Transfer'),
            then: Joi.required(),
            otherwise: Joi.forbidden()
          })
        })
        .messages({
          'any.required': 'Receiver account number is required for Income and Transfer transactions',
          'any.forbidden': 'Receiver account number should not be provided for Expense transactions'
        }),

      receiver_fi_code: Joi.string()
        .when('$operation', {
          is: 'update',
          then: Joi.when('category', {
            is: Joi.exist(),
            then: Joi.when('category', {
              is: Joi.valid('Income', 'Transfer'),
              then: Joi.required(),
              otherwise: Joi.optional()
            }),
            otherwise: Joi.optional()
          }),
          otherwise: Joi.when('category', {
            is: Joi.valid('Income', 'Transfer'),
            then: Joi.required(),
            otherwise: Joi.forbidden()
          })
        })
        .messages({
          'any.required': 'Receiver FI code is required for Income and Transfer transactions',
          'any.forbidden': 'Receiver FI code should not be provided for Expense transactions'
        })
    });

    super('transactions', transactionSchema);

    if (appConfigs.environment !== 'test') {
      Redis.connect();
    }

    this.cachePrefix = 'transaction:';
    this.cacheDuration = 3600; // 1 hour in seconds
    this.useCache = appConfigs.environment !== 'test';
  }

  // Add a new method to get the complex join query
  getTransactionWithDetailsQuery() {
    return `
      WITH transaction_accounts AS (
        SELECT 
          t.*,
          CASE 
            WHEN t.category = 'Income' THEN 'receiver'
            WHEN t.category = 'Expense' THEN 'sender'
            WHEN t.category = 'Transfer' THEN 
              CASE 
                WHEN ba.account_number = t.sender_account_number AND ba.fi_code = t.sender_fi_code THEN 'sender'
                WHEN ba.account_number = t.receiver_account_number AND ba.fi_code = t.receiver_fi_code THEN 'receiver'
              END
          END as role,
          ba.account_number,
          ba.fi_code,
          ba.display_name,
          ba.account_name,
          fi.name_en as bank_name_en,
          fi.name_th as bank_name_th
        FROM transactions t
        LEFT JOIN bank_accounts ba 
          ON (t.sender_account_number = ba.account_number AND t.sender_fi_code = ba.fi_code)
          OR (t.receiver_account_number = ba.account_number AND t.receiver_fi_code = ba.fi_code)
        LEFT JOIN financial_institutions fi 
          ON ba.fi_code = fi.fi_code
        WHERE t.transaction_id = $1
      )
      SELECT 
        transaction_id,
        transaction_datetime,
        category,
        type,
        amount,
        note,
        national_id,
        CASE 
          WHEN category = 'Income' THEN
            jsonb_build_object(
              'receiver', (
                SELECT jsonb_build_object(
                  'account_number', receiver_account_number,
                  'fi_code', receiver_fi_code,
                  'display_name', display_name,
                  'account_name', account_name,
                  'bank_name_en', bank_name_en,
                  'bank_name_th', bank_name_th
                )
                FROM transaction_accounts 
                WHERE role = 'receiver'
                LIMIT 1
              )
            )
          WHEN category = 'Expense' THEN
            jsonb_build_object(
              'sender', (
                SELECT jsonb_build_object(
                  'account_number', sender_account_number,
                  'fi_code', sender_fi_code,
                  'display_name', display_name,
                  'account_name', account_name,
                  'bank_name_en', bank_name_en,
                  'bank_name_th', bank_name_th
                )
                FROM transaction_accounts 
                WHERE role = 'sender'
                LIMIT 1
              )
            )
          WHEN category = 'Transfer' THEN
            jsonb_build_object(
              'sender', (
                SELECT jsonb_build_object(
                  'account_number', sender_account_number,
                  'fi_code', sender_fi_code,
                  'display_name', display_name,
                  'account_name', account_name,
                  'bank_name_en', bank_name_en,
                  'bank_name_th', bank_name_th
                )
                FROM transaction_accounts 
                WHERE role = 'sender'
                LIMIT 1
              ),
              'receiver', (
                SELECT jsonb_build_object(
                  'account_number', receiver_account_number,
                  'fi_code', receiver_fi_code,
                  'display_name', display_name,
                  'account_name', account_name,
                  'bank_name_en', bank_name_en,
                  'bank_name_th', bank_name_th
                )
                FROM transaction_accounts 
                WHERE role = 'receiver'
                LIMIT 1
              )
            )
        END as account_details
      FROM transaction_accounts
      GROUP BY 
        transaction_id,
        transaction_datetime,
        category,
        type,
        amount,
        note,
        national_id;
    `;
  }

  // Add a method to format transaction data
  formatTransactionData(transaction) {
    const accountDetails = transaction.account_details || {};

    return {
      transaction_id: transaction.transaction_id,
      transaction_datetime: transaction.transaction_datetime,
      category: transaction.category,
      type: transaction.type,
      amount: parseFloat(transaction.amount),
      note: transaction.note,
      national_id: transaction.national_id,
      ...(accountDetails.sender && { sender: accountDetails.sender }),
      ...(accountDetails.receiver && { receiver: accountDetails.receiver })
    };
  }

  async create(data) {
    try {
      logger.info('Creating transaction');
      const transaction = await super.create(data);

      // Cache the new transaction only if not in test environment
      if (this.useCache) {
        const cacheKey = `${this.cachePrefix}${transaction.transaction_id}`;
        await Redis.setJsonEx(cacheKey, transaction, this.cacheDuration);
      }

      // Get the complete transaction details after creation
      // const query = this.getTransactionWithDetailsQuery();
      // const result = await this.executeQuery(query, [transaction.transaction_id]);

      // if (result.rows.length === 0) {
      //   throw new Error('Failed to retrieve created transaction');
      // }

      // return this.formatTransactionData(result.rows[0]);
      return transaction;
    } catch (error) {
      logger.error(`Error creating transaction: ${error.message}`);
      throw error;
    }
  }

  async findOne(primaryKeys) {
    try {
      logger.info('Finding one transaction');

      if (this.useCache) {
        const cacheKey = `${this.cachePrefix}${primaryKeys.transaction_id}`;
        // Try to get from cache first
        const cachedData = await Redis.getJson(cacheKey);
        if (cachedData) {
          logger.info('Transaction found in cache');
          return cachedData;
        }
      }

      // If not in cache or test environment, get from database with joins
      const query = this.getTransactionWithDetailsQuery();
      const result = await this.executeQuery(query, [primaryKeys.transaction_id]);

      if (result.rows.length === 0) {
        return null;
      }

      const formattedTransaction = this.formatTransactionData(result.rows[0]);

      // Cache the formatted transaction if not in test environment
      if (this.useCache) {
        const cacheKey = `${this.cachePrefix}${primaryKeys.transaction_id}`;
        await Redis.setJsonEx(cacheKey, formattedTransaction, this.cacheDuration);
      }

      return formattedTransaction;
    } catch (error) {
      logger.error(`Error finding transaction: ${error.message}`);
      throw error;
    }
  }

  async update(primaryKeys, data) {
    try {
      logger.info('Updating transaction');

      // First update the basic transaction data
      const transaction = await super.update(primaryKeys, data);

      if (transaction) {
        // Get the updated transaction with all joined details
        const query = this.getTransactionWithDetailsQuery();
        const result = await this.executeQuery(query, [primaryKeys.transaction_id]);

        if (result.rows.length > 0) {
          const formattedTransaction = this.formatTransactionData(result.rows[0]);

          // Update cache with the complete transaction data if not in test environment
          if (this.useCache) {
            const cacheKey = `${this.cachePrefix}${primaryKeys.transaction_id}`;
            await Redis.setJsonEx(cacheKey, formattedTransaction, this.cacheDuration);
          }

          return formattedTransaction;
        }
      }

      return transaction;
    } catch (error) {
      logger.error(`Error updating transaction: ${error.message}`);
      throw error;
    }
  }

  async delete(primaryKeys) {
    try {
      logger.info('Deleting transaction');
      const result = await super.delete(primaryKeys);

      if (result && this.useCache) {
        // Remove from cache if not in test environment
        const cacheKey = `${this.cachePrefix}${primaryKeys.transaction_id}`;
        await Redis.delete(cacheKey);
      }

      return result;
    } catch (error) {
      logger.error(`Error deleting transaction: ${error.message}`);
      throw error;
    }
  }
}

module.exports = TransactionModel;
