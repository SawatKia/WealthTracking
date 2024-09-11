const request = require('supertest');
const app = require('../app');

const { test } = require('../configs/dbConfigs');
const PgClient = require('../models/PgClient');

const db = new PgClient(test);

beforeAll(async () => {
    await db.init();

    // Create tables if they don't exist
    await db.query(`
        CREATE TABLE IF NOT EXISTS users (
            national_id CHAR(13) PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            username VARCHAR(50) NOT NULL,
            hashed_password VARCHAR(255) NOT NULL,
            role VARCHAR(20) NOT NULL,
            member_since TIMESTAMP NOT NULL,
            CONSTRAINT check_national_id_length CHECK (LENGTH(national_id) = 13)
        );

        CREATE TABLE IF NOT EXISTS financial_institutions (
            fi_code VARCHAR(20) PRIMARY KEY,
            name_th VARCHAR(255) NOT NULL,
            name_en VARCHAR(255) NOT NULL
        );

        CREATE TABLE IF NOT EXISTS bank_accounts (
            account_number VARCHAR(20) NOT NULL,
            fi_code VARCHAR(20) NOT NULL,
            national_id CHAR(13) NOT NULL,
            display_name VARCHAR(100) NOT NULL,
            account_name VARCHAR(100) NOT NULL,
            balance DECIMAL(15, 2) NOT NULL,
            PRIMARY KEY (account_number, fi_code),
            FOREIGN KEY (national_id) REFERENCES users(national_id),
            FOREIGN KEY (fi_code) REFERENCES financial_institutions(fi_code) 
                ON UPDATE CASCADE ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS debts (
            debt_number VARCHAR(50) NOT NULL,
            fi_code VARCHAR(20) NOT NULL,
            national_id CHAR(13) NOT NULL,
            debt_name VARCHAR(100) NOT NULL,
            start_date DATE NOT NULL,
            current_installment INT NOT NULL,
            total_installments INT NOT NULL,
            loan_principle DECIMAL(15, 2) NOT NULL,
            loan_balance DECIMAL(15, 2) NOT NULL,
            PRIMARY KEY (debt_number, fi_code),
            FOREIGN KEY (national_id) REFERENCES users(national_id),
            FOREIGN KEY (fi_code) REFERENCES financial_institutions(fi_code) 
                ON UPDATE CASCADE ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS transactions (
            transaction_id SERIAL PRIMARY KEY,
            transaction_datetime TIMESTAMP NOT NULL,
            category VARCHAR(50) NOT NULL,
            type VARCHAR(20) NOT NULL,
            amount DECIMAL(15, 2) NOT NULL,
            note TEXT,
            national_id CHAR(13) NOT NULL,
            debt_number VARCHAR(50),
            fi_code VARCHAR(20),
            FOREIGN KEY (national_id) REFERENCES users(national_id),
            FOREIGN KEY (debt_number, fi_code) REFERENCES debts(debt_number, fi_code) 
                ON UPDATE CASCADE ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS transaction_bank_account_relations (
            transaction_id INT NOT NULL,
            account_number VARCHAR(20) NOT NULL,
            fi_code VARCHAR(20) NOT NULL,
            role VARCHAR(20) NOT NULL,
            PRIMARY KEY (account_number, fi_code, transaction_id),
            FOREIGN KEY (account_number, fi_code) REFERENCES bank_accounts(account_number, fi_code) 
                ON UPDATE CASCADE ON DELETE CASCADE,
            FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id) 
                ON UPDATE CASCADE ON DELETE SET NULL
        );
    `);
});

afterAll(async () => {
    // Cleanup the database after tests by deleting all rows from all tables
    const tables = ["users", "financial_institutions", "bank_accounts", "debts", "transactions", "transaction_bank_account_relations"];
    for (const table of tables) {
        await db.query(`DELETE FROM ${table};`);
    }
    await db.release();
});

describe('API Endpoints', () => {
    describe('GET /api/v0.2/', () => {
        it('should return 200 OK formatted message', async () => {
            const response = await request(app)
                .get('/api/v0.2/')
                .expect(200);

            expect(response.statusCode).toBe(200)
            expect(response.headers['content-type']).toEqual(expect.stringContaining("json"))
            expect(response.body).toHaveProperty('status_code', 200);
            expect(response.body).toHaveProperty('message', 'you are connected to the /api/v0.2');
        });
    });

    //TODO - test several format of input by using array of objects instead of create seperate test case
    const newUserBody = [
        {
            "national_id": "32109876543",
            "username": "testuser",
            "email": "testii@example.com",
            "password": "Password123!",
            "confirm_password": "Password123!"
        },// id < 13
        {
            "national_id": "3210987654321567",
            "username": "testuser",
            "email": "testii@example.com",
            "password": "Password123!",
            "confirm_password": "Password123!"
        },// id > 13
        {
            "username": "testuser",
            "email": "testii@example.com",
            "password": "Password123!",
            "confirm_password": "Password123!"
        },// missing national_id fleld
        {
            "national_id": "3210987654321",
            "email": "testii@example.com",
            "password": "Password123!",
            "confirm_password": "Password123!"
        },// missing username field
        {
            "national_id": "3210987654321",
            "username": "testuser",
            "password": "Password123!",
            "confirm_password": "Password123!"
        },// missing email field
        {
            "national_id": "3210987654321",
            "username": "testuser",
            "email": "testii@example.com",
            "confirm_password": "Password123!"
        },// missing password field
        {
            "national_id": "3210987654321",
            "username": "testuser",
            "email": "testii@example.com",
            "password": "Password123!",
        },// missing confirm_password field
        {
            "national_id": "",
            "username": "testuser",
            "email": "testii@example.com",
            "password": "Password123!",
            "confirm_password": "Password123!",
        },// missing national_id value
        {
            "national_id": "3210987654321",
            "username": "",
            "email": "testii@example.com",
            "password": "Password123!",
            "confirm_password": "Password123!"
        },// missing username value
        {
            "national_id": "3210987654321",
            "username": "testuser",
            "email": "",
            "password": "Password123!",
            "confirm_password": "Password123!"
        },// missing email value
        {
            "national_id": "3210987654321",
            "username": "testuser",
            "email": "testii@example.com",
            "password": "",
            "confirm_password": "Password123!"
        },// missing password value
        {
            "national_id": "3210987654321",
            "username": "testuser",
            "email": "testii@example.com",
            "password": "Password123!",
            "confirm_password": ""
        },// missing confirm_password value
        {},// missing all fields
        {
            "national_id": "esdrfy786",
            "username": "testuser",
            "email": "testii@example.com",
            "password": "Password123!",
            "confirm_password": "Password123!"
        },// invalid national_id
        {
            "national_id": "3210987654321",
            "username": "testuser123<>?",
            "email": "testii@example.com",
            "password": "Password123!",
            "confirm_password": "Password123!"
        },// invalid username
        {
            "national_id": "3210987654321",
            "username": "testuser",
            "email": "testii@example.com123",
            "password": "Password123!",
            "confirm_password": "Password123!"
        },// invalid email
        {
            "national_id": "3210987654321",
            "username": "testuser",
            "email": "testii@example.com",
            "password": "Password123!",
            "confirm_password": "Password123!123"
        },// mis match confirm_password
        {
            "national_id": "3210987654321",
            "username": "testuser",
            "email": "testii@example.com",
            "password": "Password123!",
            "confirm_password": "Password123!"
        },//success
        {
            "national_id": "3210987654321",
            "username": "testuser",
            "email": "testii@example.com",
            "password": "Password123!",
            "confirm_password": "Password123!"
        }//duplicate key value
    ];
    const checkPassBody = [
        { email: "testii@example.com" },// missing password field
        { password: "Password123!" },// missing email field
        { email: "", password: "Password123!" },// missing email value
        { email: "testii@example.com", password: "" },// missing password value
        { email: "testii@example.com", password: "Password123!123" },// incorrect password
        { email: "testii@example.com", password: "Password123!" },//success
        { email: "", password: "" },// missing both value
        {}, // missing all fields
        { email: "testii@example.com123", password: "Password123!" },// invalid email
    ];
    describe('POST /api/v0.2/users', () => {
        it('should create a user and return 201 Created', async () => {
            const newUser = {
                "national_id": "3210987654321",
                "username": "testuser",
                "email": "testii@example.com",
                "password": "Password123!",
                "confirm_password": "Password123!"
            };

            const response = await request(app)
                .post('/api/v0.2/users')
                .send(newUser)
                .expect(201);

            expect(response.statusCode).toBe(201)
            expect(response.headers['content-type']).toEqual(expect.stringContaining("json"))
            expect(response.body).toHaveProperty('status_code', 201);
            expect(response.body).toHaveProperty('message', 'User created successfully');
            expect(response.body.data).toHaveProperty('national_id', '3210987654321');
            expect(response.body.data).toHaveProperty('email', 'testii@example.com');
        });

        it('should return 400 Bad Request if required fields are missing', async () => {
            const response = await request(app)
                .post('/api/v0.2/users')
                .send({})  // Empty object to simulate missing fields
                .expect(400);

            expect(response.statusCode).toBe(400)
            expect(response.headers['content-type']).toEqual(expect.stringContaining("json"))
            expect(response.body).toHaveProperty('status_code', 400);
            expect(response.body).toHaveProperty('message', 'Missing required field: national_id');
        });

        it('should return 409 Conflict if national_id already exists', async () => {
            const response = await request(app)
                .post('/api/v0.2/users')
                .send({
                    "national_id": "1234567890123",  // Simulating existing national_id
                    "username": "newuser",
                    "email": "existingemail@example.com",
                    "password": "ValidPass123!",
                    "confirm_password": "ValidPass123!"
                })
                .expect(409);

            expect(response.statusCode).toBe(409);
            expect(response.headers['content-type']).toEqual(expect.stringContaining("json"))
            expect(response.body).toHaveProperty('status_code', 409);
            expect(response.body).toHaveProperty('message', 'national_id or email are already taken');
        });

        it('should fail if password and confirm_password do not match', async () => {
            const response = await request(app)
                .post('/api/v0.2/users')
                .send({
                    "national_id": "1234567890123",
                    "username": "newuser",
                    "email": "newuser@example.com",
                    "password": "ValidPass123!",
                    "confirm_password": "DifferentPass123!"
                })
                .expect(400);

            expect(response.statusCode).toBe(400);
            expect(response.headers['content-type']).toEqual(expect.stringContaining("json"))
            expect(response.body).toHaveProperty('status_code', 400);
            expect(response.body).toHaveProperty('message', 'Passwords do not match');
        });
    });

    describe('POST /api/v0.2/users/check', () => {
        it('should return 200 OK for a valid password check', async () => {
            const checkData = {
                "email": "johndoe@example.com",
                "password": "Password123!"
            };

            const response = await request(app)
                .post('/api/v0.2/users/check')
                .send(checkData)
                .expect(200);

            expect(response.statusCode).toBe(200);
            expect(response.headers['content-type']).toEqual(expect.stringContaining("json"))
            expect(response.body).toHaveProperty('status_code', 200);
            expect(response.body).toHaveProperty('message', 'Password check successful');
            expect(response.body.data).toBe(true);
        });

        it('should return 401 Unauthorized if password is incorrect', async () => {
            const response = await request(app)
                .post('/api/v0.2/users/check')
                .send({
                    "email": "johndoe@example.com",
                    "password": "WrongPassword123!"
                })
                .expect(401);

            expect(response.statusCode).toBe(401);
            expect(response.headers['content-type']).toEqual(expect.stringContaining("json"))
            expect(response.body).toHaveProperty('status_code', 401);
            expect(response.body).toHaveProperty('message', 'Invalid email or password');
        });

        it('should return 400 Bad Request if required fields are missing', async () => {
            const response = await request(app)
                .post('/api/v0.2/users/check')
                .send({})  // Empty object to simulate missing fields
                .expect(400);

            expect(response.statusCode).toBe(400);
            expect(response.headers['content-type']).toEqual(expect.stringContaining("json"))
            expect(response.body).toHaveProperty('status_code', 400);
            expect(response.body).toHaveProperty('message', 'Missing required field: email');
        });
    });

    afterAll(async () => {
        jest.clearAllTimers();
    });
});
