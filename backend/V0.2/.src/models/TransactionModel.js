const Joi = require("joi");
const BaseModel = require('./BaseModel');
const { Logger } = require('../utilities/Utils');
const redis = require('../services/Redis');
const types = require('../../statics/types.json');
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
        .precision(2).positive()
        .when(Joi.ref("$operation"), {
          is: "create",
          then: Joi.required(),
          otherwise: Joi.optional(),
        })
        .messages({
          "number.base": "Amount must be a number.",
          "number.positive": "Amount must be a positive number.",
          "number.precision": "Amount must have at most 2 decimal places.",
          "any.required": "Amount is required when creating a transaction.",
        }),

      note: Joi.string().allow(null, "").optional().messages({
        "string.base": "Note must be a string.",
      }),

      slip_uri: Joi.string().allow(null, "").optional().messages({
        "string.base": "Slip URI must be a string.",
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

      debt_id: Joi.string().max(50).allow(null, "").optional().messages({
        "string.max": "Debt number must not exceed 50 characters.",
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
      WITH transaction_base AS (
  SELECT
    t.transaction_id,
    t.transaction_datetime,
    t.category,
    t.type,
    t.amount,
    t.note,
    t.national_id,
    t.debt_id,
    t.sender_account_number,
    t.sender_fi_code,
    t.receiver_account_number,
    t.receiver_fi_code,
    CASE
      WHEN t.category = 'Income' THEN 'receiver'
      WHEN t.category = 'Expense' THEN 'sender'
      WHEN t.category = 'Transfer' THEN
        CASE
          WHEN t.sender_account_number IS NOT NULL THEN 'sender'
          WHEN t.receiver_account_number IS NOT NULL THEN 'receiver'
        END
    END AS role
  FROM transactions t
  WHERE t.transaction_id = $1
),
transaction_sender AS (
  SELECT
    tb.transaction_id,
    tb.transaction_datetime,
    tb.category,
    tb.type,
    tb.amount,
    tb.note,
    tb.national_id,
    tb.debt_id,
    COALESCE(ba.account_number, tb.sender_account_number) AS sender_account_number,
    COALESCE(ba.fi_code, tb.sender_fi_code) AS sender_fi_code,
    ba.display_name AS sender_display_name,
    ba.account_name AS sender_account_name,
    fi.name_en AS sender_bank_name_en,
    fi.name_th AS sender_bank_name_th
  FROM transaction_base tb
  LEFT JOIN bank_accounts ba
    ON tb.sender_account_number = ba.account_number
    AND tb.sender_fi_code = ba.fi_code
  LEFT JOIN financial_institutions fi
    ON ba.fi_code = fi.fi_code
  WHERE tb.role = 'sender'
),
transaction_receiver AS (
  SELECT
    tb.transaction_id,
    tb.transaction_datetime,
    tb.category,
    tb.type,
    tb.amount,
    tb.note,
    tb.national_id,
    tb.debt_id,
    COALESCE(ba.account_number, tb.receiver_account_number) AS receiver_bank_account_number,
    COALESCE(ba.fi_code, tb.receiver_fi_code) AS receiver_fi_code,
    ba.display_name AS receiver_display_name,
    ba.account_name AS receiver_account_name,
    fi.name_en AS receiver_bank_name_en,
    fi.name_th AS receiver_bank_name_th
  FROM transaction_base tb
  LEFT JOIN bank_accounts ba
    ON tb.receiver_account_number = ba.account_number
    AND tb.receiver_fi_code = ba.fi_code
  LEFT JOIN financial_institutions fi
    ON ba.fi_code = fi.fi_code
  WHERE tb.role = 'receiver'
)
SELECT
  COALESCE(ts.transaction_id, tr.transaction_id) AS transaction_id,
  COALESCE(ts.transaction_datetime, tr.transaction_datetime) AS transaction_datetime,
  COALESCE(ts.category, tr.category) AS category,
  COALESCE(ts.type, tr.type) AS type,
  COALESCE(ts.amount, tr.amount) AS amount,
  COALESCE(ts.note, tr.note) AS note,
  COALESCE(ts.national_id, tr.national_id) AS national_id,
  COALESCE(ts.debt_id, tr.debt_id) AS debt_id,
  CASE
    WHEN COALESCE(ts.category, tr.category) = 'Income' THEN
      jsonb_build_object(
        'receiver', jsonb_build_object(
          'account_number', tr.receiver_bank_account_number,
          'fi_code', tr.receiver_fi_code,
          'display_name', tr.receiver_display_name,
          'account_name', tr.receiver_account_name,
          'bank_name_en', tr.receiver_bank_name_en,
          'bank_name_th', tr.receiver_bank_name_th
        )
      )
    WHEN COALESCE(ts.category, tr.category) = 'Expense' THEN
      jsonb_build_object(
        'sender', jsonb_build_object(
          'account_number', ts.sender_account_number,
          'fi_code', ts.sender_fi_code,
          'display_name', ts.sender_display_name,
          'account_name', ts.sender_account_name,
          'bank_name_en', ts.sender_bank_name_en,
          'bank_name_th', ts.sender_bank_name_th
        )
      )
    WHEN COALESCE(ts.category, tr.category) = 'Transfer' THEN
      jsonb_build_object(
        'sender', jsonb_build_object(
          'account_number', ts.sender_account_number,
          'fi_code', ts.sender_fi_code,
          'display_name', ts.sender_display_name,
          'account_name', ts.sender_account_name,
          'bank_name_en', ts.sender_bank_name_en,
          'bank_name_th', ts.sender_bank_name_th
        ),
        'receiver', jsonb_build_object(
          'account_number', tr.receiver_bank_account_number,
          'fi_code', tr.receiver_fi_code,
          'display_name', tr.receiver_display_name,
          'account_name', tr.receiver_account_name,
          'bank_name_en', tr.receiver_bank_name_en,
          'bank_name_th', tr.receiver_bank_name_th
        )
      )
  END AS account_details
FROM transaction_sender ts
FULL OUTER JOIN transaction_receiver tr ON ts.transaction_id = tr.transaction_id;

    `;
  }

  // Add a method to format transaction data
  formatTransactionData(transaction) {
    let sender = null;
    let receiver = null;

    if (transaction.category === 'Expense') {
      sender = transaction.account_details?.sender ? {
        account_number: transaction.account_details.sender.account_number,
        fi_code: transaction.account_details.sender.fi_code,
        display_name: transaction.account_details.sender.display_name,
        account_name: transaction.account_details.sender.account_name,
        bank_name_en: transaction.account_details.sender.bank_name_en,
        bank_name_th: transaction.account_details.sender.bank_name_th
      } : null;
    } else if (transaction.category === 'Income') {
      receiver = transaction.account_details?.receiver ? {
        account_number: transaction.account_details.receiver.account_number,
        fi_code: transaction.account_details.receiver.fi_code,
        display_name: transaction.account_details.receiver.display_name,
        account_name: transaction.account_details.receiver.account_name,
        bank_name_en: transaction.account_details.receiver.bank_name_en,
        bank_name_th: transaction.account_details.receiver.bank_name_th
      } : null;
    } else if (transaction.category === 'Transfer') {
      sender = transaction.account_details?.sender ? {
        account_number: transaction.account_details.sender.account_number,
        fi_code: transaction.account_details.sender.fi_code,
        display_name: transaction.account_details.sender.display_name,
        account_name: transaction.account_details.sender.account_name,
        bank_name_en: transaction.account_details.sender.bank_name_en,
        bank_name_th: transaction.account_details.sender.bank_name_th
      } : null;
      receiver = transaction.account_details?.receiver ? {
        account_number: transaction.account_details.receiver.account_number,
        fi_code: transaction.account_details.receiver.fi_code,
        display_name: transaction.account_details.receiver.display_name,
        account_name: transaction.account_details.receiver.account_name,
        bank_name_en: transaction.account_details.receiver.bank_name_en,
        bank_name_th: transaction.account_details.receiver.bank_name_th
      } : null;
    }

    return {
      transaction_id: transaction.transaction_id,
      transaction_datetime: transaction.transaction_datetime,
      category: transaction.category,
      type: transaction.type,
      amount: parseFloat(transaction.amount),
      note: transaction.note,
      national_id: transaction.national_id,
      debt_id: transaction.debt_id,
      ...(sender && { sender }),
      ...(receiver && { receiver })
    };
  }

  /**
   * Create a new transaction record
   * @param {Object} data - Transaction data to be created
   * @param {Object} [options={ silent: false }] - Options for the create operation
   * @param {boolean} [options.silent=false] - Whether to log the transaction creation
   * @returns {Promise<Object>} The created transaction with all joined details
   */
  async create(data, options = { silent: false }) {
    try {
      logger.info('Creating transaction');
      const transaction = await super.create(data, options);

      // Get the complete transaction details after creation
      const query = this.getTransactionWithDetailsQuery();
      const result = await this.executeQuery(query, [transaction.transaction_id], { silent: true });
      logger.silly(`joined created transaction: ${JSON.stringify(result)}`);

      if (result.rows.length === 0) {
        throw new Error('Failed to retrieve created transaction');
      }

      const formattedTransaction = this.formatTransactionData(result.rows[0]);

      if (this.useCache) {
        const cacheKey = `${this.cachePrefix}${transaction.transaction_id}`;
        logger.debug(`caching created transaction => ${cacheKey}: ${JSON.stringify(formattedTransaction, null, 2)}`);
        await Redis.setJsonEx(cacheKey, formattedTransaction, this.cacheDuration);
      }

      return formattedTransaction;
      // return transaction;
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
      const result = await this.executeQuery(query, [primaryKeys.transaction_id], { silent: true });

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

  async list(nationalId) {
    try {
      logger.info('Listing transactions');
      // const result = await super.list(nationalId);
      const query = `
        SELECT
          *
        FROM
          transactions
        WHERE
          national_id = $1
        ORDER BY
          transaction_datetime DESC`;
      let result = await super.executeQuery(query, [nationalId], { silent: true });
      result = result.rows;
      result = result.length > 500 ? `${result.slice(0, 497)}... [truncated]` : result;
      logger.debug(`result: ${JSON.stringify(result)}`);

      // Fix: Use Promise.all with map to handle async operations
      const transactions = await Promise.all(
        result.map(async (transaction) => {
          const query = this.getTransactionWithDetailsQuery();
          const result = await this.executeQuery(query, [transaction.transaction_id], { silent: true });
          return this.formatTransactionData(result.rows[0]);
        })
      );

      const transactionString = JSON.stringify(transactions);
      const truncatedString = transactionString.length > 500 ? `${transactionString.slice(0, 497)}... [truncated]` : transactionString;
      logger.debug(`transactions: ${truncatedString}`);
      return transactions;
    } catch (error) {
      logger.error(`Error listing transactions: ${error.message}`);
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
        const result = await this.executeQuery(query, [primaryKeys.transaction_id], { silent: true });

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

  async getAllTransactionsForAccount(accountNumber, fiCode) {
    try {
      logger.info(`Getting all transactions for account: ${accountNumber}, FI: ${fiCode}`);

      const query = `
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
          WHERE (t.sender_account_number = $1 AND t.sender_fi_code = $2)
            OR (t.receiver_account_number = $1 AND t.receiver_fi_code = $2)
        )
        SELECT 
          transaction_id,
          transaction_datetime,
          category,
          type,
          amount,
          note,
          national_id,
          debt_id,
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
          national_id,
          debt_id
        ORDER BY transaction_datetime DESC;
      `;
      const result = await this.executeQuery(query, [accountNumber, fiCode], { silent: true });
      logger.debug(`query result before formatting a transaction: ${JSON.stringify(result.rows)}`)

      return result.rows.map(transaction => this.formatTransactionData(transaction));
    } catch (error) {
      logger.error(`Error getting transactions for account: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get monthly transaction summary
   * @param {string} nationalId - National ID of the user
   * @param {string} type - Type of transactions. if null, get all type
   * @param {number} monthCount - Number of months to get summary. default is 12
   * @returns {Promise<Array<Object>>} - Monthly summary by type
   * @example
   * // Get monthly summary for current month
   * await getMonthlySummary('1234567890123');
   * // Get monthly summary for current month for income type
   * await getMonthlySummary('1234567890123', 'Income');
   * // Get monthly summary for last 6 months
   * await getMonthlySummary('1234567890123', null, 6);
   */
  async getMonthlySummary(nationalId, type = null, monthCount = 12) {
    try {
      logger.info('Getting monthly transaction summary');
      logger.debug(`Parameters: nationalId=${nationalId}, type=${type}, monthCount=${monthCount}`);

      const typeCondition = type ? 'AND type = $2' : '';
      const params = type ? [nationalId, type] : [nationalId];

      const query = `
        WITH months AS (
          SELECT generate_series(
            date_trunc('month', current_date) - interval '${monthCount - 1} months',
            date_trunc('month', current_date),
            interval '1 month'
          )::date AS month_start
        ),
        monthly_totals AS (
          SELECT 
            date_trunc('month', transaction_datetime)::date AS month_start,
            category,
            COALESCE(SUM(amount), 0) as total_amount
          FROM transactions
          WHERE national_id = $1
          ${typeCondition}
          AND transaction_datetime >= date_trunc('month', current_date - interval '${monthCount - 1} months')
          GROUP BY 
            date_trunc('month', transaction_datetime)::date,
            category
        )
        SELECT 
          to_char(months.month_start, 'YYYY-MM-DD') as month,
          COALESCE(SUM(CASE WHEN mt.category = 'Income' THEN mt.total_amount ELSE 0 END), 0) as income,
          COALESCE(SUM(CASE WHEN mt.category = 'Expense' THEN mt.total_amount ELSE 0 END), 0) as expense
        FROM months
        LEFT JOIN monthly_totals mt ON months.month_start = mt.month_start
        GROUP BY months.month_start
        ORDER BY months.month_start ASC;
      `;

      const result = await this.executeQuery(query, params);

      return result.rows.map(row => ({
        month: row.month,
        summary: {
          income: parseFloat(row.income),
          expense: parseFloat(row.expense),
          balance: parseFloat((parseFloat(row.income) - parseFloat(row.expense)).toFixed(2))
        }
      }));
    } catch (error) {
      logger.error(`Error getting monthly summary: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get transaction summary by type for a specific month
   * @param {string} nationalId - National ID of the user
   * @param {string|null} type - Specific transaction type to filter by. If null, returns summary for all types
   * @param {number|null} month - Month number (1-12). If null, uses current month
   * @returns {Promise<Array<{type: string, totalAmount: number}>|number>} 
   *          - If type is null: Returns array of summaries for all types
   *          - If type is specified: Returns total amount for that specific type
   * @throws {Error} If national ID is missing or month is invalid
   * @example
   * // Get summary for all types in current month
   * await getSummaryExpenseOnSpecificMonthByType('1234567890123');
   * // Get summary for all types in March
   * await getSummaryExpenseOnSpecificMonthByType('1234567890123', null, 3);
   * // Get summary for 'Food' type in current month
   * await getSummaryExpenseOnSpecificMonthByType('1234567890123', 'Food');
   * // Get summary for 'Food' type in March
   * await getSummaryExpenseOnSpecificMonthByType('1234567890123', 'Food', 3);
   */
  async getSummaryExpenseOnSpecificMonthByType(nationalId, type = null, month = null) {
    try {
      logger.info('Getting summary on specific month by type');
      logger.debug(`Parameters: nationalId=${nationalId}, type=${type}, month=${month}`);

      if (!nationalId) {
        logger.error('National ID is required');
        throw new Error('National ID is required');
      }

      // Validate month if provided
      if (month !== null && (month < 1 || month > 12)) {
        logger.error('Month must be between 1 and 12');
        throw new Error('Month must be between 1 and 12');
      }

      // Create a date object for the first day of the specified month
      let targetDate = month === null
        ? new Date()
        : new Date(new Date().getFullYear(), month - 1, 1);

      // Format the date to ISO string format (YYYY-MM-DD)
      const formattedDate = targetDate.toISOString().split('T')[0];

      let query;
      let params;
      let listQuery;

      if (type === null) {
        // Get all transactions for all types
        query = `
          SELECT type, SUM(amount) as total_amount
          FROM transactions
          WHERE national_id = $1 
          AND category = 'Expense'
          AND EXTRACT(YEAR FROM transaction_datetime::date) = EXTRACT(YEAR FROM $2::date)
          AND EXTRACT(MONTH FROM transaction_datetime::date) = EXTRACT(MONTH FROM $2::date)
          GROUP BY type
          ORDER BY type
        `;
        listQuery = `
          SELECT *
          FROM transactions
          WHERE national_id = $1
          AND category = 'Expense'
          AND EXTRACT(YEAR FROM transaction_datetime::date) = EXTRACT(YEAR FROM $2::date)
          AND EXTRACT(MONTH FROM transaction_datetime::date) = EXTRACT(MONTH FROM $2::date)
        `;
        params = [nationalId, formattedDate];
      } else {
        // Get all transactions for specific type
        query = `
          SELECT SUM(amount) as total_amount
          FROM transactions
          WHERE national_id = $1 
          AND type = $2 
          AND category = 'Expense'
          AND EXTRACT(YEAR FROM transaction_datetime::date) = EXTRACT(YEAR FROM $3::date)
          AND EXTRACT(MONTH FROM transaction_datetime::date) = EXTRACT(MONTH FROM $3::date)
        `;
        listQuery = `
          SELECT *
          FROM transactions
          WHERE national_id = $1
          AND type = $2
          AND category = 'Expense'
          AND EXTRACT(YEAR FROM transaction_datetime::date) = EXTRACT(YEAR FROM $3::date)
          AND EXTRACT(MONTH FROM transaction_datetime::date) = EXTRACT(MONTH FROM $3::date)
        `;
        params = [nationalId, type, formattedDate];
      }
      logger.info("list all relevant transactions");
      const listResult = await this.executeQuery(listQuery, params);
      logger.debug(`List of transactions: ${JSON.stringify(listResult.rows)}`);

      const result = await this.executeQuery(query, params);

      // Log the actual transactions found
      logger.debug(`type ${type} summary on the month ${formattedDate}: ${JSON.stringify(result.rows)}`);

      // Format the response based on whether type was specified
      const summary = type === null
        ? result.rows.map(row => ({
          type: row.type,
          totalAmount: parseFloat(row.total_amount || 0)
        }))
        : parseFloat(result.rows[0]?.total_amount || 0);

      logger.debug(`Summary: ${JSON.stringify(summary)}`);
      return summary;
    } catch (error) {
      logger.error(`Error getting summary on specific month by type: ${error.message}`);
      throw error;
    }
  }
}

module.exports = TransactionModel;
