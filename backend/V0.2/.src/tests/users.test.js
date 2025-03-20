const request = require("supertest");

const pgClient = require("../services/PgClient");
const FinancialInstitutionModel = require("../models/FinancialInstitutionModel");

const { app } = require("../app");
const { Logger } = require("../utilities/Utils");
const logger = Logger("users.test");

// Mock user for authentication
const mockUser = {
  national_id: "0000000000099",
  username: "testuser",
  email: "test@example.com",
  password: "Password123!",
  confirm_password: "Password123!",
  date_of_birth: "1990-01-01"
};

describe("Users Endpoints", () => {
  let accessToken;

  beforeAll(async () => {
    await pgClient.cleanup();
    await pgClient.init();
    logger.debug("initialized finished")
    logger.info(`Database connected: ${await pgClient.isConnected()}`);

    await pgClient.truncateTables();
    logger.info(`All rows deleted from tables`);

    const fiModel = new FinancialInstitutionModel();
    await fiModel.initializeData();
    logger.info("FI data initialized successfully");

    // Register initial test user
    await request(app)
      .post("/api/v0.2/users")
      .send(mockUser);

    // Login to get access token
    const loginResponse = await request(app)
      .post("/api/v0.2/login?platform=mobile")
      .send({
        email: mockUser.email,
        password: mockUser.password
      });

    accessToken = loginResponse.body.data.tokens.access_token;
    logger.debug(`Access token obtained: ${accessToken}`);
  }, 30000);

  describe("Create User Tests", () => {
    const createUserCases = [
      {
        testName: "successful user creation",
        body: {
          national_id: "0000000000017",
          username: "testuser2",
          email: "test2@example.com",
          password: "Password123!",
          confirm_password: "Password123!",
          date_of_birth: "1990-01-01"
        },
        expected: {
          status: 201,
          message: "User created successfully"
        }
      },
      {
        testName: "id < 13 digits",
        body: {
          national_id: "32109876543",
          username: "testuser",
          email: "testii@example.com",
          password: "Password123!",
          confirm_password: "Password123!",
          date_of_birth: "1990-01-01"
        },
        expected: {
          status: 400,
          message: "Local auth national ID must be 13 digit characters"
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
          message: "Local auth national ID must be 13 digit characters",
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
          message: "Local auth national ID must be 13 digit characters",
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
        testName: "email already exists",
        body: {
          national_id: "0000000000017",
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

    createUserCases.forEach((testCase, index) => {
      test(`${index + 1}: ${testCase.testName}`, async () => {
        logger.info(`Running create user test ${index + 1}: ${testCase.testName}`);

        const response = await request(app)
          .post("/api/v0.2/users")
          .send(testCase.body);

        expect(response.status).toBe(testCase.expected.status);
        expect(response.body.message).toBe(testCase.expected.message);

        if (testCase.expected.status === 201) {
          expect(response.body.data).toBeDefined();
        }
      });
    });
  });

  describe("Update User Tests", () => {
    const updateUserCases = [
      {
        testName: "missing password",
        body: {
          email: "newemail@example.com"
        },
        expected: {
          status: 400,
          message: "Missing required field: password"
        }
      },
      {
        testName: "incorrect current password",
        body: {
          password: "WrongPassword123!",
          email: "newemail@example.com"
        },
        expected: {
          status: 401,
          message: "Invalid email or password"
        }
      },
      {
        testName: "invalid new email format",
        body: {
          password: "Password123!",
          email: "invalid.email@com"
        },
        expected: {
          status: 400,
          message: "Invalid email"
        }
      },
      {
        testName: "empty update fields",
        body: {
          password: "Password123!",
          email: "",
          username: "",
          date_of_birth: ""
        },
        expected: {
          status: 400,
          message: "At least one field is required to update user information"
        }
      },
      {
        testName: "success update email",
        body: {
          password: "Password123!",
          email: "updated@example.com"
        },
        expected: {
          status: 200,
          message: "User updated successfully",
          data: {
            email: "updated@example.com"
          }
        }
      },
      {
        testName: "success update multiple fields",
        body: {
          password: "Password123!",
          username: "updateduser",
          date_of_birth: "1995-01-01"
        },
        expected: {
          status: 200,
          message: "User updated successfully",
          data: {
            username: "updateduser",
            date_of_birth: "1995-01-01"
          }
        }
      },
      {
        testName: "mismatched new passwords",
        body: {
          password: "Password123!",
          newPassword: "NewPassword123!",
          newConfirmPassword: "DifferentPassword123!"
        },
        expected: {
          status: 400,
          message: "newPassword and newConfirmPassword do not match"
        }
      },
      {
        testName: "change password",
        body: {
          password: "Password123!",
          newPassword: "NewPassword123!",
          newConfirmPassword: "NewPassword123!"
        },
        expected: {
          status: 200,
          message: "User updated successfully"
        }
      },
    ];

    updateUserCases.forEach((testCase, index) => {
      test(`${index + 1}: ${testCase.testName}`, async () => {
        logger.info(`Running update user test ${index + 1}: ${testCase.testName}`);

        const response = await request(app)
          .patch("/api/v0.2/users")
          .set("Authorization", `Bearer ${accessToken}`)
          .send(testCase.body);

        expect(response.status).toBe(testCase.expected.status);
        expect(response.body.message).toBe(testCase.expected.message);

        if (testCase.expected.data) {
          expect(response.body.data).toMatchObject(testCase.expected.data);
        }
      });
    });
  });

  describe("Delete User Tests", () => {
    const deleteUserCases = [
      {
        testName: "missing password",
        body: {},
        expected: {
          status: 400,
          message: "Missing required field: password"
        }
      },
      {
        testName: "incorrect password",
        body: {
          password: "WrongPassword123!"
        },
        expected: {
          status: 401,
          message: "Invalid email or password"
        }
      },
      {
        testName: "success delete",
        body: {
          password: "NewPassword123!"
        },
        expected: {
          status: 200,
          message: "User deleted successfully"
        }
      }
    ];

    deleteUserCases.forEach((testCase, index) => {
      test(`${index + 1}: ${testCase.testName}`, async () => {
        logger.info(`Running delete user test ${index + 1}: ${testCase.testName}`);

        const response = await request(app)
          .delete("/api/v0.2/users")
          .set("Authorization", `Bearer ${accessToken}`)
          .send(testCase.body);

        expect(response.status).toBe(testCase.expected.status);
        expect(response.body.message).toBe(testCase.expected.message);
      });
    });
  });

  afterAll(async () => {
    await pgClient.release();
    logger.debug(`Database disconnected: ${await !pgClient.isConnected()}`);
  });
});