const BaseController = require('./BaseController');
const TransactionModel = require('../models/TransactionModel');
const BankAccountModel = require('../models/BankAccountModel');
const DebtModel = require('../models/DebtModel');
const { Logger, formatResponse } = require('../utilities/Utils');
const MyAppErrors = require('../utilities/MyAppErrors');
const types = require('../utilities/types.json');
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
            const requiredFields = ['transaction_datetime', 'category', 'type', 'amount'];
            const user = await super.getCurrentUser(req);

            // Validate request body and convert types
            const validatedData = await super.verifyField(req.body, requiredFields, this.transactionModel);

            // Validate category
            if (!['Income', 'Expense', 'Transfer'].includes(validatedData.category)) {
                throw MyAppErrors.badRequest('Invalid category. Must be Income, Expense, or Transfer');
            }
            logger.info('category is valid')

            // Validate type based on category
            const allowedTypes = types[validatedData.category] || [];
            logger.debug(`allowedTypes for ${validatedData.category}: ${allowedTypes}`);
            if (allowedTypes.length === 0) {
                logger.error(`Invalid category: ${validatedData.category}`);
                throw MyAppErrors.badRequest(`Invalid category: ${validatedData.category}`);
            }

            if (!allowedTypes.includes(validatedData.type)) {
                logger.error(`Invalid type for ${validatedData.category}. Must be one of: ${allowedTypes.join(', ')}`);
                throw MyAppErrors.badRequest(`Invalid type for ${validatedData.category}. Must be one of: ${allowedTypes.join(', ')}`);
            }
            logger.info('type is valid')

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

            // Verify bank accounts exist
            if (validationErrors.length === 0) {
                const bankAccountErrors = await this.validateBankAccounts(sender, receiver);
                validationErrors.push(...bankAccountErrors);
            }

            // Validate debt_id if provided
            if (req.body.debt_id) {
                const debt = await this.debtModel.findOne({ debt_id: req.body.debt_id });
                if (!debt) {
                    validationErrors.push('Debt not found');
                } else if (debt.national_id !== user.national_id) {
                    validationErrors.push('You do not have permission to access this debt');
                }
            }

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
                ...(validatedData.debt_id && { debt_id: validatedData.debt_id }),
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
                if (!['Income', 'Expense', 'Transfer'].includes(updateData.category)) {
                    throw MyAppErrors.badRequest('Invalid category. Must be Income, Expense, or Transfer');
                }

                if (updateData.type) {
                    const allowedTypes = types[updateData.category] || [];
                    if (!allowedTypes.includes(updateData.type)) {
                        throw MyAppErrors.badRequest(`Invalid type for ${updateData.category}. Must be one of: ${allowedTypes.join(', ')}`);
                    }
                }
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
}

module.exports = TransactionController;
