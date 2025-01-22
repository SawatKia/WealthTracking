const request = require('supertest');
const { app } = require('../app');
const { Logger } = require('../utilities/Utils');
const { getTestAccessToken } = require('./token-helper');

const logger = Logger('AuthenticationTest');

describe('Authentication Flow', () => {
    let refreshToken;

    describe('Login Tests', () => {
        const loginCases = [
            {
                testName: "successful login",
                body: {
                    email: global.User.email,
                    password: global.User.password
                },
                expected: {
                    status: 200,
                    message: "Logged in successfully"
                }
            },
            {
                testName: "wrong password",
                body: {
                    email: global.User.email,
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
                    password: global.User.password
                },
                expected: {
                    status: 401,
                    message: "Could not validate credentials"
                }
            },
            {
                testName: "missing email",
                body: {
                    password: global.User.password
                },
                expected: {
                    status: 400,
                    message: "Missing required field: email"
                }
            },
            {
                testName: "missing password",
                body: {
                    email: global.User.email
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
                    .post('/api/v0.2/login?platform=mobile')
                    .send(testCase.body);

                logger.debug(`response from ${i + 1}) ${testCase.testName}: ${JSON.stringify(response.body, null, 2)}`);
                expect(response.status).toBe(testCase.expected.status);
                expect(response.body.message).toContain(testCase.expected.message);

                if (testCase.expected.status === 200) {
                    expect(response.body.data).toBeDefined();
                    expect(response.body.data.tokens).toBeDefined();
                    accessToken = response.body.data.tokens.access_token;
                    refreshToken = response.body.data.tokens.refresh_token;
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
                getHeaders: () => ({ 'x-refresh-token': refreshToken }),
                expected: {
                    status: 200,
                    message: "Tokens refreshed successfully"
                }
            },
            {
                testName: "missing refresh token",
                getHeaders: () => ({}),
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
                    .post('/api/v0.2/refresh?platform=mobile')
                    .set(testCase.getHeaders());

                expect(response.status).toBe(testCase.expected.status);
                expect(response.body.message).toContain(testCase.expected.message);

                if (testCase.expected.status === 200) {
                    expect(response.body.data).toBeDefined();
                    expect(response.body.data.tokens).toBeDefined();
                    accessToken = response.body.data.tokens.access_token;
                    refreshToken = response.body.data.tokens.refresh_token;
                    expect(accessToken).toBeDefined();
                    expect(refreshToken).toBeDefined();
                }
            });
        });
    });

    describe('Logout Tests', () => {
        test('successful logout', async () => {
            const response = await request(app)
                .post('/api/v0.2/logout?platform=mobile')
                .set('Authorization', `Bearer ${refreshToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toContain('on mobile, just remove both refresh and access tokens from your storage');
        });
    });
});
