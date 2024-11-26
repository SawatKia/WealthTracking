const request = require("supertest");
const app = require("../app");
const fs = require('fs');
const path = require('path');
const pgClient = require("../services/PgClient");
const { test: testConfig } = require("../configs/dbConfigs");
const { Logger, formatResponse } = require("../utilities/Utils");
const UserModel = require('../models/UserModel');
const logger = Logger("slip-verify.test");

// Read test image files
const testSlipImage = fs.readFileSync(path.join(__dirname, 'test-data', '1691661663156.png'));
const testSlipBase64 = fs.readFileSync(path.join(__dirname, 'test-data', 'Image_1cf24f02-544e-4804-bd24-0d9f3d6d2ac7.jpeg'), 'base64');

// Mock JWT token
const mockUser = {
    national_id: '1234567890123',
    username: 'test_user',
    email: 'V2yF3@example.com',
    password: 'testPassword123',
}

const verifySlipTestCases = [
    {
        testName: "success with payload",
        method: "POST",
        query: { payload: "00020101021229370016A000000677010111011300668960066896007802TH123456789012" },
        expectedStatus: 200,
        expectedMessage: "EasySlip service is currently unavailable, mock data response is returned"
    },
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
        testName: "success with base64 image",
        method: "POST",
        body: {
            base64Image: `data:image/jpeg;base64,${testSlipBase64}`
        },
        expectedStatus: 200,
        expectedMessage: "EasySlip service is currently unavailable, mock data response is returned"
    },
    {
        testName: "invalid payload",
        method: "POST",
        query: { payload: "invalidpayload" },
        expectedStatus: 400,
        expectedMessage: "The provided payload format is invalid.",
    },
    {
        testName: "invalid base64 image",
        method: "POST",
        body: { base64Image: "invalid base64" },
        expectedStatus: 400,
        expectedMessage: "The provided base64 image format is invalid.",
    },
    {
        testName: "invalid file type",
        method: "POST",
        file: {
            fieldname: 'imageFile',
            buffer: Buffer.from('mockImageData'),
            originalname: 'invalid.txt', // Invalid file type
        },
        expectedStatus: 400,
        expectedMessage: "The uploaded file is invalid or exceeds the size limit.",
    },
    {
        testName: "missing input",
        method: "POST",
        file: {},
        expectedStatus: 400,
        expectedMessage: "At least one of the following is required: payload, file, or base64 image."
    }
];
let accessToken;
beforeAll(async () => {
    await pgClient.init(); // Initialize PgClient
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

afterAll(async () => {
    await pgClient.release(); // Release the PgClient
    logger.debug(`Database disconnected: ${!pgClient.isConnected()}`);
});

describe("Slip Verification API Endpoint", () => {
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
    });

    afterAll(async () => {
        jest.clearAllMocks();
    });
});
