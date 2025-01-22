const path = require('path');
require('dotenv').config({ path: path.join(__dirname, "../../.env.test") });
const { Logger } = require('../utilities/Utils');

const logger = Logger('env-setup');

logger.info("============ env-setup Loading ===========");

// Global test state management
let _accessToken = null;  // Private variable
global.setAccessToken = (token) => {
    _accessToken = token;
    logger.debug(`Access token set: ${token}`);
};
global.getAccessToken = () => _accessToken;

// Global test setup
global.access_token;

// Global test data
global.User = {
    national_id: '1234567890123',
    email: 'test@example.com',
    username: 'testuser',
    password: 'Password123!',
    date_of_birth: '1990-01-01'
};

global.BankAccount = {
    account_number: '1234567890',
    fi_code: '004',
    display_name: 'Test Account',
    account_name: 'Test User Account',
    balance: '10000.00'
};

global.Debt = {
    debt_id: '550e8400-e29b-41d4-a716-446655440000',
    debt_name: 'Test Debt',
    loan_principle: '10000.00',
    loan_balance: '10000.00',
    start_date: '2024-01-01',
    current_installment: 0,
    total_installments: 12,
    fi_code: '004'
};

logger.info('============ env-setup Loaded ===========');
