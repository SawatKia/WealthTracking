const request = require("supertest");
const app = require("../app");
const pgClient = require("../services/PgClient");
const FiModel = require("../models/FinancialInstitutionModel");
const { test: testConfig } = require("../configs/dbConfigs");
const { Logger, formatResponse } = require("../utilities/Utils");
const logger = Logger("bankAcc.test");
const UserModel = require('../models/UserModel');
const { ValidationError } = require('../utilities/ValidationErrors');

// Mock JWT token
let accessToken;
const newBankAccount = [
    //* success
    {
        testName: "success",
        body: {
            account_number: "12345678901234567890",
            fi_code: "004",
            display_name: "Test Bank Account",
            account_name: "Test Bank Account Name",
            balance: "1000.00"
        },
        expected: {
            status: 201,
            message: "Bank account created successfully",
            data: {
                account_number: "12345678901234567890",
                fi_code: "004",
                national_id: "1234567890123",
                display_name: "Test Bank Account",
                account_name: "Test Bank Account Name",
                balance: "1000.00"
            }
        }
    },
    //* missing and empty account_number
    {
        testName: "missing account_number",
        body: {
            fi_code: "004",
            display_name: "Test Bank Account",
            account_name: "Test Bank Account Name",
            balance: "1000.00"
        },
        expected: {
            status: 400,
            message: "Missing required field: account_number"
        }
    },
    {
        testName: "empty account_number",
        body: {
            account_number: "",
            fi_code: "004",
            display_name: "Test Bank Account",
            account_name: "Test Bank Account Name",
            balance: "1000.00"
        },
        expected: {
            status: 400,
            message: "Missing required field: account_number"
        }
    },
    //* missing and empty fi_code
    {
        testName: "missing fi_code",
        body: {
            account_number: "12345678901234567890",
            display_name: "Test Bank Account",
            account_name: "Test Bank Account Name",
            balance: "1000.00"
        },
        expected: {
            status: 400,
            message: "Missing required field: fi_code"
        }
    },
    {
        testName: "empty fi_code",
        body: {
            account_number: "12345678901234567890",
            fi_code: "",
            display_name: "Test Bank Account",
            account_name: "Test Bank Account Name",
            balance: "1000.00"
        },
        expected: {
            status: 400,
            message: "Missing required field: fi_code"
        }
    },
    //* missing and empty display_name
    {
        testName: "missing display_name",
        body: {
            account_number: "12345678901234567890",
            fi_code: "004",
            account_name: "Test Bank Account Name",
            balance: "1000.00"
        },
        expected: {
            status: 400,
            message: "Missing required field: display_name"
        }
    },
    {
        testName: "empty display_name",
        body: {
            account_number: "12345678901234567890",
            fi_code: "004",
            display_name: "",
            account_name: "Test Bank Account Name",
            balance: "1000.00"
        },
        expected: {
            status: 400,
            message: "Missing required field: display_name"
        }
    },
    //* missing and empty account_name
    {
        testName: "missing account_name",
        body: {
            account_number: "12345678901234567890",
            fi_code: "004",
            display_name: "Test Bank Account",
            balance: "1000.00"
        },
        expected: {
            status: 400,
            message: "Missing required field: account_name"
        }
    },
    {
        testName: "empty account_name",
        body: {
            account_number: "12345678901234567890",
            fi_code: "004",
            display_name: "Test Bank Account",
            account_name: "",
            balance: "1000.00"
        },
        expected: {
            status: 400,
            message: "Missing required field: account_name"
        }
    },
    //* missing and empty balance
    {
        testName: "missing balance",
        body: {
            account_number: "12345678901234567890",
            fi_code: "004",
            display_name: "Test Bank Account",
            account_name: "Test Bank Account Name"
        },
        expected: {
            status: 400,
            message: "Missing required field: balance"
        }
    },
    {
        testName: "empty balance",
        body: {
            account_number: "12345678901234567890",
            fi_code: "004",
            display_name: "Test Bank Account",
            account_name: "Test Bank Account Name",
            balance: ""
        },
        expected: {
            status: 400,
            message: "Missing required field: balance"
        }
    },

    //* account number
    {
        testName: "valid Kasikorn account",
        body: {
            account_number: "1234567890", // User inputs without separators
            fi_code: "004",
            display_name: "Test Bank Account",
            account_name: "Test Bank Account Name",
            balance: '1000.00'
        },
        expected: {
            status: 201,
            message: "Bank account created successfully",
            data: {
                account_number: "123-4-56789-0", // Note the formatted output
                fi_code: "004",
                national_id: "1234567890123",
                display_name: "Test Bank Account",
                account_name: "Test Bank Account Name",
                balance: "1000.00"
            }
        }
    },
    {
        testName: "valid Kasikorn account with separators",
        body: {
            account_number: "123-4-56789-0", // User inputs with separators
            fi_code: "004",
            display_name: "Test Bank Account",
            account_name: "Test Bank Account Name",
            balance: "1000.00"
        },
        expected: {
            status: 400,
            message: "Bank account already exists for this user.",
        }
    },
    {
        testName: "invalid account number for bank",
        body: {
            account_number: "123456789", // SCB format for Kasikorn bank
            fi_code: "004",
            display_name: "Test Bank Account",
            account_name: "Test Bank Account Name",
            balance: "1000.00"
        },
        expected: {
            status: 201,
            message: "Bank account created successfully",
            data: {
                account_number: "123456789",
                fi_code: "004",
                national_id: "1234567890123",
                display_name: "Test Bank Account",
                account_name: "Test Bank Account Name",
                balance: "1000.00"
            }
        }
    },
    {
        testName: "account_number exceeds max length",
        body: {
            account_number: "123456789012345678901", // 21 characters, exceeds 20
            fi_code: "004",
            display_name: "Test Bank Account",
            account_name: "Test Bank Account Name",
            balance: "1000.00"
        },
        expected: {
            status: 400,
            message: "Account number must not exceed 20 characters."
        }
    },
    {
        testName: "account_number contains non-numeric characters",
        body: {
            account_number: "12345ABV7890",
            fi_code: "004",
            display_name: "Test Bank Account",
            account_name: "Test Bank Account Name",
            balance: "1000.00"
        },
        expected: {
            status: 400,
            message: "Account number should contain only digits or digits with dashes"
        }
    },

    //* fi_code
    {
        testName: "unsupported bank code",
        body: {
            account_number: "123456789",
            fi_code: "999", // Unsupported bank code
            display_name: "Test Bank Account",
            account_name: "Test Bank Account Name",
            balance: "1000.00"
        },
        expected: {
            status: 404,
            message: "Financial institution with fi_code '999' not found. To get a list of available fi_codes, please use the /fi/ endpoint."
        }
    },
    {
        testName: "fi_code exceeds max length",
        body: {
            account_number: "12345678901234567890",
            fi_code: "12345678901234567890A", // 21 characters, exceeds 20
            display_name: "Test Bank Account",
            account_name: "Test Bank Account Name",
            balance: "1000.00"
        },
        expected: {
            status: 404,
            message: "Financial institution with fi_code '12345678901234567890A' not found. To get a list of available fi_codes, please use the /fi/ endpoint."
        }
    },
    {
        testName: "fi_code contains non-numeric characters",
        body: {
            account_number: "12345678901234567890",
            fi_code: "FI_TEST!",
            display_name: "Test Bank Account",
            account_name: "Test Bank Account Name",
            balance: "1000.00"
        },
        expected: {
            status: 404,
            message: "Financial institution with fi_code 'FI_TEST!' not found. To get a list of available fi_codes, please use the /fi/ endpoint."
        }
    },
    //* display_name
    {
        testName: "display_name exceeds max length",
        body: {
            account_number: "12345678901234567890",
            fi_code: "004",
            display_name: "A".repeat(101), // 101 characters, exceeds 100
            account_name: "Test Bank Account Name",
            balance: "1000.00"
        },
        expected: {
            status: 400,
            message: "Display name must not exceed 100 characters."
        }
    },
    //* account_name
    {
        testName: "account_name exceeds max length",
        body: {
            account_number: "12345678901234567890",
            fi_code: "004",
            display_name: "Test Bank Account",
            account_name: "A".repeat(101), // 101 characters, exceeds 100
            balance: "1000.00"
        },
        expected: {
            status: 400,
            message: "Account name must not exceed 100 characters."
        }
    },
    //* balance
    {
        testName: "balance with more than 2 decimal places",
        body: {
            account_number: "0987654321",
            fi_code: "004",
            display_name: "Test Bank Account",
            account_name: "Test Bank Account Name",
            balance: "1000.999"
        },
        expected: {
            status: 400,
            message: "Balance must have at most 2 decimal places."
        }
    },
    {
        testName: "balance as non-numeric string",
        body: {
            account_number: "12345678901234567890",
            fi_code: "004",
            display_name: "Test Bank Account",
            account_name: "Test Bank Account Name",
            balance: "not a number"
        },
        expected: {
            status: 400,
            message: "Invalid number format for field: balance"
        }
    },
    {
        testName: "balance < 0",
        body: {
            account_number: "12345678901234567890",
            fi_code: "004",
            display_name: "Test Bank Account",
            account_name: "Test Bank Account Name",
            balance: "-100.00"
        },
        expected: {
            status: 400,
            message: "balance must not be negative."
        }
    },
];

beforeAll(async () => {
    await pgClient.init(); // Initialize PgClient
    logger.debug(`Database connected: ${pgClient.isConnected()}`);

    await pgClient.truncateTables();
    logger.debug(`All rows deleted from tables`);

    const fi = new FiModel();
    await fi.initializeData();
    logger.info('Financial institution data initialized');

    // Add mock user
    const userModel = new UserModel();
    logger.info('UserModel initialized, creating mock user');
    const mockUser = {
        national_id: '1234567890123',
        email: 'V2yF3@example.com',
        username: 'test_user',
        role: 'user',
        password: 'testPassword123',
        date_of_birth: '1990-01-01',
        member_since: new Date().toISOString()
    };
    try {
        await userModel.createUser(mockUser);
        logger.info('Mock user created');

        // Login with mobile platform
        const loginResponse = await request(app)
            .post('/api/v0.2/login?platform=mobile')
            .send({ email: mockUser.email, password: mockUser.password });

        // Extract access token from response body
        // accessToken = response.headers['set-cookie'].find(cookie => cookie.includes('access_token'));
        accessToken = loginResponse.body.data.tokens.access_token;
        logger.debug(`Access token obtained: ${accessToken}`);
    } catch (error) {
        if (error instanceof ValidationError) {
            logger.warn(`Validation error while creating mock user: ${error.message}`);
        } else {
            logger.error(`Error creating mock user: ${error.message}`);
            throw error;
        }
    }
}, 30000);

afterAll(async () => {
    await pgClient.release(); // Release the PgClient
    logger.debug(`Database disconnected: ${!pgClient.isConnected()}`);
}, 30000);

describe('Bank Account Creation', () => {
    newBankAccount.forEach((testCase, index) => {
        test(`${index + 1}: ${testCase.testName}`, async () => {
            logger.info(`Running test ${index + 1}: ${testCase.testName}`);

            const response = await request(app)
                .post('/api/v0.2/banks')
                // .set('Cookie', [accessToken])
                .set('Authorization', `Bearer ${accessToken}`)
                .send(testCase.body);

            expect(response.status).toBe(testCase.expected.status);
            expect(response.body.message).toContain(testCase.expected.message);

            if (testCase.expected.data) {
                expect(response.body.data).toEqual(testCase.expected.data);
            }
        }, 30000);
    });
});