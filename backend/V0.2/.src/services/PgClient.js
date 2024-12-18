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
    // this.tables = {
    //   USERS: 'users',
    //   FINANCIAL_INSTITUTIONS: 'financial_institutions',
    //   BANK_ACCOUNTS: 'bank_accounts',
    //   DEBTS: 'debts',
    //   TRANSACTIONS: 'transactions',
    //   TRANSACTION_BANK_ACCOUNT_RELATIONS: 'transaction_bank_account_relations',
    //   API_REQUEST_LIMITS: 'api_request_limits',
    //   USED_REFRESH_TOKENS: 'used_refresh_tokens',
    //   SLIP_HISTORY: 'slip_history'
    // };

    // Read table names from SQL files in the /sql/tables/ directory
    const tablesDir = path.join(__dirname, '../../sql/tables');
    logger.silly(`tablesDir: ${tablesDir} `);
    const tableFiles = fs.readdirSync(tablesDir);
    const tableNames = tableFiles.map(file => path.basename(file, '.sql'));
    logger.debug(`read tableNames from sql file: ${tableNames.join(', ')} `);

    // Define the desired order of tables
    const orderedTableNames = [
      'users',
      'financial_institutions',
      'bank_accounts',
      'debts',
      'transactions',
      // Add any other tables that need to be in a specific order
    ];

    // Add any remaining tables that are not explicitly ordered
    const unorderedTables = tableNames.filter(name => !orderedTableNames.includes(name));
    logger.silly(`unorderedTables: ${unorderedTables.join(', ')} `);
    const finalTableOrder = [...orderedTableNames, ...unorderedTables];
    logger.silly(`finalTableOrder: ${finalTableOrder.join(', ')} `);

    this.tables = {};
    finalTableOrder.forEach(tableName => {
      this.tables[tableName.toUpperCase()] = tableName;
    });
    logger.debug(`this.tables: ${JSON.stringify(this.tables, null, 2)} `);

    Object.freeze(this.tables);

    let config;
    if (NODE_ENV === "development") {
      config = development;
    } else if (NODE_ENV === "test") {
      config = test;
    } else {
      config = production;
    }


    const requiredProps = ["user", "host", "password", "port"];
    for (const prop of requiredProps) {
      if (!config[prop]) {
        logger.error(`Missing required Database configuration: ${prop}`);
        throw new Error(`Missing required Database configuration: ${prop}`);
      }
    }

    // Initially connect to 'postgres' database
    this.tempConfig = { ...config, database: 'postgres' };
    logger.debug(`Initial Database Config: ${JSON.stringify(this.tempConfig)}`);
    this.pool = new Pool(this.tempConfig);
    this.client = null;
    this.transactionStarted = false;
    this.targetConfig = config; // Store the target database config for later use

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
      logger.info(`Connecting to ${this.tempConfig.database} database...`);
      this.client = await this.pool.connect();
      if (!this.client) {
        throw new Error(`Database connection failed: ${this.tempConfig.database}`);
      }
      logger.info(`Connected to ${this.tempConfig.database} database successfully`);

      if (NODE_ENV === "development" || NODE_ENV === "test") {
        // Create database if it doesn't exist
        logger.info(`Checking if ${NODE_ENV} database exists...`);
        await this.createDatabase(NODE_ENV);
      }

      // Switch to the target database
      await this.disconnect();
      await this.pool.end();

      logger.debug(`targetConfig: ${JSON.stringify(this.targetConfig)}`);
      this.pool = new Pool(this.targetConfig);
      await this.connect();
      logger.info(`Connected to ${this.targetConfig.database} database successfully`);

      await this.createAllTables();
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

  async query(sql, params, options = { silent: false }) {
    try {
      if (!this.client) {
        logger.error("Database not initialized. Call init() first.");
        throw new Error("Database not initialized. Call init() first.");
      }

      if (!options.silent) {
        logger.info('received query request');
        logger.debug(`sql: ${sql} `);
        logger.debug(`params: ${JSON.stringify(params)} `);
        logger.info('querying...');
      }

      return this.client.query(sql, params);
    } catch (error) {
      logger.error(`Error querying database: ${error.message} `);
      throw error;
    }
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

  /**
   * Truncate tables by name or all tables
   * @param {string | string[]} table - The name of the table to truncate or an array of table names to truncate.
   * @returns {Promise<void>}
   */
  async truncateTables(table = null) {
    const tablesToTruncate = Array.isArray(table)
      ? table
      : table
        ? [table]
        : Object.values(this.tables);
    logger.info(`Truncating ${table ? 'the following tables' : 'all tables'}: ${tablesToTruncate.join(', ')}`);

    for (const t of tablesToTruncate) {
      if (t !== this.tables.FINANCIAL_INSTITUTIONS) {
        await this.client.query(`TRUNCATE TABLE ${t} CASCADE`);
        logger.debug(`All rows deleted from table: ${t}`);
      } else {
        logger.info('!'.repeat(42));
        logger.info(`! ${`Skipping table: ${t}`.padEnd(39)} !`);
        logger.info('!'.repeat(42));
      }
    }
  }

  async release() {
    if (appConfigs.environment === 'test') {
      await this.truncateTables();
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
    logger.info(`Creating ${environment} database...`);
    const dbName = this.targetConfig.database;
    if (!['test', 'development', 'production'].includes(environment)) {
      throw new Error('Invalid environment. Must be either "test", "development" or "production"');
    }

    logger.info(`start creating ${environment} database name: '${dbName}' process...`);
    try {
      // Check if the database exists
      logger.info(`checking if ${environment} database name: '${dbName}' exists ? `);
      const checkDbQuery = `SELECT 1 FROM pg_database WHERE datname = $1`;
      const result = await this.client.query(checkDbQuery, [dbName]);

      if (result.rowCount > 0) {
        logger.info(`${environment} database name: '${dbName}' already exists`);
        const forceDbReset = String(appConfigs.databaseReset).toLowerCase() === 'true';
        logger.warn(`force db reset: ${forceDbReset ? 'enable' : 'disable'} db reset`);

        // Only delete the database if it's not production and FORCE_DB_RESET is true 
        if (environment != 'production' && forceDbReset) {
          // Drop the database
          await this.client.query(`DROP DATABASE "${dbName}"`);
          logger.warn(`${environment} database name: '${dbName}' deleted successfully`);
        } else {
          logger.warn('skipping database deletion and recreation');
          return;
        }
      }
      // Create the new database
      await this.client.query(`CREATE DATABASE "${dbName}"`);
      logger.info(`${environment} database name: '${dbName}' created successfully`);
      return;
    } catch (error) {
      if (error.code !== "42P04") { // 42P04 is the code for 'database already exists'
        logger.error(`Error creating ${environment} database: ${error.message} `);
        throw error;
      }
      logger.info(`${environment} database name: '${dbName}' already exists`);
    }
  }

  async createAllTables() {
    // Check if tables exist and create them if they don't
    logger.info("Checking if tables exist...");
    let createdTables = [];

    for (const table of Object.values(this.tables)) {
      try {
        // Check if the table exists
        await this.client.query(`SELECT 1 FROM ${table} `);
        logger.debug(`Table[${table}]exists, skip creating table...`);
      } catch (error) {
        // The table doesn't exist, create it
        logger.silly(`Table[${table}] does not exist`);
        logger.silly(`Creating table: [${table}]`);
        const createdTable = await this.createTable(table);
        createdTables.push(createdTable);
      }
    }
    const tableCount = createdTables.length;
    if (tableCount > 0) {
      logger.info(`┌${'─'.repeat(42)}┐`);
      logger.info(`│ ${'Tables Created Successfully'.padEnd(41)}│`);
      logger.info(`├${'─'.repeat(42)}┤`);
      createdTables.forEach(table => {
        const tableLength = table.length;
        if (tableLength > 40) {
          logger.info(`│ ${table.substring(0, 37)}... │`);
        } else {
          logger.info(`│ ${table.padEnd(41)}│`);
        }
      });
      logger.info(`├${'─'.repeat(42)}┤`);
      logger.info(`│ ${`Total Tables Created: ${tableCount}`.padEnd(41)}│`);
      logger.info(`└${'─'.repeat(42)}┘`);
    }

    // After creating all tables, create triggers
    try {
      const triggerSQL = fs.readFileSync(path.join(__dirname, '../../sql/triggers.sql'), 'utf8');
      await this.client.query(triggerSQL);
      logger.info('Database triggers created successfully');
    } catch (error) {
      logger.error(`Error creating triggers: ${error.message} `);
      throw error;
    }
  }

  async createTable(tableName) {
    logger.info(`Creating table ${tableName}...`);
    try {
      const sqlPath = path.join(__dirname, '../../sql/tables', `${tableName}.sql`);
      logger.silly(`finding sqlPath: ${sqlPath} `);
      const createTableSQL = fs.readFileSync(sqlPath, 'utf8');

      // Remove the table name comment and execute the CREATE TABLE statement
      const sqlStatement = createTableSQL.replace(/-- TABLE: \w+\n/, '').trim();
      await this.client.query(sqlStatement);
      logger.info(`Table ${tableName} created`);
      return tableName;
    } catch (error) {
      logger.error(`Error creating table ${tableName}: ${error.message} `);
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

      for (const table of Object.values(this.tables)) {
        try {
          await this.client.query(`TRUNCATE TABLE ${table} CASCADE`);
          logger.debug(`All rows deleted from table: ${table} `);
        } catch (error) {
          logger.error(`Error deleting rows from table ${table}: ${error.message} `);
        }
      }
      logger.info('All rows deleted from all tables in test environment');
    }
    await this.pool.end();
  }
}

module.exports = new PgClient();
