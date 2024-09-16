const app = require('./app');
const Utils = require('./utilities/Utils');
require('dotenv').config();

const NODE_ENV = process.env.NODE_ENV;
const logger = Utils.Logger('index');
const PgClient = require('./models/PgClient');
const PORT = process.env.APP_PORT || 3000;
/**
 * Function to start the server
 */
const startServer = async () => {
    logger.info('Starting server...');
    try {
        logger.info('Connecting to database...');
        const pgClient = new PgClient();
        await pgClient.init();

        // Start Express server after database connection is established
        app.listen(PORT, '0.0.0.0', () => {
            logger.info(`App is listening on port ${PORT}`);
            logger.info(`Environment: ${NODE_ENV}`);
        });
    } catch (error) {
        logger.error('Failed to start the server:', error.message);
        process.exit(1); // Exit process if server fails to start
    }
};

// Initialize server
startServer();
