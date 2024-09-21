const { development, test, production } = require('../configs/dbConfigs');
const Utils = require('../utilities/Utils');
const Pool = require('pg-pool');
const appConfigs = require('../configs/AppConfigs');

const NODE_ENV = appConfigs.environment;
const TEST_DB = appConfigs.postgres.databaseName;
const { Logger } = Utils;
const logger = Logger('PgClient');

class PgClient {
    constructor() {
        logger.info('Initializing PgClient instance');
        logger.debug(`Running Environment: ${NODE_ENV}`);

        let config;
        if (NODE_ENV === 'development') {
            config = development;
        } else if (NODE_ENV === 'test') {
            config = test;
        } else {
            config = production;
        }

        logger.debug(`Database Config: ${JSON.stringify(config)}`);

        const requiredProps = ['user', 'host', 'database', 'password', 'port'];
        for (const prop of requiredProps) {
            if (!config[prop]) {
                logger.error(`Missing required Database configuration: ${prop}`);
                throw new Error(`Missing required Database configuration: ${prop}`);
            }
        }

        this.pool = new Pool(config);
        this.client = null;
        this.transactionStarted = false;

        this.pool.on('error', (err) => {
            logger.error('Database pool error: ' + err.message);
        });
    }

    async _init() {
        try {
            logger.info('Initialize PgClient');
            if (NODE_ENV === 'test') {
                await this.createTestDatabase();
            }
            this.client = await this.pool.connect();
            if (!this.client) throw new Error('Database connection failed');
            logger.debug('Database connected successfully');

            logger.info('Checking if tables exist...');
            const tables = ['users', 'financial_institutions', 'bank_accounts', 'debts', 'transactions', 'transaction_bank_account_relations', 'api_request_limits'];
            for (const table of tables) {
                await this.createTableIfNotExist(table);
            }
        } catch (error) {
            logger.error(`Database connection failed: ${error.message}`);
            throw error;
        }
    }

    isConnected() {
        return !!this.client;
    }

    transactionStatus() {
        return this.transactionStarted;
    }

    async query(sql, params) {
        if (!this.client) await this._init();
        logger.debug(`Executing Query: ${sql}, with params: ${JSON.stringify(params)}`);
        return this.client.query(sql, params);
    }

    async beginTransaction() {
        if (!this.client) throw new Error('Database not connected');
        if (this.transactionStarted) throw new Error('Transaction already started');
        await this.client.query('BEGIN');
        this.transactionStarted = true;
        logger.debug('Transaction started');
    }

    async commit() {
        if (this.transactionStarted) {
            await this.client.query('COMMIT');
            this.transactionStarted = false;
            logger.debug('Transaction committed');
        }
    }

    async rollback() {
        if (this.transactionStarted) {
            await this.client.query('ROLLBACK');
            this.transactionStarted = false;
            logger.debug('Transaction rolled back');
        }
    }

    async release() {
        if (this.client) {
            this.client.release();
            logger.debug('Database client released');
        }
    }

    async createTestDatabase() {
        const adminPool = new Pool({
            ...test,
            database: 'postgres',  // Use 'postgres' as the default admin database
        });

        logger.info(`Creating test database '${TEST_DB}'...`);
        try {
            const adminClient = await adminPool.connect();
            // Check if the test database exists
            logger.info(`Checking if test database '${TEST_DB}' exists...`);
            const checkDbQuery = `SELECT 1 FROM pg_database WHERE datname = $1`;
            const result = await adminClient.query(checkDbQuery, [TEST_DB]);

            if (result.rowCount > 0) {
                logger.info(`Test database '${TEST_DB}' already exists`);
                adminClient.release();
                return; // Exit if the database exists
            }
            await adminClient.query(`CREATE DATABASE ${TEST_DB}`);
            logger.info(`Test database '${TEST_DB}' created successfully`);
            adminClient.release();
        } catch (error) {
            if (error.code !== '42P04') { // 42P04 is the code for 'database already exists'
                logger.error(`Error creating test database: ${error.message}`);
                throw error;
            }
            logger.info(`Test database '${TEST_DB}' already exists`);
        } finally {
            await adminPool.end();
        }
    }

    async createTableIfNotExist(tableName) {
        const createTableQuery = {
            users: `CREATE TABLE IF NOT EXISTS users (
                national_id CHAR(13) PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                username VARCHAR(50) NOT NULL,
                hashed_password VARCHAR(255) NOT NULL,
                role VARCHAR(20) NOT NULL,
                member_since TIMESTAMP NOT NULL,
                CONSTRAINT check_national_id_length CHECK (LENGTH(national_id) = 13)
            );`,
            financial_institutions: `CREATE TABLE IF NOT EXISTS financial_institutions (
                fi_code VARCHAR(20) PRIMARY KEY,
                name_th VARCHAR(255) NOT NULL,
                name_en VARCHAR(255) NOT NULL
            );`,
            bank_accounts: `CREATE TABLE IF NOT EXISTS bank_accounts (
                account_number VARCHAR(20) NOT NULL,
                fi_code VARCHAR(20) NOT NULL,
                national_id CHAR(13) NOT NULL,
                display_name VARCHAR(100) NOT NULL,
                account_name VARCHAR(100) NOT NULL,
                balance DECIMAL(15, 2) NOT NULL,
                PRIMARY KEY (account_number, fi_code),
                FOREIGN KEY (national_id) REFERENCES users(national_id),
                FOREIGN KEY (fi_code) REFERENCES financial_institutions(fi_code) ON UPDATE CASCADE ON DELETE CASCADE
            );`,
            debts: `CREATE TABLE IF NOT EXISTS debts (
                debt_number VARCHAR(50) NOT NULL,
                fi_code VARCHAR(20) NOT NULL,
                national_id CHAR(13) NOT NULL,
                debt_name VARCHAR(100) NOT NULL,
                start_date DATE NOT NULL,
                current_installment INT NOT NULL,
                total_installments INT NOT NULL,
                loan_principle DECIMAL(15, 2) NOT NULL,
                loan_balance DECIMAL(15, 2) NOT NULL,
                PRIMARY KEY (debt_number, fi_code),
                FOREIGN KEY (national_id) REFERENCES users(national_id),
                FOREIGN KEY (fi_code) REFERENCES financial_institutions(fi_code) ON UPDATE CASCADE ON DELETE CASCADE
            );`,
            transactions: `CREATE TABLE IF NOT EXISTS transactions (
                transaction_id SERIAL PRIMARY KEY,
                transaction_datetime TIMESTAMP NOT NULL,
                category VARCHAR(50) NOT NULL,
                type VARCHAR(20) NOT NULL,
                amount DECIMAL(15, 2) NOT NULL,
                note TEXT,
                national_id CHAR(13) NOT NULL,
                debt_number VARCHAR(50),
                fi_code VARCHAR(20),
                FOREIGN KEY (national_id) REFERENCES users(national_id),
                FOREIGN KEY (debt_number, fi_code) REFERENCES debts(debt_number, fi_code) ON UPDATE CASCADE ON DELETE CASCADE
            );`,
            transaction_bank_account_relations: `CREATE TABLE IF NOT EXISTS transaction_bank_account_relations (
                transaction_id INT NOT NULL,
                account_number VARCHAR(20) NOT NULL,
                fi_code VARCHAR(20) NOT NULL,
                role VARCHAR(20) NOT NULL,
                PRIMARY KEY (account_number, fi_code, transaction_id),
                FOREIGN KEY (account_number, fi_code) REFERENCES bank_accounts(account_number, fi_code) ON UPDATE CASCADE ON DELETE CASCADE,
                FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id) ON UPDATE CASCADE ON DELETE SET NULL
            );`,
            api_request_limits: `CREATE TABLE IF NOT EXISTS api_request_limits (
                service_name VARCHAR(255) NOT NULL,
                request_date DATE NOT NULL,
                request_count INTEGER NOT NULL DEFAULT 0,
                PRIMARY KEY (service_name, request_date)
            );`
        }[tableName];

        if (!createTableQuery) throw new Error(`No create table query for table ${tableName}`);

        logger.info(`Creating table ${tableName} if not exist...`);
        try {
            await this.client.query(createTableQuery);
            logger.debug(`Table ${tableName} created`);
        } catch (error) {
            logger.error(`Error creating table ${tableName}: ${error.message}`);
        }
    }
}

module.exports = new PgClient();
