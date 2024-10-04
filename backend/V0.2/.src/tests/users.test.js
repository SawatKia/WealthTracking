const request = require("supertest");
const app = require("../app");
const pgClient = require("../services/PgClient");
const { test: testConfig } = require("../configs/dbConfigs");
const Utils = require("../utilities/Utils");
const PgClient = require("../services/PgClient");
const { Logger, formatResponse } = Utils;
const logger = Logger("users.test");

const newUserBody = [
  {
    testName: "id < 13",
    body: {
      national_id: "32109876543",
      username: "testuser",
      email: "testii@example.com",
      password: "Password123!",
      confirm_password: "Password123!",
      date_of_birth: "1990-01-01",
    },
    expected: {
      status: 400,
      message: "Invalid national ID",
    }
  },
  {
    testName: "id > 13",
    body: {
      national_id: "3210987654321567",
      username: "testuser",
      email: "testii@example.com",
      password: "Password123!",
      confirm_password: "Password123!",
      date_of_birth: "1990-01-01",
    },
    expected: {
      status: 400,
      message: "Invalid national ID",
    }
  },
  {
    testName: "missing national_id field",
    body: {
      username: "testuser",
      email: "testii@example.com",
      password: "Password123!",
      confirm_password: "Password123!",
      date_of_birth: "1990-01-01",
    },
    expected: {
      status: 400,
      message: "Missing required field: national_id",
    }
  },
  {
    testName: "missing username field",
    body: {
      national_id: "0000000000000",
      email: "testii@example.com",
      password: "Password123!",
      confirm_password: "Password123!",
      date_of_birth: "1990-01-01",
    },
    expected: {
      status: 400,
      message: "Missing required field: username",
    }
  }, // missing username field
  {
    testName: "missing email field",
    body: {
      national_id: "0000000000001",
      username: "testuser",
      password: "Password123!",
      confirm_password: "Password123!",
      date_of_birth: "1990-01-01",
    },
    expected: {
      status: 400,
      message: "Missing required field: email",
    }
  }, // missing email field
  {
    testName: "missing password field",
    body: {
      national_id: "0000000000002",
      username: "testuser",
      email: "testii@example.com",
      confirm_password: "Password123!",
      date_of_birth: "1990-01-01",
    },
    expected: {
      status: 400,
      message: "Missing required field: password",
    }
  }, // missing password field
  {
    testName: "missing confirm_password field",
    body: {
      national_id: "0000000000003",
      username: "testuser",
      email: "testii@example.com",
      password: "Password123!",
      date_of_birth: "1990-01-01",
    },
    expected: {
      status: 400,
      message: "Missing required field: confirm_password",
    }
  }, // missing confirm_password field
  {
    testName: "missing date_of_birth field",
    body: {
      national_id: "0000000000014",
      username: "testuser",
      email: "testii@example.com",
      password: "Password123!",
      confirm_password: "Password123!",
    },
    expected: {
      status: 400,
      message: "Missing required field: date_of_birth",
    }
  }, // missing date_of_birth field
  {
    testName: "missing all fields",
    body: {},
    expected: {
      status: 400,
      message: "Missing required field: national_id",
    }
  }, // missing all fields
  {
    testName: "empty national_id value",
    body: {
      national_id: "",
      username: "testuser",
      email: "testii@example.com",
      password: "Password123!",
      confirm_password: "Password123!",
      date_of_birth: "1990-01-01",
    },
    expected: {
      status: 400,
      message: "Missing required field: national_id",
    }
  }, // empty national_id value
  {
    testName: "empty username value",
    body: {
      national_id: "0000000000004",
      username: "",
      email: "testii@example.com",
      password: "Password123!",
      confirm_password: "Password123!",
      date_of_birth: "1990-01-01",
    },
    expected: {
      status: 400,
      message: "Missing required field: username",
    }
  }, // empty username value
  {
    testName: "empty email value",
    body: {
      national_id: "0000000000005",
      username: "testuser",
      email: "",
      password: "Password123!",
      confirm_password: "Password123!",
      date_of_birth: "1990-01-01",
    },
    expected: {
      status: 400,
      message: "Missing required field: email",
    }
  }, // empty email value
  {
    testName: "empty password value",
    body: {
      national_id: "0000000000006",
      username: "testuser",
      email: "testii@example.com",
      password: "",
      confirm_password: "Password123!",
      date_of_birth: "1990-01-01",
    },
    expected: {
      status: 400,
      message: "Missing required field: password",
    }
  }, // empty password value
  {
    testName: "empty confirm_password value",
    body: {
      national_id: "0000000000007",
      username: "testuser",
      email: "testii@example.com",
      password: "Password123!",
      confirm_password: "",
      date_of_birth: "1990-01-01",
    },
    expected: {
      status: 400,
      message: "Missing required field: confirm_password",
    }
  }, // empty confirm_password value
  {
    testName: "empty date_of_birth value",
    body: {
      national_id: "0000000000015",
      username: "testuser",
      email: "testii@example.com",
      password: "Password123!",
      confirm_password: "Password123!",
      date_of_birth: "",
    },
    expected: {
      status: 400,
      message: "Missing required field: date_of_birth",
    }
  }, // empty date_of_birth value
  {
    testName: "all field empty",
    body: {
      national_id: "",
      username: "",
      email: "",
      password: "",
      confirm_password: "",
      date_of_birth: "",
    },
    expected: {
      status: 400,
      message: "Missing required field: national_id",
    }
  }, // all field empty
  {
    testName: "invalid national_id",
    body: {
      national_id: "esdrfy786",
      username: "testuser",
      email: "testii@example.com",
      password: "Password123!",
      confirm_password: "Password123!",
      date_of_birth: "1990-01-01",
    },
    expected: {
      status: 400,
      message: "Invalid national ID",
    }
  }, // invalid national_id
  {
    testName: "invalid username",
    body: {
      national_id: "0000000000008",
      username: "testuser123<>?",
      email: "testii@example.com",
      password: "Password123!",
      confirm_password: "Password123!",
      date_of_birth: "1990-01-01",
    },
    expected: {
      status: 400,
      message: "Invalid username",
    }
  }, // invalid username
  {
    testName: "invalid email",
    body: {
      national_id: "0000000000009",
      username: "testuser",
      email: "testii@example.com123",
      password: "Password123!",
      confirm_password: "Password123!",
      date_of_birth: "1990-01-01",
    },
    expected: {
      status: 400,
      message: "Invalid email address",
    }
  }, // invalid email
  {
    testName: "invalid password < 8",
    body: {
      national_id: "0000000000010",
      username: "testuser",
      email: "testii@example.com",
      password: "12345",
      confirm_password: "12345",
      date_of_birth: "1990-01-01",
    },
    expected: {
      status: 400,
      message: "Password must be at least 8 characters long",
    }
  }, // invalid password < 8
  {
    testName: "mis match confirm_password",
    body: {
      national_id: "0000000000011",
      username: "testuser",
      email: "testii@example.com",
      password: "Password123!",
      confirm_password: "Password123!123",
      date_of_birth: "1990-01-01",
    },
    expected: {
      status: 400,
      message: "Passwords do not match",
    }
  }, // mis match confirm_password
  {
    testName: "invalid date_of_birth format",
    body: {
      national_id: "0000000000016",
      username: "testuser",
      email: "testii@example.com",
      password: "Password123!",
      confirm_password: "Password123!",
      date_of_birth: "not-a-date",
    },
    expected: {
      status: 400,
      message: "Invalid date of birth",
    }
  }, // invalid date_of_birth format
  {
    testName: "success",
    body: {
      national_id: "0000000000017",
      username: "testuser",
      email: "testii@example.com",
      password: "Password123!",
      confirm_password: "Password123!",
      date_of_birth: "1990-01-01",
    },
    expected: {
      status: 201,
      message: "User created successfully",
      data: {
        national_id: "0000000000017",
        email: "testii@example.com",
        date_of_birth: "1990-01-01",
      }
    }
  }, // success with date_of_birth 
  {
    testName: "email already exists",
    body: {
      national_id: "0000000000013",
      username: "testuser",
      email: "testii@example.com",
      password: "Password123!",
      confirm_password: "Password123!",
      date_of_birth: "1990-01-01",
    },
    expected: {
      status: 409,
      message: "national_id or email are already taken",
    }
  },
  {
    testName: "national_id already exists",
    body: {
      national_id: "0000000000017",
      username: "testuser",
      email: "test2@example.com",
      password: "Password123!",
      confirm_password: "Password123!",
      date_of_birth: "1990-01-01",
    },
    expected: {
      status: 409,
      message: "national_id or email are already taken",
    }
  },
];

const checkPassBody = [
  {
    testName: "missing password field",
    body: { email: "testii@example.com" },
    expected: {
      status: 400,
      message: "Missing required field: password",
    }
  }, // missing password field
  {
    testName: "missing email field",
    body: { password: "Password123!" },
    expected: {
      status: 400,
      message: "Missing required field: email",
    }
  }, // missing email field
  {
    testName: "missing email value",
    body: { email: "", password: "Password123!" },
    expected: {
      status: 400,
      message: "Missing required field: email",
    }
  }, // missing email value
  {
    testName: "missing password value",
    body: { email: "testii@example.com", password: "" },
    expected: {
      status: 400,
      message: "Missing required field: password",
    }
  }, // missing password value
  {
    testName: "incorrect password",
    body: { email: "testii@example.com", password: "Password123!123" },
    expected: {
      status: 401,
      message: "Invalid email or password",
    }
  }, // incorrect password
  {
    testName: "success",
    body: { email: "testii@example.com", password: "Password123!" },
    expected: {
      status: 200,
      message: "Password check successful",
      data: true,
    }
  }, //success
  {
    testName: "missing both value",
    body: { email: "", password: "" },
    expected: {
      status: 400,
      message: "Missing required field: email",
    }
  }, // missing both value
  {
    testName: "invalid email",
    body: { email: "testii@example.com123", password: "Password123!" },
    expected: {
      status: 400,
      message: "Invalid email",
    }
  }, // invalid email
];

beforeAll(async () => {
  await pgClient.init();
  logger.debug(`Database connected: ${pgClient.isConnected()}`);
});

afterAll(async () => {
  // Clean up the database after all tests
  logger.info("Dropping tables");

  await Promise.all([
    pgClient
      .query("DELETE FROM transaction_bank_account_relations;")
      .then(() =>
        logger.info("DELETE all rows from table: transaction_bank_account_relations")
      ),
    pgClient
      .query("DELETE FROM transactions;")
      .then(() => logger.info("DELETE all rows from table: transactions")),
    pgClient
      .query("DELETE FROM debts;")
      .then(() => logger.info("DELETE all rows from table: debts")),
    pgClient
      .query("DELETE FROM bank_accounts;")
      .then(() => logger.info("DELETE all rows from table: bank_accounts")),
    pgClient
      .query("DELETE FROM financial_institutions;")
      .then(() => logger.info("DELETE all rows from table: financial_institutions")),
    pgClient
      .query("DELETE FROM users;")
      .then(() => logger.info("DELETE all rows from table: users")),
    pgClient
      .query("DELETE FROM api_request_limits;")
      .then(() => logger.info("DELETE all rows from table: api_request_limits")),
  ]);

  await pgClient.release();
  logger.debug(`Database disconnected: ${pgClient.isConnected()}`);
});

describe("Users Endpoints", () => {
  describe("connection to api", () => {
    describe("GET /health", () => {
      it("should return 200 OK text", async () => {
        const response = await request(app).get("/health").expect(200);

        expect(response.text).toEqual("OK");
      });
    });
    describe("GET /api", () => {
      it("should return 200 OK formatted message", async () => {
        const response = await request(app).get("/api").expect(200);

        expect(response.headers["content-type"]).toEqual(
          expect.stringContaining("json")
        );
        expect(response.body).toHaveProperty("status_code", 200);
        expect(response.body).toHaveProperty("message");
        expect(response.body.message).toMatch(
          /^you are connected to the \/api, running in Environment: .+/
        );
      });
    });
    describe("GET /api/v0.2/", () => {
      it("should return 200 OK formatted message", async () => {
        const response = await request(app).get("/api/v0.2/");

        expect(response.statusCode).toBe(200);
        expect(response.headers["content-type"]).toEqual(
          expect.stringContaining("json")
        );
        expect(response.body).toHaveProperty("status_code", 200);
        expect(response.body).toHaveProperty(
          "message",
          "you are connected to the /api/v0.2/"
        );
      });
    });
  });

  describe("POST /api/v0.2/users", () => {
    newUserBody.forEach((user, i) => {
      it(`${i + 1}. ${user.testName}`, async () => {
        logger.info(`Test ${i + 1}. ${user.testName}`);
        const response = await request(app)
          .post("/api/v0.2/users")
          .send(user.body);

        expect(response.statusCode).toBe(user.expected.status);
        expect(response.body).toHaveProperty("status_code", user.expected.status);
        expect(response.body).toHaveProperty("message", user.expected.message);

        if (user.expected.data) {
          expect(response.body).toHaveProperty("data");
          // for (const [key, value] of Object.entries(user.expected.data)) {
          // expect(response.body.data).toHaveProperty(key, value);
          // }
        }
      });
    });
  });

  describe("POST /api/v0.2/users/check", () => {
    checkPassBody.forEach((check, i) => {
      it(`${i + 1}. ${check.testName}`, async () => {
        logger.info(`Test ${i + 1}. ${check.testName}`);
        const response = await request(app)
          .post("/api/v0.2/users/check")
          .send(check.body);

        expect(response.statusCode).toBe(check.expected.status);
        expect(response.body).toHaveProperty("status_code", check.expected.status);
        expect(response.body).toHaveProperty("message", check.expected.message);

        if (check.expected.data !== undefined) {
          expect(response.body).toHaveProperty("data", check.expected.data);
        }
      });
    });
  });

  afterAll(async () => {
    jest.clearAllMocks();
  });
});