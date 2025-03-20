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
    logger.debug(`Current Environment: ${NODE_ENV}`);

    // Set initial state
    this.pool = null;
    this.tempPool = null;
    this.tempClient = null;
    this.client = null;
    this.transactionStarted = false;

    // Initialize table definitions
    this.loadTableDefinitions();

    // Setup and validate database configuration
    this.targetConfig = this.initializeDatabaseConfig();
    this.validateDatabaseConfig(this.targetConfig);
    this.tempConfig = { ...this.targetConfig, database: 'postgres' };

    // Validate temp config as well
    this.validateDatabaseConfig(this.tempConfig);

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

  async init() {
    try {
      logger.info("Initialize PgClient");
      await this.initializeTempConnection();

      if (NODE_ENV === "development" || NODE_ENV === "test") {
        await this.createDatabase(NODE_ENV);
      }

      await this.cleanupTempConnection();
      await this.connect();
      await this.createAllTables();
    } catch (error) {
      await this.cleanup(); // Ensure cleanup on initialization failure
      logger.error(`Database initialization failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Initialize a temporary database connection to the default 'postgres' database
   * This is used to create the database with the specified name in the configuration
   * If the database already exists, this will simply connect to it
   * @returns {Promise<void>}
   */
  async initializeTempConnection() {
    logger.info("Initializing temporary database connection...");
    this.tempPool = new Pool(this.tempConfig);
    this.tempPool.on("error", (err) => {
      logger.error(`Temporary database pool error: ${err.message}`);
    });

    try {
      this.tempClient = await this.tempPool.connect();
      logger.info(`Connected to ${this.tempConfig.database} database successfully`);
    } catch (error) {
      await this.cleanupTempConnection();
      throw error;
    }
  }

  /**
   * Cleans up the temporary database connection and pool resources.
   * 
   * Releases the temporary client and ends the temporary pool if they exist,
   * logging any errors encountered during these operations.
   * Sets the temporary client and pool to null after cleanup.
   */
  async cleanupTempConnection() {
    if (this.tempClient) {
      try {
        await this.tempClient.release();
      } catch (error) {
        logger.error(`Error releasing temp client: ${error.message}`);
      }
      this.tempClient = null;
    }

    if (this.tempPool) {
      try {
        await this.tempPool.end();
      } catch (error) {
        logger.error(`Error ending temp pool: ${error.message}`);
      }
      this.tempPool = null;
    }
  }

  async connect() {
    try {
      if (!this.pool) {
        logger.info('Creating target pool...');
        this.pool = new Pool(this.targetConfig);
        this.pool.on("error", (err) => {
          logger.error(`Main database pool error: ${err.message}`);
        });
      }

      if (!this.client) {
        logger.info('Connecting to target database...');
        this.client = await this.pool.connect();
        logger.debug('Connected to target database');
      }
    } catch (error) {
      await this.cleanup();
      throw error;
    }
  }

  async disconnect(client = null) {
    if (client) {
      if (client === this.client) {
        await this.client.release();
        this.client = null;
      } else if (client === this.tempClient) {
        await this.tempClient.release();
        this.tempClient = null;
      }
    }
  }

  async isConnected() {
    if (!this.client) return false;

    try {
      // Test the connection with a simple query
      await this.client.query('SELECT 1');
      return true;
    } catch (error) {
      logger.error(`Connection test failed: ${error.message}`);
      return false;
    }
  }

  // Transaction Management Methods
  async beginTransaction() {
    try {
      if (!this.client) throw new Error("Database target Client not connected");
      if (this.transactionStarted) throw new Error("Transaction already started");
      await this.client.query("BEGIN");
      this.transactionStarted = true;
      logger.debug("Transaction started");
    } catch (error) {
      logger.error(`Error starting transaction: ${error.message}`);
      this.transactionStarted = false;
      throw error;
    }
  }

  async commit() {
    if (!this.transactionStarted) return;

    try {
      await this.client.query("COMMIT");
    } finally {
      this.transactionStarted = false;
    }
    logger.debug("Transaction committed");
  }

  async rollback() {
    if (!this.transactionStarted) return;

    try {
      await this.client.query("ROLLBACK");
    } finally {
      this.transactionStarted = false;
    }
    logger.debug("Transaction rolled back");
  }

  transactionStatus() {
    return this.transactionStarted;
  }


  /**
   * Executes a SQL query on the database.
   * @param {string} sql - The SQL query to execute.
   * @param {Array} params - The parameters to use in the SQL query.
   * @param {Object} [options] - Options for the query.
   * @param {boolean} [options.silent=false] - If true, logs the query request and result.
   * @param {pg.Client} [client] - The client to use for the query. If not specified, uses the target client.
   * @returns {Promise<pg.QueryResult>} - The result of the query.
   */
  async query(sql, params, options = { silent: false }, client = this.client) {
    try {
      if (!client) {
        logger.error("Database not initialized. Call createClient() first.");
        throw new Error("Database not initialized. Call createClient() first.");
      }
      params = this._isArray(params);

      if (!options.silent) {
        logger.info('received query request');
        logger.debug(`sql: ${sql} `);
        logger.debug(`params: ${JSON.stringify(params)}`);
        logger.info('querying...');
      }
      if (client === this.client) {
        return this.client.query(sql, params);

      } else if (client === this.tempClient) {
        return this.tempClient.query(sql, params);
      }

    } catch (error) {
      logger.error(`Error querying database: ${error.message} `);
      throw error;
    }
  }

  /**
   * Checks if the given parameter is an array and warns if it is not. If the parameter is undefined or not an array, it is modified to an empty array.
   * @param {*} param - The parameter to check.
   * @returns {Array} The modified parameter.
   * @private
   */
  _isArray(param) {
    if (!param) {
      logger.warn("params is undefined, modifying to empty array...");
      param = [];
    }

    if (param && !Array.isArray(param)) {
      logger.warn("params must be an array, modifying to array...");
      param = [param];
    }

    if (param && Array.isArray(param)) {
      return param;
    }
    return this._isArray(param);
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

    try {
      // Check if the database exists
      logger.info(`checking if ${environment} database name: '${dbName}' exists ? `);
      const checkDbQuery = `SELECT 1 FROM pg_database WHERE datname = $1`;
      const result = await this.tempClient.query(checkDbQuery, [dbName]);

      if (result.rowCount > 0) {
        logger.info(`${environment} database name: '${dbName}' already exists`);
        const forceDbReset = String(appConfigs.databaseReset).toLowerCase() === 'true';
        logger.warn(`force db reset: ${forceDbReset ? 'enable' : 'disable'} db reset`);

        // Only delete the database if it's not production and DB_RESET is true 
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

  /**
   * Checks and creates all missing tables in the database. If any tables are
   * created, the triggers are also created.
   *
   * @returns {Promise<void>}
   */
  async createAllTables() {
    logger.info("Checking and creating missing tables...");
    let createdTables = [];

    for (const table of Object.values(this.tables)) {
      try {
        // Check if table exists
        const existsQuery = `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = $1
          )
        `;
        const existsResult = await this.client.query(existsQuery, [table]);

        if (!existsResult.rows[0].exists) {
          const createdTable = await this.createTable(table);
          createdTables.push(createdTable);
          logger.debug(`Table ${table} created`);
        } else {
          logger.debug(`Table ${table} already exists`);
        }
      } catch (error) {
        logger.error(`Error processing table ${table}: ${error.message}`);
        throw error;
      }
    }

    this._logTableChanges(createdTables);
    await this.createTriggers();
  }

  _logTableChanges(createdTables) {
    const tableCount = createdTables.length;
    if (tableCount > 0) {
      logger.info(`┌${'─'.repeat(42)}┐`);
      logger.info(`│ ${'Tables Created/Recreated'.padEnd(41)}│`);
      logger.info(`├${'─'.repeat(42)}┤`);
      createdTables.forEach(table => {
        logger.info(`│ ${table.padEnd(41)}│`);
      });
      logger.info(`├${'─'.repeat(42)}┤`);
      logger.info(`│ ${`Total Tables: ${tableCount}`.padEnd(41)}│`);
      logger.info(`└${'─'.repeat(42)}┘`);
    }
  }

  async createTriggers() {
    try {
      const triggerSQL = fs.readFileSync(path.join(__dirname, '../../sql/triggers.sql'), 'utf8');
      await this.client.query(triggerSQL);
      logger.info('Database triggers created/updated successfully');
    } catch (error) {
      logger.error(`Error creating triggers: ${error.message}`);
      throw error;
    }
  }

  async createTable(tableName) {
    logger.info(`Creating table ${tableName} ...`);
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


  /**
   * Creates a PostgreSQL client connection.
   * @param {string} [clientName="target"] - The name of the client to create.
   *   If "target", creates a connection to the target database.
   *   If "temp", creates a connection to a temporary database.
   * @returns {Promise<pg.Client>} - The created client connection.
   */
  async createClient(clientName = "target") {
    logger.info(`Creating ${clientName} client...`);

    if (clientName === "temp") {
      if (!this.tempClient) {
        await this.initializeTempConnection();
      }
      logger.debug("Temp client created");
      return this.tempClient;
    }

    if (clientName === "target") {
      if (!this.client) {
        await this.connect();
      }
      logger.debug("Target client created");
      return this.client;
    }
  }

  async getActiveConnections() {
    const sql = `
      SELECT pid, datname, usename, client_addr, client_port, application_name, state, query
      FROM pg_stat_activity;
    `;
    try {
      const result = await this.client.query(sql);
      console.table(result.rows);
      return result.rows;
    } catch (error) {
      logger.error(`Error retrieving active connections: ${error.message}`);
      throw error;
    }
  }

  /**
   * Terminates idle database connections for the specified database.
   * @param {string} dbName - The name of the database to terminate idle connections for.
   * @returns {Promise<number>} - The number of terminated connections.
   */
  async terminateIdle(dbName) {
    const sql = `
    SELECT pg_terminate_backend(pid)
    FROM pg_stat_activity
    WHERE datname = $1 AND state = 'idle';
  `;
    try {
      const result = await this.client.query(sql, [dbName]);
      logger.info(`Terminated ${result.rowCount} idle connections for database: ${dbName}`);
      return result.rowCount;
    } catch (error) {
      logger.error(`Error terminating idle connections for database ${dbName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Truncate tables by name or all tables
   * @param {string | string[]} table - The name of the table to truncate or an array of table names to truncate.
   * @returns {Promise<void>}
   */
  async truncateTables(table = null) {
    if (!this.client) {
      await this.connect();
    }

    const tablesToTruncate = Array.isArray(table)
      ? table
      : table
        ? [table]
        : Object.values(this.tables);
    logger.info(`Truncating ${table ? 'the following tables' : 'all tables'}: ${tablesToTruncate.join(', ')}`);

    for (const table of tablesToTruncate) {
      if (table !== this.tables.FINANCIAL_INSTITUTIONS &&
        table !== this.tables.API_REQUEST_LIMITS &&
        table !== this.tables.SLIP_HISTORY
        // && table !== this.tables.USERS
      ) {
        try {
          const result = await this.client.query(`TRUNCATE TABLE ${table} CASCADE`);
          const rowCount = result.rowCount || 0;
          logger.debug(`${rowCount} rows deleted from table: ${table}`);
        } catch (error) {
          logger.error(`Error truncating table: ${table} ${error.message}`);
        }
      } else {
        logger.info(`!! ${`Skipping table: ${table}`.padEnd(39)} !`);
      }
    }
  }

  // Cleanup Methods
  async release(truncateTables = false) {
    if (this.transactionStarted) {
      await this.rollback();
    }

    if (appConfigs.environment === 'test' && truncateTables) {
      await this.truncateTables();
    }

    await this.cleanup();
  }

  async cleanup() {
    // Clean up client
    if (this.client) {
      try {
        await this.client.release();
        logger.debug("Main database client released");
      } catch (err) {
        logger.error(`Error releasing main client: ${err.message}`);
      }
      this.client = null;
    }

    // Clean up pool
    if (this.pool) {
      try {
        await this.pool.end();
        logger.debug("Main database pool ended");
      } catch (err) {
        logger.error(`Error ending main pool: ${err.message}`);
      }
      this.pool = null;
    }

    // Clean up temporary connections
    await this.cleanupTempConnection();
  }

  async end() {
    try {
      if (NODE_ENV === 'test') {
        logger.info('Test environment detected. Dropping all rows from data tables...');
        await this.truncateTables();
      }
    } finally {
      await this.cleanup();
    }
  }
}

module.exports = new PgClient();

