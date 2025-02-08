const request = require("supertest");

const pgClient = require("../services/PgClient");
const FiModel = require("../models/FinancialInstitutionModel");
const UserModel = require('../models/UserModel');
const BankAccountModel = require('../models/BankAccountModel');
const DebtModel = require('../models/DebtModel');
const FinancialInstitutionModel = require("../models/FinancialInstitutionModel");

const { ValidationError } = require('../utilities/ValidationErrors');
const { app } = require("../app");
const { Logger } = require("../utilities/Utils");
const logger = Logger("transaction.test");

// Mock user for authentication
const mockUser = {
    national_id: '1234567890123',
    email: 'transaction@test.com',
    username: 'transaction_test',
    role: 'user',
    password: 'testPassword123',
    date_of_birth: '1990-01-01',
    member_since: new Date().toISOString()
};

// Mock bank accounts
const senderAccount = {
    account_number: "1234567890",
    fi_code: "004",
    display_name: "Sender Account",
    account_name: "Test Sender Account",
    balance: "10000.00"
};

const receiverAccount = {
    account_number: "9876543210",
    fi_code: "004",
    display_name: "Receiver Account",
    account_name: "Test Receiver Account",
    balance: "5000.00"
};

// Mock debt
const mockDebt = {
    debt_name: "Test Debt",
    loan_principle: "10000.00",
    loan_balance: "10000.00",
    start_date: "2024-01-01",
    current_installment: 0,
    total_installments: 12,
    fi_code: "004",
    national_id: mockUser.national_id,
    debt_id: "550e8400-e29b-41d4-a716-446655440000"
};

describe('Transaction Management', () => {
    let accessToken;

    beforeAll(async () => {
        await pgClient.cleanup();
        await pgClient.init();
        logger.debug(`Database connected: ${await pgClient.isConnected()}`);

        await pgClient.truncateTables();
        logger.debug(`All rows deleted from tables`);

        const fi = new FiModel();
        await fi.initializeData();
        logger.info('Financial institution data initialized');

        // Add mock user
        const userModel = new UserModel();
        logger.info('UserModel initialized, creating mock user');

        try {
            await userModel.createUser(mockUser);
            logger.info('Mock user created');

            // Create bank accounts
            const bankModel = new BankAccountModel();
            await bankModel.create({ ...senderAccount, national_id: mockUser.national_id });
            await bankModel.create({ ...receiverAccount, national_id: mockUser.national_id });
            logger.info('Mock bank accounts created');

            // Create debt
            const debtModel = new DebtModel();
            await debtModel.create({ ...mockDebt, national_id: mockUser.national_id });
            logger.info('Mock debt created');

            // Login
            const loginResponse = await request(app)
                .post('/api/v0.2/login?platform=mobile')
                .send({ email: mockUser.email, password: mockUser.password });

            accessToken = loginResponse.body.data.tokens.access_token;
            logger.debug(`Access token obtained: ${accessToken}`);
        } catch (error) {
            logger.error(`Error in setup: ${error.message}`);
            throw error;
        }
    });

    describe('Transaction Creation', () => {
        const successCases = [
            {
                testName: "create income transaction",
                body: {
                    transaction_datetime: "2024-03-15T10:30:00Z",
                    category: "Income",
                    type: "Salary",
                    amount: 5000,
                    note: "Monthly salary",
                    receiver: {
                        account_number: receiverAccount.account_number,
                        fi_code: receiverAccount.fi_code
                    }
                },
                expected: {
                    status: 201,
                    message: "Transaction created successfully",
                    balanceCheck: async () => {
                        const bankModel = new BankAccountModel();
                        const account = await bankModel.findOne({
                            account_number: receiverAccount.account_number,
                            fi_code: receiverAccount.fi_code
                        });
                        expect(parseFloat(account.balance)).toBe(10000.00); // 5000 + 5000
                    }
                }
            },
            {
                testName: "create expense transaction",
                body: {
                    transaction_datetime: "2024-03-15T10:30:00Z",
                    category: "Expense",
                    type: "Food",
                    amount: 1000,
                    note: "Lunch",
                    sender: {
                        account_number: senderAccount.account_number,
                        fi_code: senderAccount.fi_code
                    }
                },
                expected: {
                    status: 201,
                    message: "Transaction created successfully",
                    balanceCheck: async () => {
                        const bankModel = new BankAccountModel();
                        const account = await bankModel.findOne({
                            account_number: senderAccount.account_number,
                            fi_code: senderAccount.fi_code
                        });
                        expect(parseFloat(account.balance)).toBe(9000.00); // 10000 - 1000
                    }
                }
            },
            {
                testName: "create transfer transaction",
                body: {
                    transaction_datetime: "2024-03-15T10:30:00Z",
                    category: "Transfer",
                    type: "Transfer",
                    amount: 2000,
                    note: "Transfer to savings",
                    sender: {
                        account_number: senderAccount.account_number,
                        fi_code: senderAccount.fi_code
                    },
                    receiver: {
                        account_number: receiverAccount.account_number,
                        fi_code: receiverAccount.fi_code
                    }
                },
                expected: {
                    status: 201,
                    message: "Transaction created successfully",
                    balanceCheck: async () => {
                        const bankModel = new BankAccountModel();
                        const senderAcc = await bankModel.findOne({
                            account_number: senderAccount.account_number,
                            fi_code: senderAccount.fi_code
                        });
                        const receiverAcc = await bankModel.findOne({
                            account_number: receiverAccount.account_number,
                            fi_code: receiverAccount.fi_code
                        });
                        expect(parseFloat(senderAcc.balance)).toBe(7000.00); // 9000 - 2000
                        expect(parseFloat(receiverAcc.balance)).toBe(12000.00); // 10000 + 2000
                    }
                }
            },
            {
                testName: "create debt payment transaction",
                body: {
                    transaction_datetime: "2024-03-15T10:30:00Z",
                    category: "Expense",
                    type: "Debt Payment",
                    amount: 1000,
                    note: "Monthly debt payment",
                    sender: {
                        account_number: senderAccount.account_number,
                        fi_code: senderAccount.fi_code
                    },
                    debt_id: mockDebt.debt_id
                },
                expected: {
                    status: 201,
                    message: "Transaction created successfully",
                    balanceCheck: async () => {
                        const bankModel = new BankAccountModel();
                        const debtModel = new DebtModel();
                        const account = await bankModel.findOne({
                            account_number: senderAccount.account_number,
                            fi_code: senderAccount.fi_code
                        });
                        const debt = await debtModel.findOne({ debt_id: mockDebt.debt_id });
                        expect(parseFloat(account.balance)).toBe(6000.00);
                        expect(parseFloat(debt.loan_balance)).toBe(9000.00);
                    }
                }
            }
        ];

        // Required field tests
        const requiredFields = [
            'transaction_datetime',
            'category',
            'type',
            'amount'
        ];

        const missingFieldCases = requiredFields.map(field => ({
            testName: `missing ${field}`,
            body: {
                ...successCases[0].body,
                [field]: undefined
            },
            expected: {
                status: 400,
                message: `Missing required field: ${field}`
            }
        }));

        const emptyFieldCases = requiredFields.map(field => ({
            testName: `empty ${field}`,
            body: {
                ...successCases[0].body,
                [field]: ''
            },
            expected: {
                status: 400,
                message: `Missing required field: ${field}`
            }
        }));

        // Abnormal input tests
        const abnormalCases = [
            {
                testName: "amount as string",
                body: {
                    ...successCases[0].body,
                    amount: "not a number"
                },
                expected: {
                    status: 400,
                    message: "Invalid number format for field: amount"
                }
            },
            {
                testName: "negative amount",
                body: {
                    ...successCases[0].body,
                    amount: -1000
                },
                expected: {
                    status: 400,
                    message: "Amount must be a positive number."
                }
            },
            {
                testName: "Invalid category",
                body: {
                    ...successCases[0].body,
                    category: "Invalid"
                },
                expected: {
                    status: 400,
                    message: "Invalid category"
                }
            },
            {
                testName: "invalid type for category",
                body: {
                    ...successCases[0].body,
                    type: "Invalid"
                },
                expected: {
                    status: 400,
                    message: "type \"Invalid\" is not allowed for \"Income\". Must be one of: "
                }
            }
        ];

        // Run all test cases
        [...successCases, ...missingFieldCases, ...emptyFieldCases, ...abnormalCases]
            .forEach((testCase, index) => {
                test(`${index + 1}: ${testCase.testName}`, async () => {
                    logger.info(`Running test ${index + 1}: ${testCase.testName}`);

                    const response = await request(app)
                        .post('/api/v0.2/transactions')
                        .set('Authorization', `Bearer ${accessToken}`)
                        .send(testCase.body);

                    expect(response.status).toBe(testCase.expected.status);
                    expect(response.body.message).toContain(testCase.expected.message)


                    if (testCase.expected.balanceCheck) {
                        await testCase.expected.balanceCheck();
                    }
                });
            });
    });

    afterAll(async () => {
        await pgClient.release();
        logger.debug(`Database disconnected: ${await !pgClient.isConnected()}`);
    });
}); 