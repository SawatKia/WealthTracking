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
 * Function to start the server
 */
const startServer = async () => {
  logger.info("=".repeat(20) + " Starting server " + "=".repeat(20));
  try {
    logger.info("Connecting to database...");

    pgClient.isConnected() ? logger.info("Database connected") : await pgClient.init();
    easySlip.init();
    await ollama.init();

    const fi = new FiModel();
    await fi.initializeData();

    await tesseractService.initializeScheduler();

    // Start Express server after database connection is established
    const server = app.app.listen(PORT, () => {
      const endTime = Date.now(); // End the timer
      const timeTaken = endTime - app.startTime; // Calculate time taken

      logger.debug('┌──────────────────────────────────────────┐');
      logger.debug('│       Server started successfully        │');
      logger.debug('├──────────────────────────────────────────┤');
      logger.debug(`│ Environment: ${NODE_ENV.padEnd(28)}│`);
      logger.debug(`│ App is listening on port ${PORT.toString().padEnd(16)}│`);
      logger.debug(`│ Server startup time: ${timeTaken} ms`.padEnd(43) + '│');
      logger.debug('└──────────────────────────────────────────┘');
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
