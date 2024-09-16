const { development, test, production } = require('../configs/dbConfigs');
const Utils = require('../utilities/Utils');
const Pool = require('pg-pool');
const logger = Utils.Logger('PgClient');
const appConfigs = require('../configs/AppConfigs')

const NODE_ENV = appConfigs.environment;

class PgClient {
    constructor() {
        logger.info('Initializing PgClient');
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

        // Ensure all required config properties are present
        const requiredProps = ['user', 'host', 'database', 'password', 'port'];
        for (const prop of requiredProps) {
            if (!config[prop]) {
                logger.error(`Missing required Database configuration: ${prop}`);
                throw new Error(`Missing required Database configuration: ${prop}`);
            }
        }

        this.pool = new Pool(config);
        this.transactionStarted = false;

        // Handle pool errors
        this.pool.on('error', (err) => {
            logger.error('Database pool error: ' + err.message);
        });
    }

    async init() {
        try {
            this.client = await this.pool.connect();
            if (!this.client) throw new Error('Database connection failed');
            logger.debug('Database connected successfully');

            // Create tables if they don't exist
            await this.createTablesIfNotExist();
        } catch (error) {
            this.pool.on('error', (err) => {
                logger.error('Database pool error: ' + err.message);
            });

            // Log the full error for debugging
            logger.error(`Database connection failed: ${error.message}`);
            logger.error(`Error stack trace: ${error.stack}`);  // Add this to see the full error stack
            throw new Error('Database connection failed');
        }
    }

    isConnected() {
        return !!this.client;
    }

    transactionStatus() {
        return this.transactionStarted;
    }


    /**
     * Execute a PostgreSQL query. This method will automatically handle connecting
     * to the database and logging the query and its parameters. If the query fails,
     * the error will be re-thrown.
     * @param {string} sql - The SQL query to execute.
     * @param {Array} params - The parameters to substitute into the query.
     * @returns {Promise<QueryResult>} - A promise that resolves to the result of the query.
     */
    async query(sql, params) {
        if (!this.client) await this.init();
        logger.debug(`Query: ${sql}, params: ${JSON.stringify(params)}`);
        return this.client.query(sql, params);
    }
    /**
     * Start a PostgreSQL transaction. This will allow you to execute multiple queries
     * in a single, atomic unit of work. If any of the queries fail, the entire
     * transaction will be rolled back.
     *
     * @throws {Error} If the database is not connected.
     * @throws {Error} If a transaction is already started.
     * @returns {Promise<void>}
     */

    async beginTransaction() {
        if (!this.client) throw new Error('Database not connected');
        if (this.transactionStarted) throw new Error('Transaction already started');
        await this.client.query('BEGIN');
        this.transactionStarted = true;
        logger.debug('Transaction started');
    }

    /**
     * Commit the current PostgreSQL transaction. This will make the effects of any
     * queries executed since the transaction was started permanent.
     *
     * @throws {Error} If no transaction is started.
     * @returns {Promise<void>}
     */
    async commit() {
        if (this.transactionStarted) {
            await this.client.query('COMMIT');
            this.transactionStarted = false;
            logger.debug('Transaction committed');
        }
    }


    /**
     * Roll back the current PostgreSQL transaction. This will undo any changes
     * made in the current transaction, and will release any locks that were
     * acquired during the transaction.
     *
     * @throws {Error} If no transaction is started.
     * @returns {Promise<void>}
     */
    async rollback() {
        if (this.transactionStarted) {
            await this.client.query('ROLLBACK');
            this.transactionStarted = false;
            logger.debug('Transaction rolled back');
        }
    }

    /**
     * Release the PostgreSQL client connection back to the connection pool.
     * This is important to do after you are done using the client, as it
     * will allow other users to use the same connection.
     *
     * @returns {Promise<void>}
     */
    async release() {
        if (this.client) {
            this.client.release();
            logger.debug('Database client released');
        }
    }

    async createTablesIfNotExist() {
        const createTableQueries = [
            `CREATE TABLE IF NOT EXISTS users (
                national_id CHAR(13) PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                username VARCHAR(50) NOT NULL,
                hashed_password VARCHAR(255) NOT NULL,
                role VARCHAR(20) NOT NULL,
                member_since TIMESTAMP NOT NULL,
                CONSTRAINT check_national_id_length CHECK (LENGTH(national_id) = 13)
            );`,
            `CREATE TABLE IF NOT EXISTS financial_institutions (
                fi_code VARCHAR(20) PRIMARY KEY,
                name_th VARCHAR(255) NOT NULL,
                name_en VARCHAR(255) NOT NULL
            );`,
            `CREATE TABLE IF NOT EXISTS bank_accounts (
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
            `CREATE TABLE IF NOT EXISTS debts (
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
            `CREATE TABLE IF NOT EXISTS transactions (
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
            `CREATE TABLE IF NOT EXISTS transaction_bank_account_relations (
                transaction_id INT NOT NULL,
                account_number VARCHAR(20) NOT NULL,
                fi_code VARCHAR(20) NOT NULL,
                role VARCHAR(20) NOT NULL,
                PRIMARY KEY (account_number, fi_code, transaction_id),
                FOREIGN KEY (account_number, fi_code) REFERENCES bank_accounts(account_number, fi_code) ON UPDATE CASCADE ON DELETE CASCADE,
                FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id) ON UPDATE CASCADE ON DELETE SET NULL
            );`
        ];

        logger.info('Creating tables if not exist...');
        for (const query of createTableQueries) {
            const tableName = query.match(/CREATE TABLE IF NOT EXISTS (\w+)/)[1];
            await this.client.query(query);
            logger.debug(`Table ${tableName} created`);
        }
    }
}

module.exports = PgClient;
