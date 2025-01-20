const BaseController = require("./BaseController");
const { Logger, formatResponse } = require("../utilities/Utils");
const BankAccountModel = require("../models/BankAccountModel");
const TransactionModel = require("../models/TransactionModel");
const MyAppErrors = require("../utilities/MyAppErrors");
const { ValidationError } = require("../utilities/ValidationErrors");
const FinancialInstitutionModel = require('../models/FinancialInstitutionModel');
const { BankAccountUtils } = require('../utilities/BankAccountUtils');
const UserModel = require('../models/UserModel');

const logger = Logger("BankAccountController");

class BankAccountController extends BaseController {
    constructor() {
        super();
        this.BankAccountModel = new BankAccountModel();
        this.TransactionModel = new TransactionModel();
        this.FiModel = new FinancialInstitutionModel();
        this.BankAccountUtils = new BankAccountUtils();
        this.UserModel = new UserModel();

        this.createBankAccount = this.createBankAccount.bind(this);
        this.getBankAccount = this.getBankAccount.bind(this);
        this.getAllBankAccounts = this.getAllBankAccounts.bind(this);
        this.updateBankAccount = this.updateBankAccount.bind(this);
        this.deleteBankAccount = this.deleteBankAccount.bind(this);
    }

    async createBankAccount(req, res, next) {
        logger.info('Creating bank account...');
        try {
            // 1. Verify required fields first
            const requiredFields = ["account_number", "fi_code", "display_name", "account_name", "balance"];
            const convertedBody = await super.verifyField(req.body, requiredFields, this.BankAccountModel);
            logger.debug(`Converted body: ${JSON.stringify(convertedBody)}`);

            // 2. Normalize the account number
            const cleanedAccountNumber = await this.BankAccountUtils.normalizeAccountNumber(convertedBody.account_number);
            logger.debug(`Normalized account number: ${cleanedAccountNumber}`);

            // 3. Update the body with normalized account number
            const updatedBody = {
                ...convertedBody,
                account_number: cleanedAccountNumber
            };
            logger.debug(`Updated request body: ${JSON.stringify(updatedBody)}`);

            // 4. Validate balance
            const { balance, fi_code } = updatedBody;
            if (isNaN(parseFloat(balance))) {
                throw new ValidationError("Invalid balance.");
            }
            if (parseFloat(balance) < 0) {
                throw new ValidationError("Invalid balance.");
            }

            // Verify balance has at most 2 decimal places
            if (!/^\d+(\.\d{1,2})?$/.test(balance)) {
                throw new ValidationError("Invalid balance.");
            }

            // 5. Verify bank exists
            logger.debug(`Searching for bank data with fi_code: ${fi_code}`);
            const bankData = await this.FiModel.findOne({ fi_code });
            if (!bankData) {
                logger.error(`Financial institution with fi_code '${fi_code}' not found`);
                throw MyAppErrors.notFound(`Financial institution with fi_code '${fi_code}' not found. To get a list of available fi_codes, please use the /fi/ endpoint.`);
            }
            logger.debug(`Bank data found: ${JSON.stringify(bankData)}`);

            // 6. Get current user
            const currentUser = await super.getCurrentUser(req);
            if (!currentUser) {
                throw MyAppErrors.userNotFound();
            }
            logger.debug(`Current user: ${JSON.stringify(currentUser)}`);

            // 7. Create bank account
            const bankAccountData = {
                ...updatedBody,
                national_id: currentUser.national_id
            };
            logger.debug(`Bank account data to create: ${JSON.stringify(bankAccountData)}`);

            const createResult = await this.BankAccountModel.create(bankAccountData);
            logger.debug(`Create result: ${JSON.stringify(createResult)}`);

            const result = await this.BankAccountModel.get(createResult.account_number, createResult.fi_code);
            logger.debug(`Get create result: ${JSON.stringify(result)}`);

            req.formattedResponse = formatResponse(201, 'Bank account created successfully', result);
            next();
        } catch (error) {
            logger.error(`Failed to create bank account: ${error.message}`);
            if (error.message.startsWith('Missing required field:')) {
                next(MyAppErrors.badRequest(error.message));
            } else if (error.message.includes('violates foreign key constraint')) {
                next(MyAppErrors.badRequest('Invalid national ID. The user does not exist.'));
            } else if (error.message.includes('duplicate key value') || error.code === '23505') {
                next(MyAppErrors.badRequest('Bank account already exists for this user.'));
            } else if (error.message.includes('Account number should contain only digits or digits with dashes')) {
                next(MyAppErrors.badRequest(error.message));
            } else if (error instanceof ValidationError) {
                next(MyAppErrors.badRequest(error.message));
            } else if (error.message.includes('Invalid')) {
                next(MyAppErrors.badRequest(error.message));
            } else {
                next(error);
            }
        }
    }

    async getAllBankAccounts(req, res, next) {
        try {
            const currentUser = await super.getCurrentUser(req);
            if (!currentUser) {
                throw MyAppErrors.userNotFound();
            }
            logger.debug(`currentUser: ${JSON.stringify(currentUser)}`);

            logger.info('Retrieving all bank accounts...');
            const bankAccounts = await this.BankAccountModel.getAll(currentUser.national_id);
            if (!bankAccounts || bankAccounts.length === 0) {
                logger.info('No bank accounts found');
                req.formattedResponse = formatResponse(200, 'No bank accounts found', []);
                next();
                return;
            }

            logger.debug(`bankAccounts: ${JSON.stringify(bankAccounts)}`);

            const isOwner = await super.verifyOwnership(currentUser, bankAccounts);
            if (!isOwner) {
                throw MyAppErrors.forbidden('You are not allowed to access this resource');
            }
            const message = `Retrieved ${bankAccounts.length} bank account${bankAccounts.length > 1 ? 's' : ''} successfully`;
            logger.debug(`message: ${message}`);
            req.formattedResponse = formatResponse(200, message, { bankAccounts });
            next();
        } catch (error) {
            logger.error(`Failed to retrieve bank accounts: ${error.message}`);
            next(error);
        }
    }

    async getBankAccount(req, res, next) {
        try {
            logger.info('Getting a bank account...');
            logger.debug(`req.params: ${JSON.stringify(req.params)}`);

            // 1. Get current user first to fail fast if not authenticated
            const currentUser = await super.getCurrentUser(req);
            if (!currentUser) {
                throw MyAppErrors.userNotFound();
            }
            logger.debug(`currentUser: ${JSON.stringify(currentUser)}`);

            // 2. Verify and convert parameters
            const requiredFields = ['account_number', 'fi_code'];
            const convertedParams = await super.verifyField(req.params, requiredFields, this.BankAccountModel);
            logger.debug(`convertedParams: ${JSON.stringify(convertedParams)}`);

            const { account_number, fi_code } = convertedParams;
            logger.debug(`account_number: ${account_number}, fi_code: ${fi_code}`);

            // 3. Get bank account with normalized account number
            const convertedAccountNumber = await this.BankAccountUtils.normalizeAccountNumber(account_number);
            logger.debug(`convertedAccountNumber: ${convertedAccountNumber}`);

            const bankAccount = await this.BankAccountModel.get(convertedAccountNumber, fi_code);
            if (!bankAccount) {
                throw MyAppErrors.notFound('Bank account not found');
            }
            logger.debug(`bankAccount retrieved: ${JSON.stringify(bankAccount)}`);

            // 4. Verify ownership before proceeding
            const isOwner = await super.verifyOwnership(currentUser, bankAccount);
            if (!isOwner) {
                throw MyAppErrors.forbidden('You are not allowed to access this resource');
            }

            // 5. Get transactions for the account
            const transactions = await this.TransactionModel.getAllTransactionsForAccount(
                convertedAccountNumber,
                fi_code
            );
            logger.debug(`transactions: ${JSON.stringify(transactions.slice(0, 20), null, 2)}...${transactions.length - 20} remain...`);

            // 6. Format statements
            const statements = transactions.map(transaction => {
                const isSender = transaction.sender?.account_number === convertedAccountNumber &&
                    transaction.sender.fi_code === fi_code;
                const isReceiver = transaction.receiver?.account_number === convertedAccountNumber &&
                    transaction.receiver.fi_code === fi_code;

                return {
                    transaction_id: transaction.transaction_id,
                    datetime: transaction.transaction_datetime,
                    deposit_amount: transaction.category == 'Income' ||
                        (transaction.category == 'Transfer' && isReceiver) ? transaction.amount : null,
                    withdrawal_amount: transaction.category == 'Expense' ||
                        (transaction.category == 'Transfer' && isSender) ? transaction.amount : null,
                    description: transaction.note || ''
                };
            });
            logger.debug(`statements: ${JSON.stringify(statements.slice(0, 20), null, 2)}, ...${statements.length - 20} remain...`);

            // 7. Send response
            req.formattedResponse = formatResponse(200, 'Bank account retrieved successfully', {
                data: {
                    bank_account_details: bankAccount,
                    statements
                }
            });
            next();
        } catch (error) {
            logger.error(`Failed to retrieve bank account: ${error.message}`);
            next(error);
        }
    }

    async updateBankAccount(req, res, next) {
        logger.info('Updating bank account...');
        try {
            // 1. Get current user first to fail fast if not authenticated
            const currentUser = await super.getCurrentUser(req);
            if (!currentUser) {
                throw MyAppErrors.userNotFound();
            }
            logger.debug(`currentUser: ${JSON.stringify(currentUser)}`);

            // 2. Extract and validate parameters
            const { account_number, fi_code } = req.params;
            logger.debug(`Params received: account_number=${account_number}, fi_code=${fi_code}`);

            const validationResult = await this.BankAccountUtils.validateAccountNumber(account_number, fi_code);
            logger.debug(`validationResult: ${JSON.stringify(validationResult)}`);
            if (!validationResult.isValid) {
                logger.error(`validationResult.isValid is false, throwing badRequest error`);
                throw MyAppErrors.badRequest(validationResult.error);
            }

            // 3. Find existing bank account before processing updates
            const existingAccount = await this.BankAccountModel.get(
                await this.BankAccountUtils.normalizeAccountNumber(account_number),
                fi_code
            );
            if (!existingAccount) {
                throw MyAppErrors.notFound('Bank account not found');
            }
            logger.debug(`existingAccount: ${JSON.stringify(existingAccount)}`);

            // 4. Verify ownership before proceeding with update
            const isOwner = await super.verifyOwnership(currentUser, existingAccount);
            if (!isOwner) {
                throw MyAppErrors.forbidden('You are not allowed to access this resource');
            }

            // 5. Process update data
            const updateData = {
                ...req.body,
                account_number: validationResult.formattedNumber || account_number,
                fi_code
            };

            // 6. Verify and convert fields
            const requiredParams = ['account_number', 'fi_code'];
            const convertedUpdateData = await super.verifyField(
                updateData,
                requiredParams,
                this.BankAccountModel
            );

            // 7. Remove empty fields
            Object.keys(convertedUpdateData).forEach(field => {
                if (convertedUpdateData[field] === '' || convertedUpdateData[field] === null) {
                    logger.debug(`field ${field} is empty or null, deleting the field`);
                    delete convertedUpdateData[field];
                }
            });
            logger.debug(`convertedUpdateData after deleting empty fields: ${JSON.stringify(convertedUpdateData)}`);

            if (Object.keys(convertedUpdateData).length <= 2) { // Only has account_number and fi_code
                throw MyAppErrors.badRequest('At least one field is required to update bank account information');
            }

            // 8. Perform update
            const primaryKeys = {
                national_id: currentUser.national_id,
                account_number: convertedUpdateData.account_number,
                fi_code: convertedUpdateData.fi_code
            };

            // Remove keys that are part of primary key from update data
            delete convertedUpdateData.account_number;
            delete convertedUpdateData.fi_code;

            const updatedAccount = await this.BankAccountModel.update(
                primaryKeys,
                convertedUpdateData
            );

            // 9. Format response
            if (updatedAccount.account_number) {
                const formattedAccount = await this.BankAccountModel.get(
                    updatedAccount.account_number,
                    updatedAccount.fi_code
                );
                updatedAccount.account_number = formattedAccount.account_number;
            }

            req.formattedResponse = formatResponse(
                200,
                'Bank account updated successfully',
                { updatedAccount }
            );
            next();
        } catch (error) {
            logger.error(`Failed to update bank account: ${error.message}`);
            if (error instanceof ValidationError) {
                next(MyAppErrors.badRequest(error.message));
            } else if (error.code === '23505') {
                next(MyAppErrors.conflict('Bank account with these details already exists'));
            } else {
                next(error);
            }
        }
    }

    async deleteBankAccount(req, res, next) {
        logger.info('Deleting bank account...');
        try {
            // Extract and verify query parameters
            const requiredFields = ['account_number', 'fi_code'];
            const convertedParams = await super.verifyField(req.params, requiredFields, this.BankAccountModel);
            logger.debug(`Verified params: ${JSON.stringify(convertedParams)}`);

            // Clean up account number
            const cleanedAccountNumber = await this.BankAccountUtils.normalizeAccountNumber(convertedParams.account_number);
            convertedParams.account_number = cleanedAccountNumber;

            // Get current user
            const currentUser = await super.getCurrentUser(req);
            if (!currentUser) {
                throw MyAppErrors.userNotFound();
            }
            logger.debug(`Current user: ${JSON.stringify(currentUser)}`);

            // Find existing bank account
            const existingAccount = await this.BankAccountModel.get(convertedParams.account_number, convertedParams.fi_code);
            if (!existingAccount) {
                throw MyAppErrors.notFound('Bank account not found');
            }
            logger.debug(`Existing account found: ${JSON.stringify(existingAccount)}`);

            // Verify ownership
            const isOwner = await super.verifyOwnership(currentUser, [existingAccount]);
            if (!isOwner) {
                throw MyAppErrors.forbidden('You are not allowed to access this resource');
            }

            // Delete bank account
            await this.BankAccountModel.delete({
                national_id: currentUser.national_id,
                account_number: convertedParams.account_number,
                fi_code: convertedParams.fi_code
            });

            // Format and send response
            req.formattedResponse = formatResponse(200, 'Bank account deleted successfully');
            next();
        } catch (error) {
            logger.error(`Failed to delete bank account: ${error.message}`);
            next(error);
        }
    }
}

module.exports = BankAccountController;
