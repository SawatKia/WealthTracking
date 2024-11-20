const request = require('supertest');
const app = require('../app');
const { Logger } = require('../utilities/Utils');
const pgClient = require("../services/PgClient");

const logger = Logger('AuthenticationTest');

const testUser = {
    national_id: "1234567890321",
    email: "testuser@example.com",
    username: "testuser",
    password: "Password123!",
    confirm_password: "Password123!"
};

describe('Authentication Flow', () => {
    let accessToken;
    let refreshToken;


    beforeAll(async () => {
        // Register a test user first
        await pgClient.init();
        await request(app)
            .post('/api/v0.2/users')
            .send(testUser);
        logger.info("User registered");
    });

    describe('Login Tests', () => {
        const loginCases = [
            {
                testName: "successful login",
                body: {
                    email: testUser.email,
                    password: testUser.password
                },
                expected: {
                    status: 200,
                    message: "Logged in successfully"
                }
            },
            {
                testName: "wrong password",
                body: {
                    email: testUser.email,
                    password: "WrongPassword123!"
                },
                expected: {
                    status: 401,
                    message: "Could not validate credentials"
                }
            },
            {
                testName: "non-existent email",
                body: {
                    email: "nonexistent@example.com",
                    password: testUser.password
                },
                expected: {
                    status: 401,
                    message: "Could not validate credentials"
                }
            },
            {
                testName: "missing email",
                body: {
                    password: testUser.password
                },
                expected: {
                    status: 400,
                    message: "Missing required field: email"
                }
            },
            {
                testName: "missing password",
                body: {
                    email: testUser.email
                },
                expected: {
                    status: 400,
                    message: "Missing required field: password"
                }
            }
        ];

        loginCases.forEach((testCase, i) => {
            test(`${i + 1}: ${testCase.testName}`, async () => {
                logger.info(`Running login test ${i + 1}: ${testCase.testName}`);
                const response = await request(app)
                    .post('/api/v0.2/login')
                    .send(testCase.body);

                logger.debug(`response from ${i + 1}) ${testCase.testName}: ${JSON.stringify(response, null, 2)}`);
                expect(response.status).toBe(testCase.expected.status);
                expect(response.body.message).toContain(testCase.expected.message);

                if (testCase.expected.status === 200) {
                    expect(response.headers['set-cookie']).toBeDefined();
                    const cookies = response.headers['set-cookie'];
                    accessToken = cookies.find(cookie => cookie.includes('access_token'));
                    refreshToken = cookies.find(cookie => cookie.includes('refresh_token'));
                    expect(accessToken).toBeDefined();
                    expect(refreshToken).toBeDefined();
                }
            });
        });
    });

    describe('Token Refresh Tests', () => {
        const refreshCases = [
            {
                testName: "successful refresh",
                cookies: () => [refreshToken],
                expected: {
                    status: 200,
                    message: "Tokens refreshed successfully"
                }
            },
            {
                testName: "missing refresh token",
                cookies: () => ({}),
                expected: {
                    status: 401,
                    message: "Could not validate credentials"
                }
            }
        ];

        refreshCases.forEach((testCase, i) => {
            test(`${i + 1}: ${testCase.testName}`, async () => {
                logger.info(`Running refresh_token test ${i + 1}: ${testCase.testName}`);
                const response = await request(app)
                    .post('/api/v0.2/refresh')
                    .set('Cookie', [testCase.cookies()]);

                expect(response.status).toBe(testCase.expected.status);
                expect(response.body.message).toContain(testCase.expected.message);

                if (testCase.expected.status === 200) {
                    expect(response.headers['set-cookie']).toBeDefined();
                    const cookies = response.headers['set-cookie'];
                    accessToken = cookies.find(cookie => cookie.includes('access_token'));
                    refreshToken = cookies.find(cookie => cookie.includes('refresh_token'));
                    expect(accessToken).toBeDefined();
                    expect(refreshToken).toBeDefined();
                }
            });
        });
    });

    describe('Logout Tests', () => {
        test('successful logout', async () => {
            const response = await request(app)
                .post('/api/v0.2/logout')
                .set('Cookie', [accessToken, refreshToken]);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Logged out successfully');

            // Verify cookies are cleared
            const cookies = response.headers['set-cookie'];
            expect(cookies.some(cookie => cookie.includes('access_token=;'))).toBe(true);
            expect(cookies.some(cookie => cookie.includes('refresh_token=;'))).toBe(true);
        });
    });

    // Export the tokens for use in other test files
    afterAll(() => {
        global.testTokens = {
            accessToken,
            refreshToken
        };
    });
});
