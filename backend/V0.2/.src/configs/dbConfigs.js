const appConfigs = require('./AppConfigs');

module.exports = {
    development: {
        user: appConfigs.postgres.user,
        host: appConfigs.postgres.host,
        database: appConfigs.postgres.databaseName,
        password: String(appConfigs.postgres.password),
        port: appConfigs.postgres.port,
        max: 20, // maximum number of connections in the pool connection
        idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
        connectionTimeoutMillis: 3000, // how long to wait for a connection to be established
    },
    test: {
        user: appConfigs.postgres.user || 'your_postgres_user',
        host: 'localhost',
        database: appConfigs.postgres.databaseName || 'test_database_name',
        password: appConfigs.postgres.password || 'your_postgres_password',
        port: appConfigs.postgres.port || 5432,
        max: 20, // maximum number of connections in the pool connection
        idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
        connectionTimeoutMillis: 3000, // how long to wait for a connection to be established
    },
    production: {
        user: appConfigs.postgres.user,  // You can add specific production settings if different from dev/test
        host: appConfigs.postgres.host,
        database: appConfigs.postgres.databaseName,
        password: String(appConfigs.postgres.password),
        port: appConfigs.postgres.port,
        max: 20, // maximum number of connections in the pool connection
        idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
        connectionTimeoutMillis: 3000, // how long to wait for a connection to be established
    }
};
