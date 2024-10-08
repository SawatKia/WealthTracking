const express = require("express");
const path = require("path");
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
// Increase the limit for JSON and URL-encoded requests
app.use(express.json({ limit: "10mb" })); // Set the limit as per your needs
// app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.disable("x-powered-by");

/**
 * Apply rate limiter in production
 */
if (!isDev) {
  app.use(mdw.rateLimiter(15 * 60 * 1000, 100)); // Apply rate limiter with default values
}
/**
 * Request logger middleware
 */
app.use((req, res, next) => {
  logger.info("entering the routing for " + req.method + " " + req.url);
  const { ip, method, path: requestPath, body, headers } = req;

  // Prepare the body for logging 
  let logBody;
  if (body && body.base64Image) {
    // Truncate the base64Image value to show only the first 50 characters
    logBody = {
      ...body,
      base64Image: `${body.base64Image.substring(0, 50)}... [truncated]`,
    };
  } else {
    logBody = body;
  }

  // Log the incoming request with the truncated body if necessary
  // Prepare a human-friendly log message
  const requestLogMessage = `
    Incoming Request:
    ----------------
    ${ip} => ${method} ${requestPath}
    Headers:
      Host: ${headers.host}
      Authorization: ${headers.authorization ? headers.authorization.substring(0, 20) + '...' : 'Not present'}
      Content-Type: ${headers['content-type']}
      Content-Length: ${headers['content-length']}
    Body: ${logBody ? JSON.stringify(logBody, null, 6) : 'Empty'}
  `;

  // Log the formatted message
  logger.info(requestLogMessage);

  // Log the outgoing response when it's finished
  res.on("finish", () => {
    // Prepare a human-friendly log message for the response
    const responseLogMessage = `
    Outgoing Response:
    ------------------
    ${method} ${requestPath} => ${ip}
    Status: ${res.statusCode} ${res.statusMessage}
    Data: ${res.data ? JSON.stringify(res.data, null, 2) : 'No data'}
    `;

    // Log the formatted response message
    logger.info(responseLogMessage);
    logger.debug("");
  });

  next();
});

// Serve static files from the frontend build directory
app.use("/", express.static(path.join(__dirname, "./frontend_build")));

// API Routes
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});
app.use("/api/v0.2", routes);
app.get("/api", (req, res, next) => {
  req.formattedResponse = formatResponse(
    200,
    "you are connected to the /api, running in Environment: " + NODE_ENV,
    null
  );
  next();
});

// Global response handler
app.use(mdw.responseHandler);

// Error handling middleware
app.use(mdw.errorHandler);
module.exports = app;
