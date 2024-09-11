const request = require('supertest');
const app = require('../app');

describe('API Endpoints', () => {
    describe('GET /api/v0.2/', () => {
        it('should return 200 OK formatted message', async () => {
            const response = await request(app)
                .get('/api/v0.2/')
                .expect(200);

            expect(response.body).toHaveProperty('status_code', 200);
            expect(response.body).toHaveProperty('message', 'you are connected to the /api/v0.2');
        });
    });

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
                .expect('Content-Type', /json/)
                .expect(201);

            expect(response.body).toHaveProperty('status_code', 201);
            expect(response.body).toHaveProperty('message', 'User created successfully');
            expect(response.body.data).toHaveProperty('national_id', '1234567890123');
            expect(response.body.data).toHaveProperty('email', 'testi@example.com');
        });

        it('should return 400 Bad Request if required fields are missing', async () => {
            const response = await request(app)
                .post('/api/v0.2/users')
                .send({})  // Empty object to simulate missing fields
                .expect('Content-Type', /json/)
                .expect(400);

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
                .expect('Content-Type', /json/)
                .expect(409);

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
                .expect('Content-Type', /json/)
                .expect(400);

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
                .expect('Content-Type', /json/)
                .expect(200);

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
                .expect('Content-Type', /json/)
                .expect(401);

            expect(response.body).toHaveProperty('status_code', 401);
            expect(response.body).toHaveProperty('message', 'Invalid email or password');
        });

        it('should return 400 Bad Request if required fields are missing', async () => {
            const response = await request(app)
                .post('/api/v0.2/users/check')
                .send({})  // Empty object to simulate missing fields
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body).toHaveProperty('status_code', 400);
            expect(response.body).toHaveProperty('message', 'Missing required field: email');
        });
    });

    afterAll(async () => {
        jest.clearAllTimers();
    });
});
