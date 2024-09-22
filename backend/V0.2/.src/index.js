const app = require('./app');
const Utils = require('./utilities/Utils');
const appConfigs = require('./configs/AppConfigs');
const pgClient = require('./models/PgClient');
const FiModel = require('./models/FinancialInstitutionModel');

const NODE_ENV = appConfigs.environment;
const { Logger, formatResponse } = Utils;
const logger = Logger('Index');
const PORT = appConfigs.appPort || 3000;
/**
 * Function to start the server
 */
const startServer = async () => {
    logger.info('Starting server...');
    try {
        logger.info('Connecting to database...');

        pgClient.isConnected() ? logger.info('Database connected') : await pgClient._init();

        const fi = new FiModel();
        await fi.initializeData();

        // Start Express server after database connection is established
        app.listen(PORT, '0.0.0.0', () => {
            logger.info(`Environment: ${NODE_ENV}`);
            logger.info(`App is listening on port ${PORT}`);
        });
    } catch (error) {
        logger.error('Failed to start the server:', error.message);
        process.exit(1); // Exit process if server fails to start
    }
};

// Initialize server
startServer();
