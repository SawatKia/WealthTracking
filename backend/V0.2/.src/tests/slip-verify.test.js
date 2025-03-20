const request = require("supertest");
const fs = require('fs');
const path = require('path');
const exp = require("constants");

const pgClient = require("../services/PgClient");
const UserModel = require('../models/UserModel');
const BankAccountModel = require('../models/BankAccountModel');
const TransactionModel = require('../models/TransactionModel');
const FinancialInstitutionModel = require("../models/FinancialInstitutionModel");

const { app } = require("../app");
const { Logger } = require("../utilities/Utils");
const logger = Logger("slip-verify.test");
// Mock user for authentication
const mockUser = {
    national_id: '1234567890123',
    username: 'test_user',
    email: 'V2yF3@example.com',
    password: 'testPassword123',
};

const bankAcc = [
    { account_number: '1411906066', fi_code: '004', display_name: 'makeByKBank', account_name: 'Sawat L.', balance: 1000 },
    { account_number: '4883143007', fi_code: '006', display_name: 'passiveIncome', account_name: 'Sawat L.', balance: 1000 },
    { account_number: '4094977687', fi_code: '014', display_name: 'Robinhood', account_name: 'Sawat L.', balance: 1000 },
    { account_number: '2011872940', fi_code: '069', display_name: 'Dime! Save', account_name: 'Sawat L.', balance: 1000 },
    { account_number: '1111700156', fi_code: '004', display_name: 'Kplus', account_name: 'Sawat L.', balance: 1000 },
    { account_number: '0980856322', fi_code: '002', display_name: 'Wage', account_name: 'Sawat L.', balance: 1000 },
    { account_number: '9197233761', fi_code: '011', display_name: 'Saving', account_name: 'Sawat L.', balance: 1000 },
    { account_number: '5074558828', fi_code: '025', display_name: 'Tuition fee', account_name: 'Sawat L.', balance: 1000 },
    { account_number: '7774247932', fi_code: '025', display_name: 'MungMee', account_name: 'Sawat L.', balance: 1000 },
];

const imageFlieName = "Image_6bce7ca3-1219-4f23-bd1e-1bfcc963d621.jpeg";
const testSlipImage = fs.readFileSync(path.join(__dirname, 'test-data', imageFlieName));

const verifySlipTestCases = [
    {
        testName: "success with slip upload",
        method: "POST",
        file: {
            fieldname: 'imageFile',
            buffer: Buffer.from(testSlipImage),// 40 baht ผัดซีอิ๊ว
            originalname: imageFlieName,
        },
        expectedStatus: 200,
        expectedMessage: "EasySlip service is currently unavailable, using OCR text mapping to transaction instead and stored as a transaction",
    },
    {
        testName: "invalid file type",
        method: "POST",
        file: {
            fieldname: 'imageFile',
            buffer: Buffer.from('InvalidImageFileData'),
            originalname: 'invalid.txt',
        },
        expectedStatus: 400,
        expectedMessage: "The uploaded file is invalid or exceeds the size limit.",
    },
    {
        testName: "missing input",
        method: "POST",
        file: {},
        expectedStatus: 400,
        expectedMessage: "No image file provided."
    }
];

describe("Slip Verification API Endpoint", () => {
    let accessToken;

    beforeAll(async () => {
        await pgClient.cleanup();
        await pgClient.init();
        logger.debug(`Database connected: ${await await pgClient.isConnected()}`);

        await pgClient.truncateTables();
        logger.debug(`All rows deleted from all tables in test database`);

        const userModel = new UserModel();
        await userModel.createUser(mockUser);
        logger.info("User registered");

        const fiModel = new FinancialInstitutionModel();
        await fiModel.initializeData();
        logger.info("FI data initialized successfully");

        const bankAccountModel = new BankAccountModel();
        for (const account of bankAcc) {
            await bankAccountModel.create({ ...account, national_id: mockUser.national_id });
        }
        logger.info("Bank accounts created");

        // Verify bank account creation by fetching all bank accounts
        const fetchedBankAccounts = await bankAccountModel.getAll(mockUser.national_id);
        expect(fetchedBankAccounts.length).toBe(bankAcc.length);
        logger.info("Bank accounts verified");

        // Login with mobile platform
        const loginResponse = await request(app)
            .post('/api/v0.2/login?platform=mobile')
            .send({ email: mockUser.email, password: mockUser.password });

        logger.debug(`Login response: ${JSON.stringify(loginResponse.body, null, 2)}`);
        accessToken = loginResponse.body.data.tokens.access_token;
        logger.debug(`Access token obtained: ${accessToken}`);
    }, 30000);

    describe("POST and GET /api/v0.2/slip/verify", () => {
        verifySlipTestCases.forEach((testCase, index) => {
            test(`${index + 1}. ${testCase.testName}`, async () => {
                logger.info(`Test ${index + 1}. ${testCase.testName}`);

                let response;
                let req = request(app)
                    .post("/api/v0.2/slip/verify")
                    .set('Authorization', `Bearer ${accessToken}`);
                if (testCase.file && testCase.file.buffer) {
                    req = req.attach('imageFile', testCase.file.buffer, testCase.file.originalname);
                }

                response = await req;
                logger.debug(`Response: ${JSON.stringify(response.body, null, 2)}`);
                if (testCase.testName === "success with slip upload") {
                    const bankAccData = await request(app)
                        .get(`/api/v0.2/banks/${bankAcc[0].account_number}/${bankAcc[0].fi_code}`)
                        .set('Authorization', `Bearer ${accessToken}`);
                    logger.debug(`Bank account data: ${JSON.stringify(bankAccData.body, null, 2)}`);

                    expect(bankAccData.body.data.balance).toBe(1000 - 40);
                    expect(response.body.data.transaction.category).toBe("Expense");
                    expect(response.body.data.transaction.type).toBe("Foods");
                    expect(response.body.data.transaction.amount).toBe(40);
                    expect(response.body.data.transaction.sender.account_number).toBe(bankAcc[0].account_number);
                    expect(response.body.data.transaction.sender.fi_code).toBe(bankAcc[0].fi_code);
                    expect(response.body.data.transaction.sender.display_name).toBe(bankAcc[0].display_name);
                    expect(response.body.data.transaction.sender.account_name).toBe(bankAcc[0].account_name);
                }
                expect(response.statusCode).toBe(testCase.expectedStatus);
                expect(response.body).toHaveProperty("status_code", testCase.expectedStatus);
                expect(response.body).toHaveProperty("message");
                expect(response.body.message).toMatch(testCase.expectedMessage);

                if (testCase.expectedStatus === 200) {
                    expect(response.body).toHaveProperty("data");
                    logger.warn(`Verify transaction data (category, type, amount, sender/receiver) and bank account balance changes manually.`);
                    logger.warn(`Transaction Data: ${JSON.stringify(response.body.data, null, 2)}`);
                }
            });
        });
    });

    afterAll(async () => {
        await pgClient.release();
        logger.debug(`Database disconnected: ${await !pgClient.isConnected()}`);
    });
});