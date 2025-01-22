const request = require('supertest');
const { Logger } = require('../utilities/Utils');
const { v4: uuidv4 } = require('uuid');

const { app } = require('../app');
const pgClient = require("../services/PgClient");
const FiModel = require("../models/FinancialInstitutionModel");

const logger = Logger('DebtTest');

const { getTestAccessToken } = require('./token-helper');
let accessToken = getTestAccessToken();

describe('Debt Management Flow', () => {
    describe('Create Debt Tests', () => {
        const createDebtCases = [
            {
                testName: "successful debt creation",
                body: global.Debt,
                expected: {
                    status: 201,
                    message: "debt created successfully"
                }
            },
            {
                testName: "missing fi_code",
                body: {
                    ...global.Debt,
                    fi_code: undefined
                },
                expected: {
                    status: 400,
                    message: "Missing required field: fi_code"
                }
            },
            {
                testName: "invalid loan_balance",
                body: {
                    ...global.Debt,
                    loan_balance: -1000
                },
                expected: {
                    status: 400,
                    message: "Loan balance cannot be negative"
                }
            }
        ];

        createDebtCases.forEach((testCase, i) => {
            test(`${i + 1}: ${testCase.testName}`, async () => {
                logger.info(`Running create debt test ${i + 1}: ${testCase.testName}`);
                const response = await request(app)
                    .post('/api/v0.2/debts')
                    .set('Authorization', `Bearer ${accessToken}`)
                    .send(testCase.body);

                expect(response.status).toBe(testCase.expected.status);
                expect(response.body.message).toContain(testCase.expected.message);

                if (testCase.expected.status === 201) {
                    expect(response.body.data).toBeDefined();
                    expect(response.body.data.debt_id).toBeDefined();
                }
            });
        });
    });

    describe('Get Debt Tests', () => {
        beforeEach(async () => {
            // Clear existing debts and create a fresh test debt
            await pgClient.truncateTables(pgClient.tables.DEBTS);

            // Create a test debt and store the response
            const createResponse = await request(app)
                .post('/api/v0.2/debts')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(global.Debt);

            createdDebtId = createResponse.body.data.debt_id;
            logger.debug('Test debt created for get tests');
        });

        const getDebtCases = [
            {
                testName: "get all debts",
                getEndpoint: () => '/api/v0.2/debts',
                expected: {
                    status: 200,
                    message: "debts retrieved successfully"
                }
            },
            {
                testName: "get specific debt",
                getEndpoint: () => `/api/v0.2/debts/${createdDebtId}`,
                expected: {
                    status: 200,
                    message: "debt retrieved successfully"
                }
            },
            {
                testName: "get non-existent debt",
                getEndpoint: () => `/api/v0.2/debts/${uuidv4()}`,
                expected: {
                    status: 404,
                    message: "debt not found"
                }
            }
        ];

        getDebtCases.forEach((testCase, i) => {
            test(`${i + 1}: ${testCase.testName}`, async () => {
                logger.info(`Running get debt test ${i + 1}: ${testCase.testName}`);
                const response = await request(app)
                    .get(testCase.getEndpoint())
                    .set('Authorization', `Bearer ${accessToken}`);

                expect(response.status).toBe(testCase.expected.status);
                expect(response.body.message).toContain(testCase.expected.message);

                if (testCase.expected.status === 200) {
                    expect(response.body.data).toBeDefined();
                }
            });
        });
    });

    describe('Update Debt Tests', () => {
        let createdDebtId;

        beforeEach(async () => {
            // Clear existing debts and create a fresh test debt
            await pgClient.truncateTables(pgClient.tables.DEBTS);

            // Create a test debt and store the ID
            const createResponse = await request(app)
                .post('/api/v0.2/debts')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(global.Debt);

            createdDebtId = createResponse.body.data.debt_id;
            logger.debug('Test debt created for update tests');
        });

        const updateDebtCases = [
            {
                testName: "successful update",
                getEndpoint: () => `/api/v0.2/debts/${createdDebtId}`,
                body: {
                    current_installment: 2,
                    loan_balance: 90000.00
                },
                expected: {
                    status: 200,
                    message: "debt updated successfully"
                }
            },
            {
                testName: "invalid update - negative installment",
                getEndpoint: () => `/api/v0.2/debts/${createdDebtId}`,
                body: {
                    current_installment: -1
                },
                expected: {
                    status: 400,
                    message: "Current installment cannot be negative"
                }
            }
        ];

        updateDebtCases.forEach((testCase, i) => {
            test(`${i + 1}: ${testCase.testName}`, async () => {
                logger.info(`Running update debt test ${i + 1}: ${testCase.testName}`);
                const response = await request(app)
                    .patch(testCase.getEndpoint())
                    .set('Authorization', `Bearer ${accessToken}`)
                    .send(testCase.body);

                expect(response.status).toBe(testCase.expected.status);
                expect(response.body.message).toContain(testCase.expected.message);

                if (testCase.expected.status === 200) {
                    expect(response.body.data).toBeDefined();
                }
            });
        });
    });

    describe('Delete Debt Tests', () => {
        let createdDebtId;

        beforeEach(async () => {
            // Clear existing debts and create a fresh test debt
            await pgClient.truncateTables(pgClient.tables.DEBTS);

            // Create a test debt and store the ID
            const createResponse = await request(app)
                .post('/api/v0.2/debts')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(global.Debt);

            createdDebtId = createResponse.body.data.debt_id;
            logger.debug('Test debt created for delete tests');
        });

        const deleteDebtCases = [
            {
                testName: "successful deletion",
                getEndpoint: () => `/api/v0.2/debts/${createdDebtId}`,
                expected: {
                    status: 200,
                    message: "debt deleted successfully"
                }
            },
            {
                testName: "delete non-existent debt",
                getEndpoint: () => `/api/v0.2/debts/${uuidv4()}`,
                expected: {
                    status: 404,
                    message: "debt not found"
                }
            }
        ];

        deleteDebtCases.forEach((testCase, i) => {
            test(`${i + 1}: ${testCase.testName}`, async () => {
                logger.info(`Running delete debt test ${i + 1}: ${testCase.testName}`);
                const response = await request(app)
                    .delete(testCase.getEndpoint())
                    .set('Authorization', `Bearer ${accessToken}`);

                expect(response.status).toBe(testCase.expected.status);
                expect(response.body.message).toContain(testCase.expected.message);
            });
        });
    });
});
