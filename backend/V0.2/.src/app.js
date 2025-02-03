const startTime = Date.now();

const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
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

app.use(mdw.validateRequest);
// Apply CORS before other middleware
app.use(mdw.corsMiddleware);

// For preflight requests
app.options('*', mdw.corsMiddleware);

// Middleware to parse JSON
// and set the limit for JSON and URL-encoded requests
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// Request logger middleware
app.use(mdw.requestLogger);
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
  app.use(mdw.rateLimiter(15 * 60 * 1000, 100));
}


// Health check endpoint (before other routes)
app.get("/health", mdw.healthCheck);

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

