const request = require("supertest");
const app = require("../app");
const pgClient = require("../services/PgClient");
const { test: testConfig } = require("../configs/dbConfigs");
const Utils = require("../utilities/Utils");
const { Logger, formatResponse } = Utils;
const logger = Logger("slip-verify.test");

const verifySlipTestCases = [
    {
        testName: "success with payload",
        method: "GET",
        query: { payload: "00020101021229370016A000000677010111011300668960066896007802TH53037646304" },
        expectedStatus: 200,
        // expectedMessage: "Slip verification success by payload",
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
        // expectedMessage: "Slip verification success by file",
        expectedMessage: "EasySlip service is currently unavailable, mock data response is returned"
    },
    {
        testName: "success with base64 image",
        method: "POST",
        body: { base64Image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==" },
        expectedStatus: 200,
        // expectedMessage: "Slip verification success by base64",
        expectedMessage: "EasySlip service is currently unavailable, mock data response is returned"
    },
    {
        testName: "invalid payload",
        method: "GET",
        query: { payload: "invalidpayload" },
        expectedStatus: 400,
        expectedMessage: "Invalid payload format",
    },
    {
        testName: "missing input",
        method: "POST",
        file: {},
        expectedStatus: 400,
        expectedMessage: "Invalid input: Payload, file, or base64 image required",
    },
    {
        testName: "invalid base64 image",
        method: "POST",
        body: { base64Image: "invalid base64" },
        expectedStatus: 400,
        expectedMessage: "Invalid base64 image format",
    },
];

beforeAll(async () => {
    await pgClient.init();
    logger.debug(`Database connected: ${pgClient.isConnected()}`);

    // Create necessary tables (if not already created in your main setup)
    await pgClient.query(`
    CREATE TABLE IF NOT EXISTS api_request_limits (
      service_name VARCHAR(255) NOT NULL,
      request_date DATE NOT NULL,
      request_count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (service_name, request_date)
    );
  `);
    logger.debug(`Tables created: ${pgClient.isConnected()}`);
});

afterAll(async () => {
    // Clean up the database after all tests
    await pgClient.query("DROP TABLE IF EXISTS api_request_limits;");
    await pgClient.release();
    logger.debug(`Database disconnected: ${pgClient.isConnected()}`);
});

describe("Slip Verification API Endpoint", () => {
    describe("POST /slip/verify", () => {
        verifySlipTestCases.forEach((testCase, index) => {
            it(`${index + 1}. ${testCase.testName}`, async () => {
                logger.info(`Test ${index + 1}. ${testCase.testName}`);

                let response;
                if (testCase.method === 'GET') {
                    response = await request(app)
                        .get("/api/v0.2/slip/verify")
                        .query(testCase.query);
                } else {
                    const req = request(app).post("/api/v0.2/slip/verify");

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