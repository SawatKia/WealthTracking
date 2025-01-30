const request = require('supertest');
const { app } = require('../app');

describe('Timeout Tests', () => {
    it('should timeout after 5 seconds', async () => {
        const response = await request(app)
            .get('/api/test-timeout')
            .timeout(4000); // wait response for 4 seconds

        expect(response.status).toBe(408);
        expect(response.body).toEqual({
            status: "error",
            message: "Request timeout"
        });
    });
}); 