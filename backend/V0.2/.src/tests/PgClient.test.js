const request = require('supertest');
const app = require('../app'); // Adjust the path to your Express app
const PgClient = require('../services/PgClient');

describe('Cascading Constraints Tests', () => {
    beforeAll(async () => {
        await PgClient.init(); // Initialize the PgClient
    }, 30000);

    afterAll(async () => {
        await PgClient.end(); // Clean up the database
    }, 30000);

    test('should delete user and cascade delete related bank accounts', async () => {
        // Create a user
        const userResponse = await request(app)
            .post('/users') // Adjust the endpoint to create a user
            .send({
                national_id: '1234567890123',
                email: 'test@example.com',
                username: 'testuser',
                hashed_password: 'hashedpassword',
                role: 'user',
                member_since: new Date(),
                date_of_birth: '1990-01-01',
            });

        expect(userResponse.status).toBe(201); // Expect user creation to succeed

        // Create a bank account for the user
        const bankAccountResponse = await request(app)
            //TODO - this endpoint doesn't exists
            .post('/bank-accounts') // Adjust the endpoint to create a bank account
            .send({
                account_number: '1234567890',
                fi_code: 'FI123',
                national_id: '1234567890123',
                display_name: 'Test Account',
                account_name: 'Test User Account',
                balance: 1000.00,
            });

        expect(bankAccountResponse.status).toBe(201); // Expect bank account creation to succeed

        // Delete the user
        const deleteUserResponse = await request(app)
            //TODO - this endpoint doesn't exists
            .delete(`/users/${userResponse.body.id}`); // Adjust the endpoint to delete a user

        expect(deleteUserResponse.status).toBe(204); // Expect user deletion to succeed

        // Check if the bank account was deleted
        const checkBankAccountResponse = await request(app)
            //TODO - this endpoint doesn't exists
            .get(`/bank-accounts/${bankAccountResponse.body.account_number}`); // Adjust the endpoint to get a bank account

        expect(checkBankAccountResponse.status).toBe(404); // Expect bank account to be deleted
    }, 30000);
}); 