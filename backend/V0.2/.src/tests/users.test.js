const request = require("supertest");
const app = require("../app");
const pgClient = require("../services/PgClient");
const { test: testConfig } = require("../configs/dbConfigs");
const { Logger, formatResponse } = require("../utilities/Utils");
const logger = Logger("users.test");

let accessToken;
const mockUser = {
  national_id: "0000000000099",
  username: "testuser",
  email: "test@example.com",
  password: "Password123!",
  confirm_password: "Password123!",
  date_of_birth: "1990-01-01"
};

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
      message: "Local auth national ID must be 13 digit characters",
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

const updateUserBody = [
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

const deleteUserBody = [
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

describe("Users Endpoints", () => {
  // Setup before all tests
  beforeAll(async () => {
    await pgClient.init();
    logger.debug(`Database connected: ${pgClient.isConnected()}`);

    // Register a test user
    await request(app)
      .post("/api/v0.2/users")
      .send(mockUser);

    // Login to get access token
    const loginResponse = await request(app)
      .post("/api/v0.2/login")
      .send({
        email: mockUser.email,
        password: mockUser.password
      });

    accessToken = loginResponse.headers['set-cookie']?.[0];
  });

  // Clean up after all tests
  afterAll(async () => {
    await pgClient.release();
    logger.debug(`Database disconnected: ${!pgClient.isConnected()}`);
  });

  describe("connection to api", () => {
    describe("GET /health", () => {
      it("should return 200 OK text", async () => {
        logger.info('connection test /health');
        const response = await request(app).get("/health").expect(200);

        expect(response.text).toEqual("OK");
      });
    });
    describe("GET /api", () => {
      it("should return 200 OK formatted message", async () => {
        logger.info('connection test /api');
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
        logger.info('connection test /api/v0.2/');
        const response = await request(app).get("/api/v0.2/");
        logger.debug(`response: ${JSON.stringify(response, null, 2)}`);
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
      test(`${i + 1}: ${user.testName}`, async () => {
        logger.info(`Running test ${i + 1}: ${user.testName}`);
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

  describe("PATCH /api/v0.2/users", () => {
    updateUserBody.forEach((testCase, i) => {
      test(`${i + 1}: ${testCase.testName}`, async () => {
        logger.info(`Running test ${i + 1}: ${testCase.testName}`);
        const response = await request(app)
          .patch("/api/v0.2/users")
          .set('Cookie', [accessToken])
          .send(testCase.body);

        expect(response.statusCode).toBe(testCase.expected.status);
        expect(response.body).toHaveProperty("message", testCase.expected.message);

        if (testCase.expected.data) {
          expect(response.body.data).toMatchObject(testCase.expected.data);
        }
      });
    });
  });

  describe("DELETE /api/v0.2/users", () => {
    deleteUserBody.forEach((testCase, i) => {
      test(`${i + 1}: ${testCase.testName}`, async () => {
        logger.info(`Running test ${i + 1}: ${testCase.testName}`);
        const response = await request(app)
          .delete("/api/v0.2/users")
          .set('Cookie', [accessToken])
          .send(testCase.body);

        expect(response.statusCode).toBe(testCase.expected.status);
        expect(response.body).toHaveProperty("message", testCase.expected.message);
      });
    });
  });

  afterAll(async () => {
    jest.clearAllMocks();
  });
});