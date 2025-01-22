const request = require('supertest');
const { app } = require('../app');
const pgClient = require('../services/PgClient');
const FiModel = require('../models/FinancialInstitutionModel');
const UserModel = require('../models/UserModel');
const BankAccountModel = require('../models/BankAccountModel');
const DebtModel = require('../models/DebtModel');
const { Logger } = require('../utilities/Utils');
const appConfigs = require('../configs/AppConfigs');

const logger = Logger('test-setup');


// Set global timeout for all tests
jest.setTimeout(70000);

beforeAll(async () => {
    logger.info('============ test-setup services Loading ===========');
    logger.info('Initializing test environment...');

    // Initialize database
    await pgClient.init();
    logger.debug(`Database connected: ${pgClient.isConnected()}`);

    // Clear all tables
    await pgClient.truncateTables();
    logger.debug('All tables truncated');

    // Initialize financial institutions
    const fi = new FiModel();
    await fi.initializeData();
    logger.info('Financial institution data initialized');

    // Create test user
    const userModel = new UserModel();
    await userModel.createUser({ ...global.User });
    logger.info('Test user created');

    // Create test bank account
    const bankModel = new BankAccountModel();
    await bankModel.create({ ...global.BankAccount, national_id: global.User.national_id });
    logger.info('Test bank account created');

    // Create test debt
    const debtModel = new DebtModel();
    await debtModel.create({ ...global.Debt, national_id: global.User.national_id });
    logger.info('Test debt created');

    // Login to get access token
    const loginResponse = await request(app)
        .post('/api/v0.2/login?platform=mobile')
        .send({
            email: global.User.email,
            password: global.User.password
        });
    if (!loginResponse) {
        logger.error('logging in Failed, unknown error')
    }

    const access_token = loginResponse.body.data.tokens.access_token;

    // Write token to file
    const fs = require('fs');
    const path = require('path');
    const tokenPath = path.join(__dirname, 'test-token.json');
    fs.writeFileSync(tokenPath, JSON.stringify({ access_token }));

    logger.debug(`Login response: ${JSON.stringify(loginResponse.body, null, 2)}`);
    logger.info(`Access token obtained and saved to ${tokenPath}`);
    logger.info('============ test-setup services are Loaded ===========');
});

afterEach(async () => {
    await pgClient.truncateTables();
    logger.debug('All tables truncated');
});

afterAll(async () => {
    logger.info('Releasing database connection...');
    await pgClient.release();
    logger.info('Database connection released');
});



