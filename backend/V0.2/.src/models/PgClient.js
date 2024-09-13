const { development, test, production } = require('../configs/dbConfigs');
const Utils = require('../utilities/Utils');
const Pool = require('pg-pool');
const logger = Utils.Logger('PgClient');

require('dotenv').config();
const NODE_ENV = process.env.NODE_ENV;

class PgClient {
    constructor(config = NODE_ENV === 'development' ? development : NODE_ENV === 'test' ? test : production) {
        logger.info('Initializing PgClient');
        logger.debug(`running Environment: ${NODE_ENV}`);
        logger.debug(`Config: ${JSON.stringify(config)}`);
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
}

module.exports = PgClient;
