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
    logger.info("Running PgClient instance");
    logger.debug(`Curent Environment: ${NODE_ENV}`);

    // Initialize table definitions
    this.loadTableDefinitions();

    // Setup database configuration
    const config = this.initializeDatabaseConfig();
    this.validateDatabaseConfig(config);

    // Initialize connection pools
    this.createConnectionPools(config);

    // Set initial state
    this.pool = null;
    this.tempPool = null;
    this.tempClient = null;
    this.client = null;
    this.transactionStarted = false;
    this.targetConfig = config;

  }

  /**
   * Initialize the PgClient by connecting to the database and creating tables
   * if they don't exist. This function is called automatically by the constructor.
   * If the environment is "test", it will create a test database if it doesn't
   * exist.
   * @returns {Promise<void>}
   */
  // Initialize database table definitions from SQL files
  loadTableDefinitions() {
    const tablesDir = path.join(__dirname, '../../sql/tables');
    logger.silly(`tablesDir: ${tablesDir}`);
    const tableFiles = fs.readdirSync(tablesDir);
    const tableNames = tableFiles.map(file => path.basename(file, '.sql'));
    logger.debug(`Discovered table names: ${tableNames.join(', ')}`);

    const orderedTableNames = [
      'users',
      'financial_institutions',
      'bank_accounts',
      'debts',
      'transactions'
    ];

    const unorderedTables = tableNames.filter(name => !orderedTableNames.includes(name));
    logger.silly(`Unordered tables: ${unorderedTables.join(', ')}`);

    const finalTableOrder = [...orderedTableNames, ...unorderedTables];
    logger.silly(`Final table order: ${finalTableOrder.join(', ')}`);

    this.tables = {};
    finalTableOrder.forEach(tableName => {
      this.tables[tableName.toUpperCase()] = tableName;
    });

    logger.debug(`Final table structure: ${JSON.stringify(this.tables, null, 2)}`);
    Object.freeze(this.tables);
  }

  // Select appropriate database config based on environment
  initializeDatabaseConfig() {
    logger.debug(`appConfigs: ${JSON.stringify(appConfigs, null, 2)}`);
    logger.info("Initializing database configuration...");
    let config;
    switch (NODE_ENV) {
      case "development":
        config = development;
        break;
      case "test":
        config = test;
        break;
      default:
        config = production;
    }
    logger.debug(`initialized database config: ${JSON.stringify(config)}`);
    return config;
  }

  // Validate essential database configuration properties
  validateDatabaseConfig(config) {
    logger.info("Validating database configuration...");
    const requiredProps = ["user", "host", "password", "port"];
    for (const prop of requiredProps) {
      if (!config[prop]) {
        logger.error(`Missing database configuration: ${prop}`);
        throw new Error(`Missing required database configuration: ${prop}`);
      }
    }
    logger.info("Database configuration validated successfully");
  }

  // Initialize database connection pools
  createConnectionPools(config) {
    this.tempConfig = { ...config, database: 'postgres' };
    logger.debug(`Temporary database config: ${JSON.stringify(this.tempConfig)}`);
  }

  async init() {
    try {
      logger.info("Initialize PgClient");
      // Create fresh temp pool each init
      this.tempPool = new Pool(this.tempConfig);
      this.tempPool.on("error", (err) => {
        logger.error(`Database pool error: ${err.message}`);
      });
      logger.info(`Connecting to ${this.tempConfig.database} database...`);
      this.tempClient = await this.tempPool.connect();
      if (!this.tempClient) {
        throw new Error(`Database connection failed: ${this.tempConfig.database}`);
      }
      logger.info(`Connected to ${this.tempConfig.database} database successfully`);

      if (NODE_ENV === "development" || NODE_ENV === "test") {
        // Create database if it doesn't exist
        logger.info(`Checking if ${NODE_ENV} database exists...`);
        await this.createDatabase(NODE_ENV);
      }

      if (this.tempClient) {
        await this.disconnect(this.tempClient);
        await this.tempPool.end();
      }
      this.tempPool = null; // Clear reference

      // Switch to the target database
      await this.connect();
      logger.info(`Connected to ${this.targetConfig.database} database successfully`);

      await this.createAllTables();
    } catch (error) {
      logger.error(`Database connection failed: ${error.message}`);
      throw error;
    }
  }

  isConnected() {
    logger.info('Checking if target Database is connected...');
    logger.debug(`client: ${JSON.stringify(this.client)} `);
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

      return await this.client.query(sql, params);
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
      if (t !== this.tables.FINANCIAL_INSTITUTIONS &&
        t !== this.tables.API_REQUEST_LIMITS &&
        t !== this.tables.SLIP_HISTORY
        // && t !== this.tables.USERS
      ) {
        await this.client.query(`TRUNCATE TABLE ${t} CASCADE`);
        logger.debug(`All rows deleted from table: ${t}`);
      } else {
        logger.info(`!! ${`Skipping table: ${t}`.padEnd(39)} !`);
      }
    }
  }

  async release(truncateTables = false) {
    if (appConfigs.environment === 'test' && truncateTables) {
      await this.truncateTables();
    }

    if (this.client) {
      try {
        this.client.release();
        logger.debug("Main database client released");
      } catch (err) {
        logger.error(`Error releasing main client: ${err.message}`);
      }
      this.client = null;
    }

    if (this.tempClient) {
      try {
        this.tempClient.release();
        logger.debug("Temporary database client released");
      } catch (err) {
        logger.error(`Error releasing temp client: ${err.message}`);
      }
      this.tempClient = null;
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
      const result = await this.tempClient.query(checkDbQuery, [dbName]);

      if (result.rowCount > 0) {
        logger.info(`${environment} database name: '${dbName}' already exists`);
        const forceDbReset = String(appConfigs.databaseReset).toLowerCase() === 'true';
        logger.warn(`force db reset: ${forceDbReset ? 'enable' : 'disable'} db reset`);

        // Only delete the database if it's not production and FORCE_DB_RESET is true 
        if (environment != 'production' && forceDbReset) {
          // Drop the database
          await this.tempClient.query(`DROP DATABASE "${dbName}"`);
          logger.warn(`${environment} database name: '${dbName}' deleted successfully`);
        } else {
          logger.warn('skipping database deletion and recreation');
          return;
        }
      }
      // Create the new database
      await this.tempClient.query(`CREATE DATABASE "${dbName}"`);
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
    if (!this.pool) {
      logger.info('Creating target pool...');
      logger.debug(`targetConfig: ${JSON.stringify(this.targetConfig)}`);
      this.pool = new Pool(this.targetConfig);
      logger.debug('targetPool created');
    }
    if (!this.client) {
      logger.info('Connecting to target database...');
      this.client = await this.pool.connect();
      logger.debug('Connected to target database successfully');
    }
  }

  async disconnect(client = null) {
    if (client) {
      await client.release();
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
  }
}

module.exports = new PgClient();
