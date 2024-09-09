const { port, ssl, host } = require('pg/lib/defaults');

require('dotenv').config();

module.exports = {
    development: {
        user: process.env.POSTGRES_USER,
        host: process.env.POSTGRES_HOST,
        database: process.env.POSTGRES_NAME,
        password: process.env.POSTGRES_PASSWORD,
        port: process.env.POSTGRES_PORT,
        max: 20, // maximum number of connections in the pool connection
        idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
        connectionTimeoutMillis: 2000, // how long to wait for a connection to be established
    },
    test: {
        database: process.env.POSTGRES_TEST_NAME,
        user: process.env.POSTGRES_TEST_USER,
        password: process.env.POSTGRES_TEST_PASSWORD,
        host: process.env.POSTGRES_TEST_HOST,
    },
    production: {
        database: process.env.POSTGRES_PROD_NAME,
        user: process.env.POSTGRES_PROD_USER,
        password: process.env.POSTGRES_PROD_PASSWORD,
        host: process.env.POSTGRES_PROD_HOST,
    }
}