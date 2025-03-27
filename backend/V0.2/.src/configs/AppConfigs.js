// AppConfig.js
const path = require('path');
require('dotenv').config();
if (typeof dotenv === 'undefined') {
    const dotenv = require('dotenv');
    // Load main environment variables
    dotenv.config({ path: path.join(__dirname, '../../../../.env') });
}

// Cache env values at the top
const NODE_ENV = process.env.NODE_ENV;
const DB_RESET = process.env.DB_RESET === 'true';
const RELOAD_MOCK_DATA = process.env.RELOAD_MOCK_DATA === 'true';

const config = {
    environment: NODE_ENV || 'development',
    appHost: String(process.env.APP_HOST) || 'localhost',
    appPort: process.env.APP_PORT || 3000,
    saltRounds: parseInt(process.env.SALT_ROUNDS, 10) || 10,
    postgres: {
        user: process.env.POSTGRES_USER || 'user',
        host: process.env.POSTGRES_HOST || 'postgres', // service name in docker-compose
        password: process.env.POSTGRES_PASSWORD || 'password',
        port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
        databaseName: {
            test: process.env.POSTGRES_TEST_DB_NAME || 'test_database_name',
            development: process.env.POSTGRES_DB || 'app_database_name',
            production: process.env.POSTGRES_DB || 'production_database_name',
        },
    },
    pgAdmin: {
        email: process.env.PGADMIN_DEFAULT_EMAIL || 'pgadmin@example.com',
        password: process.env.PGADMIN_DEFAULT_PASSWORD || '1234567890',
    },
    redis: {
        host: process.env.REDIS_HOST || 'redis', // service name in docker-compose
        port: process.env.REDIS_PORT || 6379,
    },
    easySlip: {
        url: process.env.EASYSLIP_URL,
        key: process.env.EASYSLIP_KEY,
    },
    app_domain: process.env.APP_DOMAIN || 'WealthTrack',
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret',
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret',
    googleAuth: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI,
    },
    databaseReset: DB_RESET || NODE_ENV === 'test' || 'false',
    loadMockData: RELOAD_MOCK_DATA || 'false',
    gcp: {
        projectName: process.env.PROJECT_NAME,
        projectId: process.env.PROJECT_ID,
        projectNumber: process.env.PROJECT_NUMBER,
    },
    documentAi: {
        location: process.env.DOCUMENT_AI_LOCATION,
        processorId: process.env.DOCUMENT_AI_PROCESSOR_ID,
        pathToServiceAccount: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    },
    gemini: {
        key: process.env.GEMINI_KEY,
        models: {
            classification: process.env.GEMINI_CLASSIFICATION_MODEL || 'gemini-1.5-pro',
            ocrMapping: process.env.GEMINI_MAPPING_MODEL || 'gemini-2.0-flash-exp',
            common: process.env.GEMINI_COMMON_MODEL || 'gemini-1.5-flash-8b',
        },
    },
    googleSheet: {
        id: process.env.GOOGLE_SHEET_ID,
        pathToServiceAccount: process.env.GOOGLE_SHEET_APPLICATION_CREDENTIALS,
    }
};

module.exports = config;
