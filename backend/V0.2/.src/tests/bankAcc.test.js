const request = require("supertest");
const { app } = require("../app");
const pgClient = require("../services/PgClient");
const FiModel = require("../models/FinancialInstitutionModel");
const { Logger } = require("../utilities/Utils");
const logger = Logger("bankAcc.test");
const { getTestAccessToken } = require('./token-helper');
let accessToken = getTestAccessToken();

describe('Bank Account Management', () => {

    describe('Bank Account Creation', () => {
        const createBankAccountCases = [
            // Success cases
            {
                testName: "success",
                body: global.BankAccount,
                expected: {
                    status: 201,
                    message: "Bank account created successfully",
                    data: {
                        ...global.BankAccount,
                        national_id: global.User.national_id
                    }
                }
            },

            // Required field tests
            ...[
                ['account_number', undefined],
                ['fi_code', undefined],
                ['display_name', undefined],
                ['account_name', undefined],
                ['balance', undefined],
            ].map(([field, value]) => ({
                testName: `missing ${field}`,
                body: { ...global.BankAccount, [field]: value },
                expected: {
                    status: 400,
                    message: `Missing required field: ${field}`
                }
            })),

            ...[
                'account_number',
                'fi_code',
                'display_name',
                'account_name',
                'balance'
            ].map(field => ({
                testName: `empty ${field}`,
                body: { ...global.BankAccount, [field]: '' },
                expected: {
                    status: 400,
                    message: `Missing required field: ${field}`
                }
            })),

            // Account number validation
            {
                testName: "valid Kasikorn account",
                body: { ...global.BankAccount, account_number: "1234567890" },
                expected: {
                    status: 201,
                    message: "Bank account created successfully",
                    data: {
                        ...global.BankAccount,
                        account_number: "123-4-56789-0",
                        national_id: global.User.national_id
                    }
                }
            },
            {
                testName: "valid Kasikorn account with separators",
                body: { ...global.BankAccount, account_number: "123-4-56789-0" },
                expected: {
                    status: 400,
                    message: "Bank account already exists for this user."
                }
            },
            {
                testName: "account_number exceeds max length",
                body: { ...global.BankAccount, account_number: "123456789012345678901" },
                expected: {
                    status: 400,
                    message: "Account number must not exceed 20 characters."
                }
            },
            {
                testName: "account_number contains non-numeric characters",
                body: { ...global.BankAccount, account_number: "12345ABV7890" },
                expected: {
                    status: 400,
                    message: "Normalization error: Invalid account number, It should contain only digits or digits with dashes"
                }
            },

            // FI code validation
            {
                testName: "unsupported bank code",
                body: { ...global.BankAccount, fi_code: "999" },
                expected: {
                    status: 404,
                    message: "Financial institution with fi_code '999' not found. To get a list of available fi_codes, please use the /fi/ endpoint."
                }
            },

            // Name validation
            {
                testName: "display_name exceeds max length",
                body: { ...global.BankAccount, display_name: "A".repeat(101) },
                expected: {
                    status: 400,
                    message: "Display name must not exceed 100 characters."
                }
            },
            {
                testName: "account_name exceeds max length",
                body: { ...global.BankAccount, account_name: "A".repeat(101) },
                expected: {
                    status: 400,
                    message: "Account name must not exceed 100 characters."
                }
            },

            // Balance validation
            {
                testName: "balance with more than 2 decimal places",
                body: { ...global.BankAccount, balance: "1000.999" },
                expected: {
                    status: 400,
                    message: "Invalid balance"
                }
            },
            {
                testName: "balance as non-numeric string",
                body: { ...global.BankAccount, balance: "not a number" },
                expected: {
                    status: 400,
                    message: "Invalid number format for field: balance"
                }
            },
            {
                testName: "balance < 0",
                body: { ...global.BankAccount, balance: "-100.00" },
                expected: {
                    status: 400,
                    message: "Invalid balance."
                }
            }
        ];

        createBankAccountCases.forEach((testCase, index) => {
            test(`${index + 1}: ${testCase.testName}`, async () => {
                logger.info(`Running test ${index + 1}: ${testCase.testName}`);

                const response = await request(app)
                    .post('/api/v0.2/banks')
                    .set('Authorization', `Bearer ${accessToken}`)
                    .send(testCase.body);

                expect(response.status).toBe(testCase.expected.status);
                expect(response.body.message).toContain(testCase.expected.message);

                if (testCase.expected.data) {
                    expect(response.body.data).toEqual(testCase.expected.data);
                }
            });
        });
    });

    describe('Get Bank Account', () => {
        test('get bank account', async () => {
            logger.info('Running test to get bank account');

            await pgClient.truncateTables(pgClient.tables.BANK_ACCOUNTS);

            // First create a bank account
            await request(app)
                .post('/api/v0.2/banks')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(global.BankAccount);

            const response = await request(app)
                .get(`/api/v0.2/banks/${global.BankAccount.account_number}/${global.BankAccount.fi_code}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Bank account retrieved successfully');
            expect(response.body.data.bankAccount).toEqual({
                ...global.BankAccount,
                national_id: global.User.national_id
            });
        });

        test('get non-existent bank account', async () => {
            logger.info('Running test to get non-existent bank account');
            const response = await request(app)
                .get('/api/v0.2/banks/99999999999/999')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Bank account not found');
        });
    });

    describe('Get All Bank Accounts', () => {
        test('get all bank accounts', async () => {
            logger.info('Running test to get all bank accounts');
            const response = await request(app)
                .get('/api/v0.2/banks')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.data.bankAccounts)).toBe(true);
            expect(response.body.data.bankAccounts.length).toBeGreaterThan(0);
        });

        test('get all bank accounts when none exist', async () => {
            logger.info('Running test to get all bank accounts when none exist');
            // First delete all existing accounts
            await pgClient.query('DELETE FROM bank_accounts');

            const response = await request(app)
                .get('/api/v0.2/banks')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('No bank accounts found');
            expect(response.body.data).toEqual([]);
        });
    });

    describe('Update Bank Account', () => {
        beforeEach(async () => {
            await pgClient.truncateTables(pgClient.tables.BANK_ACCOUNTS);
            // Create a test bank account before each update test
            await request(app)
                .post('/api/v0.2/banks')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(global.BankAccount);
        });

        test('update bank account', async () => {
            logger.info('Running test to update bank account');
            const updateData = {
                display_name: "Updated Display Name",
                account_name: "Updated Account Name"
            };

            const response = await request(app)
                .patch(`/api/v0.2/banks/${global.BankAccount.account_number}/${global.BankAccount.fi_code}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Bank account updated successfully');
            expect(response.body.data.updatedAccount.display_name).toBe(updateData.display_name);
            expect(response.body.data.updatedAccount.account_name).toBe(updateData.account_name);
        });

        test('update non-existent bank account', async () => {
            logger.info('Running test to update non-existent bank account');
            const response = await request(app)
                .patch('/api/v0.2/banks/99999999999/999')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ display_name: "New Name" });

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Bank account not found');
        });

        test('update with empty data', async () => {
            logger.info('Running test to update with empty data');
            const response = await request(app)
                .patch(`/api/v0.2/banks/${global.BankAccount.account_number}/${global.BankAccount.fi_code}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('At least one field is required to update bank account information');
        });
    });

    describe('Delete Bank Account', () => {
        beforeEach(async () => {
            await pgClient.truncateTables(pgClient.tables.BANK_ACCOUNTS);
            // Create a test bank account before each delete test
            await request(app)
                .post('/api/v0.2/banks')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(global.BankAccount);
        });

        test('delete bank account', async () => {
            logger.info('Running test to delete bank account');
            const response = await request(app)
                .delete(`/api/v0.2/banks/${global.BankAccount.account_number}/${global.BankAccount.fi_code}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Bank account deleted successfully');

            // Verify the account is actually deleted
            const getResponse = await request(app)
                .get(`/api/v0.2/banks/${global.BankAccount.account_number}/${global.BankAccount.fi_code}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(getResponse.status).toBe(404);
        });

        test('delete non-existent bank account', async () => {
            logger.info('Running test to delete non-existent bank account');
            const response = await request(app)
                .delete('/api/v0.2/banks/99999999999/999')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Bank account not found');
        });
    });
});
