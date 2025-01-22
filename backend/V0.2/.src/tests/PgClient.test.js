const request = require('supertest');
const { app } = require('../app');
const { Logger } = require('../utilities/Utils');
const { getTestAccessToken } = require('./token-helper');

let accessToken = getTestAccessToken();

describe('Cascading Constraints Tests', () => {

    // beforeAll(async () => {
    //     await PgClient.init();

    //     const fi = new FiModel();
    //     await fi.initializeData();
    //     logger.info('Financial institution data initialized');
    // });

    // afterAll(async () => {
    //     await PgClient.release();
    //     logger.debug(`Database disconnected: ${!PgClient.isConnected()}`);
    // });

    test('delete user and should cascade delete related bank accounts and debts', async () => {
        logger.info('running test: delete user and should cascade delete related bank accounts and debts');
        // Create a bank account for the user
        const bankAccountResponse = await request(app)
            .post('/api/v0.2/banks')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                account_number: '1234567890',
                fi_code: '004',
                display_name: 'Test Account',
                account_name: 'Test User Account',
                balance: 1000.00,
            });

        expect(bankAccountResponse.status).toBe(201);

        // Create a debt for the user
        const debtResponse = await request(app)
            .post('/api/v0.2/debts')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                fi_code: '004',
                debt_name: 'Test Debt',
                start_date: '2024-01-01',
                current_installment: 1,
                total_installments: 12,
                loan_principle: 1000.00,
                loan_balance: 1000.00,
            });

        expect(debtResponse.status).toBe(201);

        // Create a transaction for testing triggers
        const transactionResponse = await request(app)
            .post('/api/v0.2/transactions')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                transaction_datetime: new Date(),
                category: 'debt_payment',
                type: 'expense',
                amount: 100.00,
                note: 'Test debt payment',
                debt_id: debtResponse.body.data.debt_id,
                sender_account_number: '1234567890',
                sender_fi_code: '004'
            });

        expect(transactionResponse.status).toBe(201);

        // Verify debt balance and installment were updated by trigger
        const updatedDebtResponse = await request(app)
            .get(`/api/v0.2/debts/${debtResponse.body.data.debt_id}`)
            .set('Authorization', `Bearer ${accessToken}`);

        expect(updatedDebtResponse.status).toBe(200);
        expect(updatedDebtResponse.body.data.loan_balance).toBe('900.00');
        expect(updatedDebtResponse.body.data.current_installment).toBe(2);

        // Delete the user
        const deleteUserResponse = await request(app)
            .delete('/api/v0.2/users')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                password: 'Password123!'
            });

        expect(deleteUserResponse.status).toBe(200);

        // Try to access deleted resources with the same token (should fail)
        const checkBankAccountResponse = await request(app)
            .get(`/api/v0.2/banks/${bankAccountResponse.body.data.account_number}/${bankAccountResponse.body.data.fi_code}`)
            .set('Authorization', `Bearer ${accessToken}`);

        expect(checkBankAccountResponse.status).toBe(404);

        const checkDebtResponse = await request(app)
            .get(`/api/v0.2/debts/${debtResponse.body.data.debt_id}`)
            .set('Authorization', `Bearer ${accessToken}`);

        expect(checkDebtResponse.status).toBe(404);

        const checkTransactionResponse = await request(app)
            .get(`/api/v0.2/transactions/${transactionResponse.body.data.transaction_id}`)
            .set('Authorization', `Bearer ${accessToken}`);

        expect(checkTransactionResponse.status).toBe(404);
    });

    //TODO - add test to trigger modifying the balance of bank account when transaction is created or modified or deleted
});
