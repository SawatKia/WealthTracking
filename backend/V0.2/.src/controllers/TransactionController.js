const fs = require('fs');

const BaseController = require('./BaseController');
const TransactionModel = require('../models/TransactionModel');
const BankAccountModel = require('../models/BankAccountModel');
const DebtModel = require('../models/DebtModel');

const { BankAccountUtils } = require('../utilities/BankAccountUtils');
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
        this.BankAccountUtils = new BankAccountUtils();
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

        try {
            logger.debug(`before normalize sender: ${JSON.stringify(sender)}, receiver: ${JSON.stringify(receiver)}`);
            // Normalize account numbers
            if (sender) {
                const normalizedSenderAccount = await this.BankAccountUtils.normalizeAccountNumber(sender.account_number);
                sender.account_number = normalizedSenderAccount;
            }

            if (receiver) {
                const normalizedReceiverAccount = await this.BankAccountUtils.normalizeAccountNumber(receiver.account_number);
                receiver.account_number = normalizedReceiverAccount;
            }

            logger.debug(`after normalized Sender: ${JSON.stringify(sender)}, Receiver: ${JSON.stringify(receiver)}`);

            // Validate sender account exists
            if (sender) {
                const senderAccount = await this.bankAccountModel.get(sender.account_number, sender.fi_code);
                if (!senderAccount) {
                    throw new Error('Sender bank account not found');
                }
            }

            // Validate receiver account exists
            if (receiver) {
                const receiverAccount = await this.bankAccountModel.get(receiver.account_number, receiver.fi_code);
                if (!receiverAccount) {
                    throw new Error('Receiver bank account not found');
                }
            }
            logger.debug(`returning sender: ${JSON.stringify(sender)}, and receiver: ${JSON.stringify(receiver)}`);

            return { sender, receiver };
        } catch (error) {
            logger.error(`Error validating bank accounts: ${error.message}`);
            throw error;
        }
    }

    /**
     * Validates whether the given account has sufficient balance to execute a transaction.
     * @param {string} accountNumber - The account number to validate.
     * @param {string} fiCode - The FI code of the account.
     * @param {number} amount - The amount of the transaction.
     * @param {string} transactionCategory - The category of the transaction (Income, Expense, Transfer).
     * @param {Object} [existingTransaction] - An existing transaction to reverse its effect on the balance before validating.
     * @returns {boolean} True if the account has sufficient balance, false otherwise.
     * @throws {MyAppErrors.NotFoundError} If the account is not found.
     * @throws {MyAppErrors.BadRequestError} If the account does not have sufficient balance.
     */
    async validateBankAccountBalance(accountNumber, fiCode, amount, transactionCategory, existingTransaction = null) {
        try {
            logger.info('Validating bank account balance');
            // Normalize account number
            const convertedAccountNumber = await this.BankAccountUtils.normalizeAccountNumber(accountNumber, fiCode);
            logger.debug(`Account: ${convertedAccountNumber}, FI: ${fiCode}, Amount: ${amount}, Category: ${transactionCategory}`);

            const account = await this.bankAccountModel.get(convertedAccountNumber, fiCode);
            if (!account) {
                logger.error(`Bank account not found: ${convertedAccountNumber}, FI: ${fiCode}`);
                throw MyAppErrors.notFound('Bank account not found');
            }

            // If updating, “undo” the effect of the old transaction on this account—but only if the old transaction affected the same account.
            if (existingTransaction) {
                if (existingTransaction.category === 'Income') {
                    logger.info('the old transaction is Income, if the new transaction\'s bank account and the old transaction\'s bank account are the same, we need to reverse the effect of the old transaction.');
                    logger.debug(`old bank_accounts: ${existingTransaction.receiver.account_number}, ${existingTransaction.receiver.fi_code}`);
                    logger.debug(`new bank_accounts: ${convertedAccountNumber}, ${account.fi_code}`);
                    // Income originally increased the balance on the receiver account.
                    if (existingTransaction.receiver &&
                        existingTransaction.receiver.account_number === convertedAccountNumber &&
                        existingTransaction.receiver.fi_code === account.fi_code) {
                        //FIXME - doesn't it need to subtract from the old account instead of new account? >> it's the same bank account
                        logger.debug(`Reversing income effect: subtracting ${existingTransaction.amount} from account ${convertedAccountNumber}`);
                        account.balance -= existingTransaction.amount;
                    }
                } else if (existingTransaction.category === 'Expense') {
                    logger.info('the old transaction is Expense, if the new transaction\'s bank account and the old transaction\'s bank account are the same, we need to reverse the effect of the old transaction.');
                    logger.debug(`old bank_accounts: ${existingTransaction.sender.account_number}, ${existingTransaction.sender.fi_code}`);
                    logger.debug(`new bank_accounts: ${convertedAccountNumber}, ${account.fi_code}`);
                    // Expense originally decreased the balance on the sender account.
                    if (existingTransaction.sender &&
                        existingTransaction.sender.account_number === convertedAccountNumber &&
                        existingTransaction.sender.fi_code === account.fi_code) {
                        logger.debug(`Reversing expense effect: adding ${existingTransaction.amount} back to account ${convertedAccountNumber}`);
                        account.balance += existingTransaction.amount;
                    }
                } else if (existingTransaction.category === 'Transfer') {
                    logger.info('the old transaction is Transfer, if the new transaction\'s bank account and the old transaction\'s bank account are the same, we need to reverse the effect of the old transaction.');
                    logger.debug(`old bank_accounts: ${existingTransaction.sender.account_number}, ${existingTransaction.sender.fi_code}`);
                    logger.debug(`new bank_accounts: ${convertedAccountNumber}, ${account.fi_code}`);
                    // In a transfer, one account was debited (sender) and one credited (receiver).
                    if (existingTransaction.sender &&
                        existingTransaction.sender.account_number === convertedAccountNumber &&
                        existingTransaction.sender.fi_code === account.fi_code) {
                        logger.debug(`Reversing transfer effect on sender: adding ${existingTransaction.amount} back to account ${convertedAccountNumber}`);
                        account.balance += existingTransaction.amount;
                    } else if (existingTransaction.receiver &&
                        existingTransaction.receiver.account_number === convertedAccountNumber &&
                        existingTransaction.receiver.fi_code === account.fi_code) {
                        logger.debug(`Reversing transfer effect on receiver: subtracting ${existingTransaction.amount} from account ${convertedAccountNumber}`);
                        account.balance -= existingTransaction.amount;
                    }
                }
            }

            // Now perform the check for sufficient funds.
            // For Expense and Transfer (for sender), you need sufficient funds.
            if (['Expense', 'Transfer'].includes(transactionCategory) && account.balance < amount) {
                const requiredAmount = parseFloat(amount).toFixed(2);
                const availableAmount = parseFloat(account.balance).toFixed(2);
                logger.error(`Insufficient balance. Available: ${availableAmount}, Required: ${requiredAmount}`);
                throw MyAppErrors.badRequest(
                    `Insufficient balance. Available: ${availableAmount}, Required: ${requiredAmount}`
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
            } else if (req.body.category) {
                throw MyAppErrors.badRequest('Invalid category, must be Expense, Income, or Transfer');
            }
            const user = await super.getCurrentUser(req);

            // Validate request body and convert types
            const validatedData = await super.verifyField(req.body, requiredFields, this.transactionModel);

            // remove empty or null fields
            Object.keys(validatedData).forEach(key => {
                if (typeof validatedData[key] === 'string') {
                    validatedData[key] = validatedData[key].trim();
                }
                if ([null, '', undefined, 'null', 'undefined'].includes(validatedData[key])) {
                    logger.debug(`Removing empty or null field: ${key}`);
                    delete validatedData[key];
                }
            });
            logger.debug(`validatedData: ${JSON.stringify(validatedData, null, 2)}`);
            if (validatedData.transaction_datetime > new Date()) {
                logger.error('Transaction datetime cannot be in the future');
                throw MyAppErrors.badRequest('Transaction datetime cannot be in the future');
            }

            // Override type to "Debt Payment" if debt_id is specified
            if (uuidValidateV4(validatedData.debt_id)) {
                logger.info('debt_id is provided, overriding type to "Debt Payment"');
                logger.debug(`debt_id: ${validatedData.debt_id} is provided`);
                validatedData.type = 'Debt Payment';
                logger.info('type is overridden to "Debt Payment"');
            } else if (validatedData.debt_id) {
                logger.warn("invalid debt_id")
                throw MyAppErrors.badRequest('Invalid debt_id');
            }
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
                // Validate bank accounts only if they exist
                if (validatedData.sender || validatedData.receiver) {
                    const { sender, receiver } = await this.validateBankAccounts(
                        validatedData.sender,
                        validatedData.receiver
                    );
                    validatedData.sender = sender;
                    validatedData.receiver = receiver;
                }
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
                        validatedData.sender.account_number,
                        validatedData.sender.fi_code,
                        validatedData.amount,
                        'Expense'
                    );
                    break;
                case 'Transfer':
                    await this.validateBankAccountBalance(
                        validatedData.sender.account_number,
                        validatedData.sender.fi_code,
                        validatedData.amount,
                        'Transfer'
                    );
                    break;
            }

            if (validationErrors.length > 0) {
                logger.error(`Validation errors: ${validationErrors.join('; ')}`);
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
            if (error instanceof MyAppErrors) {
                next(error);
            } else if (error.message.includes('Invalid number format for field: ')) {
                next(MyAppErrors.badRequest(error.message));
            } else if (error.name === 'ValidationError') {
                next(MyAppErrors.badRequest(error.message));
            } else if (error.message.includes('Missing required field: ')) {
                next(MyAppErrors.badRequest(error.message));
            } else {
                next(error);
            }
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
            let updateData = {};

            logger.debug(`received request body: ${JSON.stringify(req.body, null, 2)}`);
            req.body = Object.entries(req.body).reduce((acc, [key, value]) => {
                acc[key.toLowerCase()] = value;
                return acc;
            }, {});

            logger.debug(`converted body's key to lowercase: ${JSON.stringify(req.body, null, 2)}`);

            if (req.body.account_number) {
                const errorMessage = 'account_number is not allowed to be updated, to update the bank account, please use sender or receiver objects as shown in the sample data object below';
                logger.error(errorMessage);
                const sample = {
                    "transaction_datetime": "2021-07-01T00:00:00.000Z",
                    "category": "Expense",
                    "type": "Food",
                    "amount": 100,
                    "note": "Lunch",
                    "sender": {
                        "account_number": "1234567890",
                        "fi_code": "001"
                    },
                    "receiver": {
                        "account_number": "0987654321",
                        "fi_code": "002"
                    }
                }
                next(MyAppErrors.badRequest(errorMessage, sample));
            }

            const allowedFields = ['transaction_datetime', 'category', 'type', 'amount', 'note', 'sender', 'receiver'];
            for (const field of allowedFields) {
                if (req.body[field] !== undefined) {
                    logger.debug(`checking if field: \x1b[1;96m${field}\x1b[0m should be added to updateData`);
                    const oldValue = existingTransaction[field] || null;
                    if (JSON.stringify(req.body[field]) !== JSON.stringify(oldValue)) {
                        logger.debug(`field: ${field} add to updateData, since old value !== new value: ${oldValue} !== ${req.body[field]}`);
                        updateData[field] = req.body[field];
                    }
                }
            }

            // return if no modified fields
            if (!Object.keys(updateData).length === 0) {
                logger.info('No modifiedfields to update');
                req.formattedResponse = formatResponse(200, 'No modifiedfields to update, return existing transaction instead', { transaction: existingTransaction });
                return next();
            }


            // If category is modified, type must also be modified
            if (updateData.category && !updateData.type) {
                updateData.type = req.body.type;
                updateData.amount = req.body.amount;
            }

            logger.debug(`preparing updateData: ${JSON.stringify(updateData, null, 2)}`);

            if (updateData.category) {
                // Validate category and type if the category being updated
                super.verifyType(updateData.category, updateData.type);
                logger.info('category and type are valid');
            } else logger.info('category and type are not being updated');

            // Validate bank accounts based on new category if the category being updated, since it need to change sender and receiver
            const validationErrors = [];
            if (updateData.category) {
                logger.info('Validating bank accounts based on new category');
                const { sender, receiver } = updateData;
                switch (updateData.category) {
                    case 'Expense':
                        if (!sender) {
                            logger.error('Sender bank account is required for Expense transactions');
                            validationErrors.push('Sender bank account is required for Expense transactions');
                        }
                        break;
                    case 'Income':
                        if (!receiver) {
                            logger.error('Receiver bank account is required for Income transactions');
                            validationErrors.push('Receiver bank account is required for Income transactions');
                        }
                        break;
                    case 'Transfer':
                        if (!sender) {
                            logger.error('Sender bank account is required for Transfer transactions');
                            validationErrors.push('Sender bank account is required for Transfer transactions');
                        }
                        if (!receiver) {
                            logger.error('Receiver bank account is required for Transfer transactions');
                            validationErrors.push('Receiver bank account is required for Transfer transactions');
                        }
                        break;
                }

                // Verify new bank accounts exist if provided
                logger.info('Verifying new bank accounts');
                if (validationErrors.length === 0) {
                    const { sender: validatedSender, receiver: validatedReceiver } = await this.validateBankAccounts(
                        sender,
                        receiver
                    );
                    updateData.sender = validatedSender ? validatedSender : sender;
                    updateData.receiver = validatedReceiver ? validatedReceiver : receiver;
                }

                if (validationErrors.length > 0) {
                    throw MyAppErrors.badRequest(validationErrors.join('; '));
                }
                logger.info('Bank accounts verified');
            }

            // If amount or category is being updated, validate balance
            if (updateData.amount || updateData.category) {
                logger.info('Amount or category are being updated, validating balance by these 2 object:');
                //** 
                //   if only the amount is updated, then the category, sender, and receiver might remain the same 
                //   as in the original (existingTransaction). 
                //
                logger.debug(`existingTransaction(old): ${JSON.stringify(existingTransaction, null, 2)}`);
                logger.debug(`updateData(to update): ${JSON.stringify(updateData, null, 2)}`);
                const amount = updateData.amount /*|| existingTransaction.amount*/;
                const category = updateData.category /*|| existingTransaction.category*/;
                const sender = updateData.sender /*|| existingTransaction.sender*/;
                const receiver = updateData.receiver /*|| existingTransaction.receiver*/;
                logger.debug(`amount: ${amount}, category: ${category}, sender: ${JSON.stringify(sender, null, 2)}, receiver: ${JSON.stringify(receiver, null, 2)}`);

                if (category === 'Expense' && sender) {
                    logger.info('category modifying to Expense, validating sender balance');
                    await this.validateBankAccountBalance(
                        sender.account_number,
                        sender.fi_code,
                        amount,
                        category,
                        existingTransaction
                    );
                } else if (category === 'Income' && receiver) {
                    logger.info('category modifying to Income, validating receiver balance');
                    await this.validateBankAccountBalance(
                        receiver.account_number,
                        receiver.fi_code,
                        amount,
                        category,
                        existingTransaction
                    );
                } else if (category === 'Transfer' && sender && receiver) {
                    logger.info('category modifying to Transfer, validating sender balance');
                    await this.validateBankAccountBalance(
                        sender.account_number,
                        sender.fi_code,
                        amount,
                        category,
                        existingTransaction
                    );
                    logger.info('Validating receiver balance');
                    await this.validateBankAccountBalance(
                        receiver.account_number,
                        receiver.fi_code,
                        amount,
                        category,
                        existingTransaction
                    );
                }
                logger.info('Balance validated');
            }

            // update the object without reassigning
            updateData = {
                ...updateData,
                ...(updateData.sender && {
                    sender_account_number: updateData.sender.account_number,
                    sender_fi_code: updateData.sender.fi_code
                }),
                ...(updateData.receiver && {
                    receiver_account_number: updateData.receiver.account_number,
                    receiver_fi_code: updateData.receiver.fi_code
                })
            };

            // Remove the old sender and receiver objects
            delete updateData.sender;
            delete updateData.receiver;

            // Update the transaction
            logger.debug(`update transaction_id: ${transaction_id} updateData: ${JSON.stringify(updateData, null, 2)}`);
            const updatedTransaction = await this.transactionModel.update(
                { transaction_id },
                updateData
            );
            logger.debug(`updatedTransaction: ${JSON.stringify(updatedTransaction, null, 2)}`);

            // // Retrieve the updated transaction from the database
            // const fullyUpdatedTransaction = await this.transactionModel.findOne({ transaction_id });

            // // Fetch sender bank account details if available
            // if (fullyUpdatedTransaction.sender_account_number && fullyUpdatedTransaction.sender_fi_code) {
            //     const senderAccount = await this.bankAccountModel.get(
            //         fullyUpdatedTransaction.sender_account_number,
            //         fullyUpdatedTransaction.sender_fi_code
            //     );
            //     fullyUpdatedTransaction.sender = senderAccount;
            // }

            // // Fetch receiver bank account details if available
            // if (fullyUpdatedTransaction.receiver_account_number && fullyUpdatedTransaction.receiver_fi_code) {
            //     const receiverAccount = await this.bankAccountModel.get(
            //         fullyUpdatedTransaction.receiver_account_number,
            //         fullyUpdatedTransaction.receiver_fi_code
            //     );
            //     fullyUpdatedTransaction.receiver = receiverAccount;
            // }

            // // Handle Expense category, nullify receiver
            // if (fullyUpdatedTransaction.category === 'Expense') {
            //     fullyUpdatedTransaction.receiver = null;
            // }

            // logger.debug(`fullyUpdatedTransaction: ${JSON.stringify(fullyUpdatedTransaction, null, 2)}`);

            // req.formattedResponse = formatResponse(200, 'Transaction updated successfully', fullyUpdatedTransaction);
            // next();

            req.formattedResponse = formatResponse(200, 'Transaction updated successfully', updatedTransaction);
            next();
        } catch (error) {
            logger.error(`Error updating transaction: ${error.message}`);
            if (error.message.includes('Insufficient balance')) {
                next(MyAppErrors.unProcessableEntity(error.message));
            }

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

            if (type) {
                super.verifyType('Expense', type);
            }
            logger.debug(`using type: ${type}`);

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
