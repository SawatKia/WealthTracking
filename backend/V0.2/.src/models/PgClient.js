const { development } = require('../configs/dbConfigs');
const Utils = require('../utilities/Utils');
const Pool = require('pg-pool');
const logger = Utils.Logger('PgClient');

class PgClient {
    constructor() {
        logger.info('Initializing PgClient');
        this.pool = new Pool(development);
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

    async query(sql, params) {
        if (!this.client) await this.init();
        logger.debug(`Query: ${sql}, params: ${JSON.stringify(params)}`);
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
}

module.exports = PgClient;
