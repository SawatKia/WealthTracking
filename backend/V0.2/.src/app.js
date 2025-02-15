const startTime = Date.now();
const express = require("express");
const cookieParser = require("cookie-parser");
const swaggerUi = require('swagger-ui-express');
const fs = require("fs")
const YAML = require('yaml')
const path = require('path');

const Utils = require("./utilities/Utils");
const routes = require('./routes');
const mdw = require("./middlewares/Middlewares");
const appConfigs = require("./configs/AppConfigs");

const NODE_ENV = appConfigs.environment;
const { Logger, formatResponse } = Utils;
const logger = Logger("app");
const app = express();
const isDev = NODE_ENV === "development";

logger.info(`timer started at ${new Date(startTime).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok' })}`);
logger.warn(`Imports completed after ${Date.now() - startTime}ms`);

app.enable('trust proxy');

// Health check endpoint (before other routes)
app.get("/health", mdw.healthCheck);

if (NODE_ENV === 'development' || NODE_ENV === 'test') {
  logger.info('Starting Swagger documentation setup...');
  try {
    // 1. First serve the Swagger UI assets
    app.use('/api/v0.2/docs', swaggerUi.serve);
    const swaggerPath = path.join(__dirname, './swagger.yaml');
    const swaggerFile = fs.readFileSync(swaggerPath, 'utf8');
    const swaggerDocument = YAML.parse(swaggerFile);

    // 2. Then setup the Swagger UI endpoint
    app.get('/api/v0.2/docs', swaggerUi.setup(swaggerDocument, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        url: '/api/v0.2/docs',
        docExpansion: 'none'
      }
    }));

    logger.debug('Swagger documentation setup completed');
  } catch (error) {
    logger.error(`Failed to setup Swagger documentation: ${error.message}`);
    logger.error(`Stack trace: ${error.stack}`);
  }
}

// Apply CORS before other middleware
app.use(mdw.corsMiddleware);

// For preflight requests
app.options('*', mdw.corsMiddleware);

// Middleware to parse JSON and set the limit for JSON and URL-encoded requests
// JSON parser with error handling
app.use(express.json({ limit: "10mb" }), mdw.errorHandler);
app.use(cookieParser());

// Request logger middleware
app.use(mdw.requestLogger);

const allowedMethods = {
  //app.js
  '/health': ['GET'],
  '/favicon.ico': ['GET'],
  '/api': ['GET'],
  '/api/test-timeout': ['GET'],
  //routes.js
  '/api/v0.2/': ['GET'],
  '/api/v0.2/users': ['GET', 'POST', 'PATCH', 'DELETE'],
  '/api/v0.2/banks': ['POST', 'GET'],
  '/api/v0.2/banks/:account_number/:fi_code': ['GET', 'PATCH', 'DELETE'],
  '/api/v0.2/debts': ['GET', 'POST', 'PATCH', 'DELETE'],
  '/api/v0.2/debts/:debt_id': ['GET', 'PATCH', 'DELETE'],
  '/api/v0.2/debts/:debt_id/payments': ['GET'],
  '/api/v0.2/slip/quota': ['GET'],
  '/api/v0.2/slip': ['POST'],
  '/api/v0.2/slip/verify': ['POST', 'GET'],
  '/api/v0.2/cache': ['POST'],
  '/api/v0.2/cache/:key': ['GET', 'DELETE'],
  '/api/v0.2/login': ['POST'],
  '/api/v0.2/refresh': ['POST'],
  '/api/v0.2/logout': ['POST'],
  '/api/v0.2/google/login': ['POST'],
  '/api/v0.2/google/callback': ['GET'],
  '/api/v0.2/transactions': ['GET', 'POST'],
  '/api/v0.2/transactions/list/types': ['GET'],
  '/api/v0.2/transactions/summary/monthly': ['GET'],
  '/api/v0.2/transactions/summary/month-expenses': ['GET'],
  '/api/v0.2/transactions/account/:account_number/:fi_code': ['GET'],
  '/api/v0.2/transactions/:transaction_id': ['GET', 'PATCH', 'DELETE'],
  '/api/v0.2/budgets': ['GET', 'POST'],
  '/api/v0.2/budgets/types': ['GET'],
  '/api/v0.2/budgets/history': ['GET'],
  '/api/v0.2/budgets/:expenseType': ['PATCH', 'DELETE'],
}

if (NODE_ENV != 'production') {
  allowedMethods['/api/v0.2/fis'] = ['GET'];
  allowedMethods['/api/v0.2/fi/:fi_code'] = ['GET'];
  allowedMethods['/api/v0.2/fis/operating-banks'] = ['GET'];
  allowedMethods['/api/v0.2/cache'] = ['GET', 'POST'];
  allowedMethods['/api/v0.2/cache/:key'] = ['GET', 'DELETE'];
}

// Global middleware setup
app.use(async (req, res, next) => {
  try {
    // First validate the method
    logger.info("Validating method...");
    await mdw.methodValidator(allowedMethods)(req, res, next);
  } catch (error) {
    logger.error(`Failed to validate method: ${error.message}`);
    next(error);
  }
});


// CORS Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  if (err.message === 'Not allowed by CORS') {
    res.status(403).json({
      status: "error",
      message: "Not allowed by CORS"
    });
  } else {
    next(err);
  }
});

app.disable("x-powered-by");

/**
 * Apply rate limiter in production
 */
if (!isDev) {
  // 3reqs per 5secs
  app.use(mdw.rateLimiter(5 * 1000, 3));
}


// Health check endpoint (before other routes)
app.get("/health", mdw.healthCheck);

app.get('/favicon.ico', (req, res, next) => {
  const faviconPath = path.join(__dirname, '../statics/favicon.ico');
  req.fileResponse = faviconPath;
  next();
});
// API Routes
// Modify the routes setup:
try {
  app.use("/api/v0.2", routes);
} catch (error) {
  logger.error(`Failed to setup API routes: ${error.message}`);
  logger.error(`Stack trace: ${error.stack}`);
  process.exit(1);
}
app.get("/api", (req, res, next) => {
  req.formattedResponse = formatResponse(
    200,
    "you are connected to the /api, running in Environment: " + NODE_ENV,
    null
  );
  next();
});

// Set connection timeout to 3 seconds
app.use((req, res, next) => {
  res.setTimeout(3000, () => {
    res.status(408).json({
      status: "error",
      message: "Request timeout"
    });
  });
  next();
});

app.get("/api/test-timeout", (req, res) => {
  setTimeout(() => { // send a response after 5 seconds
    if (res.headersSent) return;
    res.json({ message: "This should never be sent due to timeout in 3 seconds" });
  }, 5000);
});

// Error handling middleware
app.use(mdw.errorHandler);

// Global response handler
app.use(mdw.responseHandler);

module.exports = { app, startTime };
