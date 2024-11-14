const request = require("supertest");
const app = require("../app");
const pgClient = require("../services/PgClient");
const { test: testConfig } = require("../configs/dbConfigs");
const Utils = require("../utilities/Utils");
const { Logger, formatResponse } = Utils;
const logger = Logger("slip-verify.test");
// Mock JWT token
const mockToken = 'mockJWTtoken123';

const verifySlipTestCases = [
    {
        testName: "success with payload",
        method: "POST",
        query: { payload: "00020101021229370016A000000677010111011300668960066896007802TH53037646304" },
        expectedStatus: 200,
        expectedMessage: "EasySlip service is currently unavailable, mock data response is returned"
    },
    {
        testName: "success with file upload",
        method: "POST",
        file: {
            fieldname: 'imageFile',
            buffer: Buffer.from('mockImageData'),
            originalname: 'slip.jpg',
        },
        expectedStatus: 200,
        expectedMessage: "EasySlip service is currently unavailable, mock data response is returned"
    },
    {
        testName: "success with base64 image",
        method: "POST",
        body: { base64Image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==" },
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

beforeAll(async () => {
    await pgClient.init(); // Initialize PgClient
    logger.debug(`Database connected: ${pgClient.isConnected()}`);
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
                        .set('Authorization', `Bearer ${mockToken}`)
                        .query(testCase.query);
                } else {
                    const req = request(app)
                        .post("/api/v0.2/slip/verify")
                        .set('Authorization', `Bearer ${mockToken}`);

                    if (testCase.query) {
                        req.query(testCase.query);
                    }

                    if (testCase.file) {
                        req.attach('imageFile', testCase.file.buffer, testCase.file.originalname);
                    } else if (testCase.body) {
                        req.send(testCase.body);
                    }

                    response = await req;
                }

                expect(response.statusCode).toBe(testCase.expectedStatus);
                expect(response.body).toHaveProperty("status_code", testCase.expectedStatus);
                expect(response.body).toHaveProperty("message");
                expect(response.body.message).toMatch(testCase.expectedMessage);

                if (testCase.expectedStatus === 200) {
                    expect(response.body).toHaveProperty("data");
                    // Add more specific checks for the data structure if needed
                }
            });
        });
    });

    afterAll(async () => {
        jest.clearAllMocks();
    });
});
