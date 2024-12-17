const BaseController = require('./BaseController');
const TransactionModel = require('../models/TransactionModel');
const BankAccountModel = require('../models/BankAccountModel');
const DebtModel = require('../models/DebtModel');
const { Logger, formatResponse } = require('../utilities/Utils');
const MyAppErrors = require('../utilities/MyAppErrors');
const types = require('../../statics/types.json');
const { v4: uuidv4 } = require('uuid');
const { uuidValidateV4 } = require('../utilities/AuthUtils');

const logger = Logger('TransactionController');

class TransactionController extends BaseController {
    constructor() {
        super();
        this.transactionModel = new TransactionModel();
        this.bankAccountModel = new BankAccountModel();
        this.debtModel = new DebtModel();

        this.createTransaction = this.createTransaction.bind(this);
        this.getAllTransactions = this.getAllTransactions.bind(this);
        this.getOneTransaction = this.getOneTransaction.bind(this);
        this.updateTransaction = this.updateTransaction.bind(this);
        this.deleteTransaction = this.deleteTransaction.bind(this);
        this.getTransactionsByAccount = this.getTransactionsByAccount.bind(this);
        this.getAllTypes = this.getAllTypes.bind(this);
        this.getMonthlySummary = this.getMonthlySummary.bind(this);
        this.getSummaryExpenseOnSpecificMonthByType = this.getSummaryExpenseOnSpecificMonthByType.bind(this);

        this.validateBankAccounts = this.validateBankAccounts.bind(this);
        this.validateBankAccountBalance = this.validateBankAccountBalance.bind(this);
    }

    async validateBankAccounts(sender, receiver) {
        logger.info('Validating bank accounts');
        const errors = [];

        if (sender) {
            const senderAccount = await this.bankAccountModel.get(sender.account_number, sender.fi_code);
            if (!senderAccount) {
                logger.error(`Sender bank account not found: ${sender.account_number} ${sender.fi_code}`);
                errors.push('Sender bank account not found');
            }
        }
        logger.info('Sender bank account is valid');

        if (receiver) {
            const receiverAccount = await this.bankAccountModel.get(receiver.account_number, receiver.fi_code);
            if (!receiverAccount) {
                logger.error(`Receiver bank account not found: ${receiver.account_number} ${receiver.fi_code}`);
                errors.push('Receiver bank account not found');
            }
        }
        logger.info('Receiver bank account is valid');
        return errors;
    }

    async validateBankAccountBalance(accountNumber, fiCode, amount, transactionType) {
        try {
            logger.info('Validating bank account balance');
            logger.debug(`Account: ${accountNumber}, FI: ${fiCode}, Amount: ${amount}, Type: ${transactionType}`);

            const account = await this.bankAccountModel.get(accountNumber, fiCode);
            if (!account) {
                logger.error(`Bank account not found: ${accountNumber} ${fiCode}`);
                throw MyAppErrors.notFound('Bank account not found');
            }

            if (['Expense', 'Transfer'].includes(transactionType) && account.balance < amount) {
                logger.error(`Insufficient balance. Available: ${account.balance}, Required: ${amount}`);
                throw MyAppErrors.badRequest(
                    `Insufficient balance. Available: ${account.balance}, Required: ${amount}`
                );
            }

            return true;
        } catch (error) {
            logger.error(`Error validating bank account balance: ${error.message}`);
            throw error;
        }
    }

    async createTransaction(req, res, next) {
        try {
            logger.info('Creating transaction');
            let requiredFields = ['transaction_datetime', 'category', 'type', 'amount'];
            if (req.body.category === 'Expense') {
                requiredFields.push('sender');
            } else if (req.body.category === 'Income') {
                requiredFields.push('receiver');
            } else if (req.body.category === 'Transfer') {
                requiredFields.push('sender', 'receiver');
            } else {
                throw MyAppErrors.badRequest('Invalid category. Must be Income, Expense, or Transfer');
            }
            const user = await super.getCurrentUser(req);

            // Validate request body and convert types
            const validatedData = await super.verifyField(req.body, requiredFields, this.transactionModel);
            logger.debug(`validatedData: ${JSON.stringify(validatedData, null, 2)}`);

            // Override type to "Debt Payment" if debt_id is specified
            logger.info('debt_id is provided, overriding type to "Debt Payment"');
            if (validatedData.debt_id) {
                logger.debug(`debt_id: ${validatedData.debt_id} is provided`);
                validatedData.type = 'Debt Payment';
            }
            logger.info('type is overridden to "Debt Payment"');
            logger.debug(`validatedData: ${JSON.stringify(validatedData, null, 2)}`);

            // Validate category  
            super.verifyType(validatedData.category, validatedData.type);
            logger.info('type is valid');

            // Validate bank accounts based on category
            const { sender, receiver } = req.body;
            const validationErrors = [];

            switch (validatedData.category) {
                case 'Expense':
                    if (!sender || !sender.account_number || !sender.fi_code) {
                        validationErrors.push('Sender bank account details (account_number and fi_code) are required for Expense transactions');
                    }
                    if (receiver) {
                        validationErrors.push('Receiver bank account should not be provided for Expense transactions');
                    }
                    break;
                case 'Income':
                    if (!receiver || !receiver.account_number || !receiver.fi_code) {
                        validationErrors.push('Receiver bank account details (account_number and fi_code) are required for Income transactions');
                    }
                    if (sender) {
                        validationErrors.push('Sender bank account should not be provided for Income transactions');
                    }
                    break;
                case 'Transfer':
                    if (!sender || !sender.account_number || !sender.fi_code) {
                        validationErrors.push('Sender bank account details (account_number and fi_code) are required for Transfer transactions');
                    }
                    if (!receiver || !receiver.account_number || !receiver.fi_code) {
                        validationErrors.push('Receiver bank account details (account_number and fi_code) are required for Transfer transactions');
                    }
                    break;
            }
            logger.info('bank accounts are not null correspond to its category');

            // Verify bank accounts exist
            if (validationErrors.length === 0) {
                const bankAccountErrors = await this.validateBankAccounts(sender, receiver);
                validationErrors.push(...bankAccountErrors);
            }
            logger.info('bank accounts are valid');

            // Validate debt_id if provided
            if (req.body.debt_id) {
                logger.info('debt_id is provided, validating debt');
                const debt = await this.debtModel.findOne({ debt_id: req.body.debt_id });
                if (!debt) {
                    validationErrors.push('Debt not found');
                } else if (debt.national_id !== user.national_id) {
                    validationErrors.push('You do not have permission to access this debt');
                }
            }
            logger.info('debt is valid');

            // Validate bank account balance based on category
            switch (validatedData.category) {
                case 'Expense':
                    await this.validateBankAccountBalance(
                        sender.account_number,
                        sender.fi_code,
                        validatedData.amount,
                        'Expense'
                    );
                    break;
                case 'Transfer':
                    await this.validateBankAccountBalance(
                        sender.account_number,
                        sender.fi_code,
                        validatedData.amount,
                        'Transfer'
                    );
                    break;
            }

            if (validationErrors.length > 0) {
                throw MyAppErrors.badRequest(validationErrors.join('; '));
            }

            // Add user's national_id, bank account details, and debt_id to transaction data
            const transactionData = {
                transaction_id: uuidv4(),
                ...validatedData,
                national_id: user.national_id,
                ...(validatedData.debt_id && {
                    debt_id: validatedData.debt_id,
                }),
                ...(validatedData.sender && {
                    sender_account_number: validatedData.sender.account_number,
                    sender_fi_code: validatedData.sender.fi_code
                }),
                ...(validatedData.receiver && {
                    receiver_account_number: validatedData.receiver.account_number,
                    receiver_fi_code: validatedData.receiver.fi_code
                })
            };
            delete transactionData.sender;
            delete transactionData.receiver;
            logger.debug(`transactionData to be create: ${JSON.stringify(transactionData, null, 2)}`);

            const transaction = await this.transactionModel.create(transactionData);
            req.formattedResponse = formatResponse(201, 'Transaction created successfully', transaction);
            next();
        } catch (error) {
            logger.error(`Error creating transaction: ${error.message}`);
            next(error);
        }
    }

    async getAllTransactions(req, res, next) {
        try {
            logger.info('Getting all transactions');
            const user = await super.getCurrentUser(req);

            const transactions = await this.transactionModel.list(user.national_id);
            logger.debug(`Found ${transactions?.length || 0} transactions`);

            if (!transactions || transactions.length === 0) {
                logger.info('No transactions found');
                req.formattedResponse = formatResponse(200, 'No transactions found', []);
                return next();
            }

            if (!super.verifyOwnership(user, transactions)) {
                throw MyAppErrors.forbidden('You do not have permission to view these transactions');
            }

            const message = `Retrieved ${transactions.length} transaction${transactions.length > 1 ? 's' : ''} successfully`;
            req.formattedResponse = formatResponse(200, message, { transactions });
            next();
        } catch (error) {
            logger.error(`Error getting transactions: ${error.message}`);
            next(error);
        }
    }

    async getOneTransaction(req, res, next) {
        try {
            logger.info('Getting transaction');
            const { transaction_id } = req.params;

            const transaction = await this.transactionModel.findOne({ transaction_id });
            if (!transaction) {
                logger.info('No transaction found');
                req.formattedResponse = formatResponse(200, 'No transaction found', null);
                return next();
            }
            if (fs.existsSync(transaction.slip_uri)) {
                const imageBuffer = fs.readFileSync(transaction.slip_uri);
                const imageBase64 = imageBuffer.toString('base64');
                transaction.slip_data = `data:image/jpeg;base64,${imageBase64}`;
            }

            const user = await super.getCurrentUser(req);
            if (!super.verifyOwnership(user, transaction)) {
                throw MyAppErrors.forbidden('You do not have permission to view this transaction');
            }

            req.formattedResponse = formatResponse(200, 'Transaction retrieved successfully', { transaction });
            next();
        } catch (error) {
            logger.error(`Error getting transaction: ${error.message}`);
            next(error);
        }
    }

    async updateTransaction(req, res, next) {
        try {
            logger.info('Updating transaction');
            const { transaction_id } = req.params;
            if (!uuidValidateV4(transaction_id)) {
                throw MyAppErrors.badRequest('Invalid transaction_id');
            }
            logger.debug(`transaction_id: ${transaction_id} is valid`);

            const user = await super.getCurrentUser(req);

            // Verify transaction exists and user owns it
            const existingTransaction = await this.transactionModel.findOne({ transaction_id });
            if (!existingTransaction) {
                throw MyAppErrors.notFound('Transaction not found');
            }
            logger.debug(`existingTransaction: ${JSON.stringify(existingTransaction, null, 2)}`);

            if (!super.verifyOwnership(user, existingTransaction)) {
                throw MyAppErrors.forbidden('You do not have permission to update this transaction');
            }
            logger.debug('Ownership verified');

            // Prepare update data with only fields present in the request body
            const updateData = {};
            const allowedFields = ['transaction_datetime', 'category', 'type', 'amount', 'note', 'sender', 'receiver'];

            for (const field of allowedFields) {
                if (req.body[field] !== undefined) {
                    updateData[field] = req.body[field];
                }
            }

            // Validate category and type if they are being updated
            if (updateData.category) {
                super.verifyType(updateData.category, updateData.type);
                logger.info('category and type are valid');
            }
            logger.info('category and type are not being updated');

            // Validate bank accounts based on new category if they are being updated
            const validationErrors = [];
            if (updateData.category) {
                const { sender, receiver } = updateData;
                switch (updateData.category) {
                    case 'Expense':
                        if (!sender && !existingTransaction.sender) {
                            validationErrors.push('Sender bank account is required for Expense transactions');
                        }
                        break;
                    case 'Income':
                        if (!receiver && !existingTransaction.receiver) {
                            validationErrors.push('Receiver bank account is required for Income transactions');
                        }
                        break;
                    case 'Transfer':
                        if (!sender && !existingTransaction.sender) {
                            validationErrors.push('Sender bank account is required for Transfer transactions');
                        }
                        if (!receiver && !existingTransaction.receiver) {
                            validationErrors.push('Receiver bank account is required for Transfer transactions');
                        }
                        break;
                }

                // Verify new bank accounts exist if provided
                logger.info('Verifying new bank accounts');
                if (validationErrors.length === 0) {
                    const bankAccountErrors = await this.validateBankAccounts(
                        sender || existingTransaction.sender,
                        receiver || existingTransaction.receiver
                    );
                    validationErrors.push(...bankAccountErrors);
                }

                if (validationErrors.length > 0) {
                    throw MyAppErrors.badRequest(validationErrors.join('; '));
                }
                logger.info('Bank accounts verified');
            }
            logger.info('Bank accounts are not being updated');

            // If amount or category is being updated, validate balance
            if (updateData.amount || updateData.category) {
                const amount = updateData.amount || existingTransaction.amount;
                const category = updateData.category || existingTransaction.category;
                const sender = updateData.sender || existingTransaction.sender;

                if (['Expense', 'Transfer'].includes(category) && sender) {
                    await this.validateBankAccountBalance(
                        sender.account_number,
                        sender.fi_code,
                        amount,
                        category
                    );
                }
            }

            // Update the transaction
            logger.debug(`update transaction_id: ${transaction_id} updateData: ${JSON.stringify(updateData, null, 2)}`);
            const updatedTransaction = await this.transactionModel.update(
                { transaction_id },
                updateData
            );
            logger.debug(`updatedTransaction: ${JSON.stringify(updatedTransaction, null, 2)}`);

            req.formattedResponse = formatResponse(200, 'Transaction updated successfully', updatedTransaction);
            next();
        } catch (error) {
            logger.error(`Error updating transaction: ${error.message}`);
            next(error);
        }
    }

    async deleteTransaction(req, res, next) {
        try {
            logger.info('Deleting transaction');
            const { transaction_id } = req.params;
            if (!uuidValidateV4(transaction_id)) {
                throw MyAppErrors.badRequest('Invalid transaction_id');
            }

            const user = await super.getCurrentUser(req);

            // Verify transaction exists and user owns it
            const existingTransaction = await this.transactionModel.findOne({ transaction_id });
            if (!existingTransaction) {
                throw MyAppErrors.notFound('Transaction not found');
            }

            if (!super.verifyOwnership(user, existingTransaction)) {
                throw MyAppErrors.forbidden('You do not have permission to delete this transaction');
            }

            await this.transactionModel.delete({ transaction_id });
            req.formattedResponse = formatResponse(200, 'Transaction deleted successfully');
            next();
        } catch (error) {
            logger.error(`Error deleting transaction: ${error.message}`);
            next(error);
        }
    }

    async getTransactionsByAccount(req, res, next) {
        try {
            logger.info('Getting transactions by account');

            // Use verifyField to validate required fields
            const validatedData = await super.verifyField(
                req.params,
                ['account_number', 'fi_code'],
                this.bankAccountModel
            );
            logger.debug(`Validated account data: ${JSON.stringify(validatedData)}`);

            // Get current user
            const user = await super.getCurrentUser(req);

            // Verify user owns this account
            const bankAccount = await this.bankAccountModel.get(validatedData.account_number, validatedData.fi_code);
            if (!bankAccount) {
                throw MyAppErrors.notFound('Bank account not found');
            }

            if (!super.verifyOwnership(user, bankAccount)) {
                throw MyAppErrors.forbidden('You do not have permission to view transactions for this account');
            }

            // Get transactions
            const transactions = await this.transactionModel.getAllTransactionsForAccount(
                validatedData.account_number,
                validatedData.fi_code
            );

            const message = transactions.length > 0
                ? `Retrieved ${transactions.length} transaction${transactions.length > 1 ? 's' : ''} successfully`
                : 'No transactions found for this account';

            req.formattedResponse = formatResponse(200, message, { transactions });
            next();
        } catch (error) {
            logger.error(`Error getting transactions by account: ${error.message}`);
            next(error);
        }
    }

    async getAllTypes(req, res, next) {
        logger.info('Getting all types');
        const allTypes = types;
        logger.debug(`allTypes: ${JSON.stringify(allTypes)}`);
        req.formattedResponse = formatResponse(200, 'All types retrieved successfully', allTypes);
        next();
    }

    async getMonthlySummary(req, res, next) {
        try {
            logger.info('Getting monthly transaction summary');
            const user = await super.getCurrentUser(req);

            // Get optional type parameter from query
            let { type, monthCount } = req.query;
            monthCount = monthCount || 12;
            logger.debug(`received type: ${type}, monthCount: ${monthCount}`);

            // If type is provided, validate it exists in types
            if (type) {
                const typeLowerCase = type.toLowerCase();
                const category = types.Income.some(t => t.toLowerCase() === typeLowerCase) ? 'Income' :
                    types.Expense.some(t => t.toLowerCase() === typeLowerCase) ? 'Expense' :
                        types.Transfer.some(t => t.toLowerCase() === typeLowerCase) ? 'Transfer' : null;

                if (!category) {
                    throw MyAppErrors.badRequest(`Invalid type "${type}". Type not found in any category.`);
                }

                logger.debug(`impolicited category: ${category}, type: ${type}`);
                super.verifyType(category, type);
                logger.info(`type: ${type} is valid`);
            }

            const summary = await this.transactionModel.getMonthlySummary(user.national_id, type, monthCount);
            logger.debug(`monthly summary: ${JSON.stringify(summary, null, 2)}`);

            req.formattedResponse = formatResponse(
                200,
                `${monthCount} latest month summary for ${type ? type : 'all types'} retrieved successfully`,
                { summary }
            );
            next();
        } catch (error) {
            logger.error(`Error getting monthly summary: ${error.message}`);
            next(error);
        }
    }

    async getSummaryExpenseOnSpecificMonthByType(req, res, next) {
        try {
            logger.info('Getting expenses by type for current month');
            const { type, month } = req.query;
            logger.debug(`type: ${type}, month: ${month}`);

            super.verifyType('Expense', type);
            logger.info(`type: ${type} is valid`);

            const user = await super.getCurrentUser(req);

            const summary = await this.transactionModel.getSummaryExpenseOnSpecificMonthByType(user.national_id, type, month);
            logger.debug(`summary: ${JSON.stringify(summary)}`);

            const monthName = new Date(month || new Date()).toLocaleString('en-US', { month: 'long' });
            logger.debug(`monthName: ${monthName}`);

            req.formattedResponse = formatResponse(
                200,
                `${type ? type : 'all types'} expenses summary for ${month ? "month " + monthName : "current month (" + monthName + ")"} retrieved successfully`,
                { summary }
            );
            next();
        } catch (error) {
            logger.error(`Error getting current month expenses by type: ${error.message}`);
            next(error);
        }
    }
}

module.exports = TransactionController;
