const express = require('express');
const path = require('path');
require('dotenv').config();
const Utils = require('./utilities/Utils');
const PgClient = require('./models/PgClient');
const routes = require('./routes');
const mdw = require('./middlewares/Middlewares');

const logger = Utils.Logger('index');
const app = express();
const PORT = process.env.APP_PORT || 3000;
const isDev = process.env.NODE_ENV === 'development';

// Middleware to parse JSON
app.use(express.json());
app.disable('x-powered-by');

/**
 * Apply rate limiter in production
 */
if (!isDev) {
    app.use(mdw.rateLimiter(15 * 60 * 1000, 100));  // Apply rate limiter with default values
}

/**
 * Request logger middleware
 */
app.use((req, res, next) => {
    const { ip, method, path: requestPath, body } = req;

    logger.info(`Incoming Request: ${ip} => ${method} ${requestPath} with body: ${JSON.stringify(body || 'empty')}`);
    res.on('finish', () => {
        logger.info(`Outgoing Response: ${requestPath} => ${res.statusCode} ${res.statusMessage} => ${ip}`);
        logger.debug('');
    });
    next();
});


// Serve static files from the frontend build directory
app.use('/', express.static(path.join(__dirname, './frontend_build')));

// API Routes
app.use('/api/v0.2', routes);
app.get('/api', (req, res) => {
    res.send('You are connected to the /api');
});

// Global response handler
app.use(mdw.responseHandler);

// Error handling middleware
app.use(mdw.errorHandler);

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
            logger.info(isDev ? 'Starting server in development mode...' : 'Starting server in production mode...');
        });
    } catch (error) {
        logger.error('Failed to start the server:', error.message);
        process.exit(1); // Exit process if server fails to start
    }
};

// Initialize server
startServer();
