// AppConfig.js
require('dotenv').config();

const config = {
    environment: process.env.NODE_ENV,
    appPort: process.env.APP_PORT || 3000,
    saltRounds: parseInt(process.env.SALT_ROUNDS, 10) || 10,
    postgres: {
        user: process.env.POSTGRES_USER || 'user',
        host: process.env.POSTGRES_HOST,
        password: process.env.POSTGRES_PASSWORD || 'password',
        port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
        databaseName: {
            test: process.env.POSTGRES_TEST_DB_NAME || 'test_database_name',
            development: process.env.POSTGRES_DB || 'app_database_name',
            production: process.env.POSTGRES_DB || 'production_database_name',
        },
    },
    pgAdmin: {
        email: process.env.PGADMIN_DEFAULT_EMAIL,
        password: process.env.PGADMIN_DEFAULT_PASSWORD,
    },
    redis: {
        host: process.env.REDIS_HOST || 'redis', // service name in docker-compose
        port: process.env.REDIS_PORT || 6379,
    },
    easySlip: {
        url: process.env.EASYSLIP_URL,
        key: process.env.EASYSLIP_KEY,
    },
    app_secret: process.env.APP_SECRET,
    app_domain: process.env.APP_DOMAIN,
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret',
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret',
    googleAuth: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI,
    },
    databaseReset: process.env.FORCE_DB_RESET || false,
    loadMockData: process.env.RELOAD_MOCK_DATA || false,
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
            primary: process.env.GEMINI_MODEL_PRIMARY,
            secondary: process.env.GEMINI_MODEL_SECOND,
            tertiary: process.env.GEMINI_MODEL_THIRD,
        },
    },
};

module.exports = config;
