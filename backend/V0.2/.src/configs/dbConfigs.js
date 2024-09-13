const { port, ssl, host } = require('pg/lib/defaults');

require('dotenv').config();

module.exports = {
    development: {
        user: process.env.POSTGRES_USER,
        host: process.env.POSTGRES_HOST,
        database: process.env.POSTGRES_NAME,
        password: String(process.env.POSTGRES_PASSWORD),
        port: process.env.POSTGRES_PORT,
        max: 20, // maximum number of connections in the pool connection
        idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
        connectionTimeoutMillis: 2000, // how long to wait for a connection to be established
    },
    test: {
        user: process.env.POSTGRES_USER,
        host: process.env.POSTGRES_HOST,
        database: process.env.POSTGRES_TEST_NAME,
        password: String(process.env.POSTGRES_PASSWORD),
        port: process.env.POSTGRES_PORT,
        max: 20, // maximum number of connections in the pool connection
        idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
        connectionTimeoutMillis: 2000, // how long to wait for a connection to be established
    },
    production: {
        user: process.env.POSTGRES_PROD_USER,
        host: process.env.POSTGRES_HOST,
        database: process.env.POSTGRES_PROD_NAME,
        password: String(process.env.POSTGRES_PROD_PASSWORD),
        port: process.env.POSTGRES_PORT,
        max: 20, // maximum number of connections in the pool connection
        idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
        connectionTimeoutMillis: 2000, // how long to wait for a connection to be established
    }
}