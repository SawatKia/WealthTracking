const { development, test, production } = require("../configs/dbConfigs");
const { Logger } = require("../utilities/Utils");
const Pool = require("pg-pool");
const appConfigs = require("../configs/AppConfigs");
const fs = require('fs');
const path = require('path');

const NODE_ENV = appConfigs.environment;
const TEST_DB = appConfigs.postgres.databaseName;
const logger = Logger("PgClient");

class PgClient {
  constructor() {
    logger.info("Initializing PgClient instance");
    logger.debug(`Running Environment: ${NODE_ENV}`);
    this.tables = [
      'users',
      'financial_institutions',
      'bank_accounts',
      'debts',
      'transactions',
      'transaction_bank_account_relations',
      'api_request_limits',
      'used_refresh_tokens',
      'slip_history'
    ];

    let config;
    if (NODE_ENV === "development") {
      config = development;
    } else if (NODE_ENV === "test") {
      config = test;
    } else {
      config = production;
    }

    logger.debug(`Database Config: ${JSON.stringify(config)}`);

    const requiredProps = ["user", "host", "database", "password", "port"];
    for (const prop of requiredProps) {
      if (!config[prop]) {
        logger.error(`Missing required Database configuration: ${prop}`);
        throw new Error(`Missing required Database configuration: ${prop}`);
      }
    }

    this.pool = new Pool(config);
    this.client = null;
    this.transactionStarted = false;

    this.pool.on("error", (err) => {
      logger.error("Database pool error: " + err.message);
    });
  }

  /**
   * Initialize the PgClient by connecting to the database and creating tables
   * if they don't exist. This function is called automatically by the constructor.
   * If the environment is "test", it will create a test database if it doesn't
   * exist.
   * @returns {Promise<void>}
   */
  async init() {
    try {
      logger.info("Initialize PgClient");
      if (NODE_ENV === "test" || NODE_ENV === "development") {
        // Create database if it doesn't exist
        logger.info(`Checking if ${NODE_ENV} database exists...`);
        await this.createDatabase(NODE_ENV);
      }

      // Connect to the database
      logger.info("Connecting to the database...");
      this.client = await this.pool.connect();
      if (!this.client) {
        throw new Error("Database connection failed");
      }
      logger.info(`Database connected successfully`);

      await this.createAllTables();
    } catch (error) {
      // If there's an error, log it and throw it
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

  async query(sql, params, options = { silent: false }) {
    if (!this.client) {
      logger.error("Database not initialized. Call init() first.");
      throw new Error("Database not initialized. Call init() first.");
    }

    if (!options.silent) {
      logger.info('received query request');
      logger.debug(`sql: ${sql}`);
      logger.debug(`params: ${JSON.stringify(params)}`);
      logger.info('querying...');
    }

    return this.client.query(sql, params);
  }

  async beginTransaction() {
    if (!this.client) throw new Error("Database not connected");
    if (this.transactionStarted) throw new Error("Transaction already started");
    await this.client.query("BEGIN");
    this.transactionStarted = true;
    logger.debug("Transaction started");
  }

  async commit() {
    if (this.transactionStarted) {
      await this.client.query("COMMIT");
      this.transactionStarted = false;
      logger.debug("Transaction committed");
    }
  }

  async rollback() {
    if (this.transactionStarted) {
      await this.client.query("ROLLBACK");
      this.transactionStarted = false;
      logger.debug("Transaction rolled back");
    }
  }

  async release() {
    if (appConfigs.environment === 'test') {
      // delete all rows of all tables
      for (const table of this.tables) {
        await this.client.query(`TRUNCATE TABLE ${table} CASCADE`);
        logger.debug(`All rows deleted from table: ${table}`);
      }
    }
    if (this.client) {
      this.client.release();
      logger.debug("Database client released");
    }
  }

  /**
   * Create a database if it doesn't exist.
   * 
   * For test and development environments:
   * 
   *  - If database exists: It will be deleted and recreated with new configurations
   *  - If database doesn't exist: It will be created
   * 
   * For production environment:
   * 
   *  - If database exists: No changes will be made
   *  - If database doesn't exist: It will be created
   * 
   * @param {string} environment - The environment to create the database in. Must be either "test", "development" or "production".
   * @returns {Promise<void>}
   */
  async createDatabase(environment = 'test') {
    if (!['test', 'development', 'production'].includes(environment)) {
      throw new Error('Invalid environment. Must be either "test", "development" or "production"');
    }

    const config = environment === 'test' ? test : (environment === 'development' ? development : production);
    const dbName = config.database;

    const adminPool = new Pool({
      ...config,
      database: "postgres", // Use 'postgres' as the default admin database
    });

    let adminClient;
    logger.info(`start creating ${environment} database name: '${dbName}' process...`);
    try {
      adminClient = await adminPool.connect();
      // Check if the database exists
      logger.info(`checking if ${environment} database name: '${dbName}' exists?`);
      const checkDbQuery = `SELECT 1 FROM pg_database WHERE datname = $1`;
      const result = await adminClient.query(checkDbQuery, [dbName]);

      if (result.rowCount > 0) {
        logger.info(`${environment} database name: '${dbName}' already exists`);
        const forceDbReset = String(appConfigs.databaseReset).toLowerCase() === 'true';
        logger.warn(`force db reset: ${forceDbReset ? 'enable' : 'disable'} db reset`);

        // Only delete the database if it's not production and FORCE_DB_RESET is true 
        if (environment != 'production' && forceDbReset) {
          const deleteDbQuery = `DROP DATABASE "${dbName}"`;
          await adminClient.query(deleteDbQuery);
          logger.warn(`${environment} database name: '${dbName}' deleted successfully`);
        }
        else {
          logger.info('skipping database deletion and recreation');
          return;
        }
      }

      // Only create database if it doesn't exist
      const createDbQuery = `CREATE DATABASE "${dbName}"`;
      await adminClient.query(createDbQuery);
      logger.info(`${environment} database name: '${dbName}' created successfully with new configurations(if any)`);

    } catch (error) {
      if (error.code !== "42P04") {
        // 42P04 is the code for 'database already exists'
        logger.error(`Error creating ${environment} database: ${error.message}`);
        throw error;
      }
      logger.info(`${environment} database name: '${dbName}' already exists`);
    } finally {
      if (adminClient) {
        adminClient.release();
      }
      await adminPool.end();
    }
  }

  async createAllTables() {
    // Check if tables exist and create them if they don't
    logger.info("Checking if tables exist...");
    let createdTables = [];

    for (const table of this.tables) {
      try {
        // Check if the table exists
        await this.client.query(`SELECT 1 FROM ${table}`);
        logger.debug(`Table [${table}] exists, skip creating table...`);
      } catch (error) {
        // The table doesn't exist, create it
        logger.debug(`Table [${table}] does not exist`);
        logger.debug(`Creating table: [${table}]`);
        const createdTable = await this.createTable(table);
        createdTables.push(createdTable);
      }
    }
    const tableCount = createdTables.length;
    if (tableCount > 0) {
      logger.info(`+${'-'.repeat(40)}+`);
      logger.info(`| ${'Tables Created Successfully'.padEnd(39)}|`);
      logger.info(`+${'-'.repeat(40)}+`);
      createdTables.forEach(table => {
        const tableLength = table.length;
        if (tableLength > 40) {
          logger.info(`| ${table.substring(0, 37)}... |`);
        } else {
          logger.info(`| ${table.padEnd(39)}|`);
        }
      });
      logger.info(`+${'-'.repeat(40)}+`);
      logger.info(`| ${`Total Tables Created: ${tableCount}`.padEnd(39)}|`);
      logger.info(`+${'-'.repeat(40)}+`);
    }

    // After creating all tables, create triggers
    try {
      const triggerSQL = fs.readFileSync(path.join(__dirname, '../../sql/triggers.sql'), 'utf8');
      await this.client.query(triggerSQL);
      logger.info('Database triggers created successfully');
    } catch (error) {
      logger.error(`Error creating triggers: ${error.message}`);
      throw error;
    }
    logger.info('All database triggers created successfully');
  }

  async createTable(tableName) {
    logger.info(`Creating table ${tableName}...`);
    try {
      const sqlPath = path.join(__dirname, '../../sql/tables', `${tableName}.sql`);
      logger.debug(`finding sqlPath: ${sqlPath}`);
      const createTableSQL = fs.readFileSync(sqlPath, 'utf8');

      // Remove the table name comment and execute the CREATE TABLE statement
      const sqlStatement = createTableSQL.replace(/-- TABLE: \w+\n/, '').trim();
      await this.client.query(sqlStatement);
      logger.debug(`Table ${tableName} created`);
      return tableName;
    } catch (error) {
      logger.error(`Error creating table ${tableName}: ${error.message}`);
      throw error;
    }
  }

  async connect() {
    if (!this.client) {
      this.client = await this.pool.connect();
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.release();
      this.client = null;
    }
  }

  async end() {
    if (NODE_ENV === 'test') {
      logger.info('Test environment detected. Dropping all rows from data tables...');

      for (const table of this.tables) {
        try {
          await this.client.query(`TRUNCATE TABLE ${table} CASCADE`);
          logger.debug(`All rows deleted from table: ${table}`);
        } catch (error) {
          logger.error(`Error deleting rows from table ${table}: ${error.message}`);
        }
      }
      logger.info('All rows deleted from all tables in test environment');
    }
    await this.pool.end();
  }
}

module.exports = new PgClient();
