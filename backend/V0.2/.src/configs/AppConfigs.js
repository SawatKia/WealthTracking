// AppConfig.js
require('dotenv').config();

const config = {
    environment: process.env.NODE_ENV,
    appPort: process.env.APP_PORT || 3000,
    saltRounds: parseInt(process.env.SALT_ROUNDS, 10) || 10,
    postgres: {
        user: process.env.POSTGRES_USER,
        host: process.env.POSTGRES_HOST,
        password: process.env.POSTGRES_PASSWORD,
        port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
        databaseName: process.env.NODE_ENV === 'test' ? process.env.POSTGRES_TEST_NAME : process.env.POSTGRES_NAME,
    },
    pgAdmin: {
        email: process.env.PGADMIN_DEFAULT_EMAIL,
        password: process.env.PGADMIN_DEFAULT_PASSWORD,
    },
    easySlip: {
        url: process.env.EASYSLIP_URL,
        key: process.env.EASYSLIP_KEY,
    }
};

module.exports = config;
