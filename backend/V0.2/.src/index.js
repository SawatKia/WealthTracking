const app = require("./app");
const Utils = require("./utilities/Utils");
const appConfigs = require("./configs/AppConfigs");
const FiModel = require("./models/FinancialInstitutionModel");

const pgClient = require("./services/PgClient");
const easySlip = require("./services/EasySlip");

const NODE_ENV = appConfigs.environment;
const { Logger, formatResponse } = Utils;
const logger = Logger("Index");
const PORT = appConfigs.appPort || 3000;
/**
 * Function to start the server
 */
const startServer = async () => {
  logger.info("Starting server...");
  try {
    logger.info("Connecting to database...");

    pgClient.isConnected() ? logger.info("Database connected") : await pgClient.init();
    easySlip.init();

    const fi = new FiModel();
    await fi.initializeData();

    // Start Express server after database connection is established
    const server = app.listen(PORT, "0.0.0.0", () => {
      logger.debug('+---------------------------------------+');
      logger.debug('|       Server started successfully     |');
      logger.debug('+---------------------------------------+');
      logger.debug(`| Environment: ${NODE_ENV}              |`);
      logger.debug(`| App is listening on port ${PORT}         |`);
      logger.debug('+---------------------------------------+');
      logger.info(`try sending a request to localhost:${PORT}/health to verify server is running`);
    });

    // Add error handler for the server
    server.on('error', (error) => {
      logger.error('Server error:', error);
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error("Failed to start the server:", error.message);
    process.exit(1);
  }
};

// Initialize server
startServer();
