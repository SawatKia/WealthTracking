const appConfigs = require('./AppConfigs');

module.exports = {
    development: {
        user: appConfigs.postgres.user,
        host: appConfigs.postgres.host,
        database: appConfigs.postgres.databaseName.development,
        password: String(appConfigs.postgres.password),
        port: appConfigs.postgres.port,
        max: 50, // maximum number of connections in the pool connection
        idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
        connectionTimeoutMillis: 10000, // how long to wait for a connection to be established
    },
    test: {
        user: appConfigs.postgres.user,
        host: appConfigs.environment === 'test' ? 'localhost' : appConfigs.postgres.host,
        database: appConfigs.postgres.databaseName.test,
        password: appConfigs.postgres.password,
        port: appConfigs.postgres.port,
        max: 20, // maximum number of connections in the pool connection
        idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
        connectionTimeoutMillis: 30000, // how long to wait for a connection to be established
    },
    production: {
        user: appConfigs.postgres.user,  // You can add specific production settings if different from dev/test
        host: appConfigs.postgres.host,
        database: appConfigs.postgres.databaseName.production,
        password: String(appConfigs.postgres.password),
        port: appConfigs.postgres.port,
        max: 20, // maximum number of connections in the pool connection
        idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
        connectionTimeoutMillis: 3000, // how long to wait for a connection to be established
    },
    // createTables: {
    //     users: `CREATE TABLE IF NOT EXISTS users (
    //               national_id CHAR(13) PRIMARY KEY,
    //               email VARCHAR(255) NOT NULL,
    //               username VARCHAR(50) NOT NULL,
    //               hashed_password VARCHAR(255) NOT NULL,
    //               role VARCHAR(20) NOT NULL,
    //               member_since TIMESTAMP NOT NULL,
    //               CONSTRAINT check_national_id_length CHECK (LENGTH(national_id) = 13)
    //           );`,
    //     financial_institutions: `CREATE TABLE IF NOT EXISTS financial_institutions (
    //               fi_code VARCHAR(20) PRIMARY KEY,
    //               name_th VARCHAR(255) NOT NULL,
    //               name_en VARCHAR(255) NOT NULL
    //           );`,
    //     bank_accounts: `CREATE TABLE IF NOT EXISTS bank_accounts (
    //               account_number VARCHAR(20) NOT NULL,
    //               fi_code VARCHAR(20) NOT NULL,
    //               national_id CHAR(13) NOT NULL,
    //               display_name VARCHAR(100) NOT NULL,
    //               account_name VARCHAR(100) NOT NULL,
    //               balance DECIMAL(15, 2) NOT NULL,
    //               PRIMARY KEY (account_number, fi_code),
    //               FOREIGN KEY (national_id) REFERENCES users(national_id),
    //               FOREIGN KEY (fi_code) REFERENCES financial_institutions(fi_code) ON UPDATE CASCADE ON DELETE CASCADE
    //           );`,
    //     debts: `CREATE TABLE IF NOT EXISTS debts (
    //               debt_number VARCHAR(50) NOT NULL,
    //               fi_code VARCHAR(20) NOT NULL,
    //               national_id CHAR(13) NOT NULL,
    //               debt_name VARCHAR(100) NOT NULL,
    //               start_date DATE NOT NULL,
    //               current_installment INT NOT NULL,
    //               total_installments INT NOT NULL,
    //               loan_principle DECIMAL(15, 2) NOT NULL,
    //               loan_balance DECIMAL(15, 2) NOT NULL,
    //               PRIMARY KEY (debt_number, fi_code),
    //               FOREIGN KEY (national_id) REFERENCES users(national_id),
    //               FOREIGN KEY (fi_code) REFERENCES financial_institutions(fi_code) ON UPDATE CASCADE ON DELETE CASCADE
    //           );`,
    //     transactions: `CREATE TABLE IF NOT EXISTS transactions (
    //               transaction_id SERIAL PRIMARY KEY,
    //               transaction_datetime TIMESTAMP NOT NULL,
    //               category VARCHAR(50) NOT NULL,
    //               type VARCHAR(20) NOT NULL,
    //               amount DECIMAL(15, 2) NOT NULL,
    //               note TEXT,
    //               national_id CHAR(13) NOT NULL,
    //               debt_number VARCHAR(50),
    //               fi_code VARCHAR(20),
    //               FOREIGN KEY (national_id) REFERENCES users(national_id),
    //               FOREIGN KEY (debt_number, fi_code) REFERENCES debts(debt_number, fi_code) ON UPDATE CASCADE ON DELETE CASCADE
    //           );`,
    //     transaction_bank_account_relations: `CREATE TABLE IF NOT EXISTS transaction_bank_account_relations (
    //               transaction_id INT NOT NULL,
    //               account_number VARCHAR(20) NOT NULL,
    //               fi_code VARCHAR(20) NOT NULL,
    //               role VARCHAR(20) NOT NULL,
    //               PRIMARY KEY (account_number, fi_code, transaction_id),
    //               FOREIGN KEY (account_number, fi_code) REFERENCES bank_accounts(account_number, fi_code) ON UPDATE CASCADE ON DELETE CASCADE,
    //               FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id) ON UPDATE CASCADE ON DELETE SET NULL
    //           );`,
    //     api_request_limits: `CREATE TABLE IF NOT EXISTS api_request_limits (
    //               service_name VARCHAR(255) NOT NULL,
    //               request_date DATE NOT NULL,
    //               request_count INTEGER NOT NULL DEFAULT 0,
    //               PRIMARY KEY (service_name, request_date)
    //           );`,
    // }
};
