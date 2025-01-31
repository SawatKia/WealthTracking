const request = require("supertest");
const { app } = require("../app");
const fs = require('fs');
const path = require('path');
const pgClient = require("../services/PgClient");
const { Logger } = require("../utilities/Utils");
const UserModel = require('../models/UserModel');
const logger = Logger("slip-verify.test");
const getRandomTestSlip = () => {
    try {
        const testSlipFiles = fs.readdirSync(path.join(__dirname, 'test-data'))
            .filter(file => /\.(png|jpe?g)$/i.test(file));

        if (testSlipFiles.length === 0) {
            throw new Error('No valid test slip files found');
        }

        const randomIndex = Math.floor(Math.random() * testSlipFiles.length);
        return testSlipFiles[randomIndex];
    } catch (error) {
        logger.error(`Error getting random test slip: ${error.message}`);
        throw error;
    }
};
const testSlipFileName = getRandomTestSlip();
const testSlipImage = fs.readFileSync(path.join(__dirname, 'test-data', testSlipFileName));


// Mock user for authentication
const mockUser = {
    national_id: '1234567890123',
    username: 'test_user',
    email: 'V2yF3@example.com',
    password: 'testPassword123',
}

const verifySlipTestCases = [
    {
        testName: "success with file upload",
        method: "POST",
        file: {
            fieldname: 'imageFile',
            buffer: Buffer.from(testSlipImage),
            originalname: 'test-slip.jpg',
        },
        expectedStatus: 200,
        expectedMessage: "EasySlip service is currently unavailable, mock data response is returned"
    },
    {
        testName: "invalid file type",
        method: "POST",
        file: {
            fieldname: 'imageFile',
            buffer: Buffer.from('mockImageData'),
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
        await pgClient.init();
        logger.debug(`Database connected: ${pgClient.isConnected()}`);

        await pgClient.truncateTables();
        logger.debug(`All rows deleted from all tables in test database`);

        const userModel = new UserModel();
        await userModel.createUser(mockUser);
        logger.info("User registered");

        // Login with mobile platform
        const loginResponse = await request(app)
            .post('/api/v0.2/login?platform=mobile')
            .send({ email: mockUser.email, password: mockUser.password });

        logger.debug(`Login response: ${JSON.stringify(loginResponse.body, null, 2)}`);
        // accessToken = response.headers['set-cookie'].find(cookie => cookie.includes('access_token'));
        accessToken = loginResponse.body.data.tokens.access_token;
        logger.debug(`Access token obtained: ${accessToken}`);
    });

    describe("POST and GET /api/v0.2/slip/verify", () => {
        verifySlipTestCases.forEach((testCase, index) => {
            it(`${index + 1}. ${testCase.testName}`, async () => {
                logger.info(`Test ${index + 1}. ${testCase.testName}`);

                let response;
                if (testCase.method === 'GET') {
                    response = await request(app)
                        .get("/api/v0.2/slip/verify")
                        // .set('Cookie', [accessToken])
                        .set('Authorization', `Bearer ${accessToken}`)
                        .query(testCase.query);
                } else {
                    let req = request(app)
                        .post("/api/v0.2/slip/verify")
                        // .set('Cookie', [accessToken])
                        .set('Authorization', `Bearer ${accessToken}`);

                    if (testCase.query) {
                        req = req.query(testCase.query);
                    }

                    if (testCase.file) {
                        req = req.attach('imageFile', testCase.file.buffer, testCase.file.originalname);
                    } else if (testCase.body) {
                        req = req.send(testCase.body);
                    }

                    response = await req;
                }

                expect(response.statusCode).toBe(testCase.expectedStatus);
                expect(response.body).toHaveProperty("status_code", testCase.expectedStatus);
                expect(response.body).toHaveProperty("message");
                expect(response.body.message).toMatch(testCase.expectedMessage);

                if (testCase.expectedStatus === 200) {
                    expect(response.body).toHaveProperty("data");
                }
            });
        });

        afterAll(async () => {
            jest.clearAllMocks();
        });
    });

    afterAll(async () => {
        await pgClient.release();
        logger.debug(`Database disconnected: ${!pgClient.isConnected()}`);
    });
});