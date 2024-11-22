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

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (remainingSeconds > 0) parts.push(`${remainingSeconds}s`);

  return parts.join(' ') || seconds;
}

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
app.get("/health", (req, res, next) => {
  const bkkTime = new Date().toLocaleString('en-GB', {
    timeZone: 'Asia/Bangkok',
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  req.formattedResponse = formatResponse(
    200,
    "you are connected to the /health, running in Environment: " + NODE_ENV,
    {
      status: "healthy",
      timestamp: bkkTime,
      uptime: formatUptime(process.uptime()),
      environment: NODE_ENV
    }
  );
  next();
});

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

// Set connection timeout to 5 seconds
app.use((req, res, next) => {
  res.setTimeout(5000, () => {
    res.status(408).json({
      status: "error",
      message: "Request timeout"
    });
  });
  next();
});

// Global response handler
app.use(mdw.responseHandler);

// Error handling middleware
app.use(mdw.errorHandler);


module.exports = app;

