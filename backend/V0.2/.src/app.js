const express = require('express');
const path = require('path');
const Utils = require('./utilities/Utils');
const routes = require('./routes');
const mdw = require('./middlewares/Middlewares');
const appConfigs = require('./configs/AppConfigs')

const NODE_ENV = appConfigs.environment;
const { Logger, formatResponse } = Utils;
const logger = Logger('app');
const app = express();
const isDev = NODE_ENV === 'development';

// Middleware to parse JSON
// todo - add limit size and timeout
// Increase the limit for JSON and URL-encoded requests
app.use(express.json({ limit: '10mb' })); // Set the limit as per your needs
// app.use(express.urlencoded({ limit: '10mb', extended: true }));

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
    logger.info('entering the routing for ' + req.method + ' ' + req.url);
    const { ip, method, path: requestPath, body } = req;

    // Prepare the body for logging
    let logBody;
    if (body && body.base64Image) {
        // Truncate the base64Image value to show only the first 50 characters
        logBody = { ...body, base64Image: `${body.base64Image.substring(0, 50)}... [truncated]` };
    } else {
        logBody = body;
    }

    // Log the incoming request with the truncated body if necessary
    logger.info(`Incoming Request: ${ip} => ${method} ${requestPath} with body: ${logBody ? JSON.stringify(logBody) : 'empty'}`);

    // Log the outgoing response when it's finished
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
app.get('/api', (req, res, next) => {
    req.formattedResponse = formatResponse(200, 'you are connected to the /api, running in Environment: ' + NODE_ENV, null);
    next();
});

// Global response handler
app.use(mdw.responseHandler);

// Error handling middleware
app.use(mdw.errorHandler);
module.exports = app;
