const express = require('express');
const path = require('path');
require('dotenv').config();
const Utils = require('./utilities/Utils');
const PgClient = require('./models/PgClient');
const routes = require('./routes');
const mdw = require('./middlewares/Middlewares');

const NODE_ENV = process.env.NODE_ENV;
const logger = Utils.Logger('index');
const app = express();
const isDev = NODE_ENV === 'development';

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
module.exports = app;
