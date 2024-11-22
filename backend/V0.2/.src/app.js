const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const Utils = require("./utilities/Utils");
const routes = require("./routes");
const mdw = require("./middlewares/Middlewares");
const appConfigs = require("./configs/AppConfigs");

const NODE_ENV = appConfigs.environment;
const { Logger, formatResponse } = Utils;
const logger = Logger("app");
const app = express();
const isDev = NODE_ENV === "development";


// Middleware to parse JSON
// and set the limit for JSON and URL-encoded requests
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// Request logger middleware
app.use(mdw.requestLogger);

//TODO -  Set connection timeout to 10 seconds
app.disable("x-powered-by");

/**
 * Apply rate limiter in production
 */
if (!isDev) {
  app.use(mdw.rateLimiter(15 * 60 * 1000, 100));
}

// Serve static files from the frontend build directory
// app.use("/", express.static(path.join(__dirname, "./frontend_build")));

// Health check endpoint (before other routes)
app.get("/health", mdw.healthCheck);

// API Routes
app.use("/api/v0.2", routes);
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

// Global response handler
app.use(mdw.responseHandler);

// Error handling middleware
app.use(mdw.errorHandler);


module.exports = app;

