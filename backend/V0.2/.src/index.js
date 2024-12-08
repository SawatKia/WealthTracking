const fs = require('fs');
const path = require('path');

const app = require("./app");
const Utils = require("./utilities/Utils");
const appConfigs = require("./configs/AppConfigs");
const FiModel = require("./models/FinancialInstitutionModel");

const tesseractService = require("./services/Tesseract");
const pgClient = require("./services/PgClient");
const easySlip = require("./services/EasySlip");
const ollama = require("./services/OllamaService");

const NODE_ENV = appConfigs.environment;
const { Logger, formatResponse } = Utils;
const logger = Logger("Index");
const PORT = appConfigs.appPort || 3000;
/**
 * Load mock data for development environment
 */
const loadMockData = async () => {
  logger.info('Loading mock data for development environment...');
  const mockDataDir = path.join(__dirname, '../sql/mock_data');
  const mockDataFiles = [
    { name: '01_users.sql', table: 'users' },
    { name: '02_bank_accounts.sql', table: 'bank_accounts' },
    { name: '03_debts.sql', table: 'debts' },
    { name: '04_transactions.sql', table: 'transactions' },
    { name: '05_slip_history.sql', table: 'slip_history' }
  ];

  for (const file of mockDataFiles) {
    try {
      const filePath = path.join(mockDataDir, file.name);
      const mockDataSQL = fs.readFileSync(filePath, 'utf8');
      logger.info(`Loading mock data for ${file.table}...`);
      await pgClient.query(mockDataSQL, null, { silent: true });
      logger.info(`✓ Successfully loaded mock data for ${file.table}`);
    } catch (error) {
      logger.error(`Failed to load mock data for ${file.table}:`);
      if (error.code) {
        logger.error(`├─ PostgreSQL Error Code: ${error.code}`);
        logger.error(`├─ Table: ${file.table}`);
        logger.error(`├─ Detail: ${error.detail || 'No detail provided'}`);
        logger.error(`├─ Constraint: ${error.constraint || 'No constraint information'}`);
        logger.error(`└─ Message: ${error.message}`);
      } else {
        logger.error(`└─ Error: ${error.message}`);
      }
      logger.debug(`Full error for ${file.table}:`, error);
      throw new Error(`Failed to load mock data for ${file.table}`);
    }
  }
  logger.info('All mock data loaded successfully');
};

/**
 * Initialize all required services
 */
const initializeServices = async () => {
  logger.info("Initializing services...");

  if (!pgClient.isConnected()) {
    logger.info("Connecting to database...");
    await pgClient.init();
    logger.info("Database connected");
  }

  await easySlip.init();
  await ollama.init();

  const fi = new FiModel();
  await fi.initializeData();

  await tesseractService.initializeScheduler();
};

/**
 * Start the Express server
 */
const startExpressServer = () => {
  return new Promise((resolve, reject) => {
    const server = app.app.listen(PORT, () => {
      const endTime = Date.now();
      const timeTaken = endTime - app.startTime;

      logger.debug('┌──────────────────────────────────────────┐');
      logger.debug('│       Server started successfully        │');
      logger.debug('├──────────────────────────────────────────┤');
      logger.debug(`│ Environment: ${NODE_ENV.padEnd(28)}│`);
      logger.debug(`│ App is listening on port ${PORT.toString().padEnd(16)}│`);
      logger.debug(`│ Server startup time: ${timeTaken} ms`.padEnd(43) + '│');
      logger.debug('└──────────────────────────────────────────┘');
      logger.info(`try sending a request to localhost:${PORT}/health to verify server is running`);
      resolve(server);
    });

    server.on('error', (error) => {
      logger.error('Server error:', error);
      reject(error);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });
  });
};

/**
 * Function to start the server
 */
const startServer = async () => {
  logger.info("=".repeat(20) + " Starting server " + "=".repeat(20));

  try {
    await initializeServices();

    if (NODE_ENV === 'development') {
      try {
        await pgClient.truncateTables();
        await loadMockData();
      } catch (error) {
        logger.error('Mock data loading process failed');
        logger.error(error.message);
        // Continue server startup even if mock data fails
      }
    }

    await startExpressServer();
  } catch (error) {
    logger.error("Failed to start the server:", error.message);
    process.exit(1);
  }
};

// Initialize server
startServer();
