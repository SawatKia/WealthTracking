const multer = require('multer');

const Utils = require("../utilities/Utils");
const MyAppErrors = require("../utilities/MyAppErrors");
const appConfigs = require("../configs/AppConfigs");
const AuthController = require("../controllers/AuthController");
const { json } = require('express');

const upload = multer({ storage: multer.memoryStorage() });
const authController = new AuthController();
const { Logger, formatResponse } = Utils;
const logger = Logger("Middlewares");
const NODE_ENV = appConfigs.environment;

class Middlewares {
  /**
   * Middleware to validate the allowed methods for a specific path
   * @param {Object} allowedMethods - Object with allowed methods for each path
   * @returns {Function} - Express middleware function
   */
  methodValidator(allowedMethods) {
    return (req, res, next) => {
      logger.debug(`allowedMethods: ${JSON.stringify(allowedMethods)}`);
      const { method } = req;
      const path = req.path;

      logger.info("Validating request method and path");
      logger.debug(`Request: Method=${method}, Path=${path}`);
      logger.debug(`Environment: ${NODE_ENV}`);

      // Helper function to match dynamic paths
      const matchPath = (incomingPath) => {
        for (const allowedPath in allowedMethods) {
          const pathRegex = new RegExp(
            `^${allowedPath.replace(/:[^/]+/g, "[^/]+")}$`
          );
          if (pathRegex.test(incomingPath)) {
            return allowedPath;
          }
        }
        return null;
      };

      // Match incoming path against allowed paths
      const matchedPath = matchPath(path);

      logger.debug(`Matched path: ${matchedPath}`);

      // Check if a matching path exists in allowedMethods
      if (!matchedPath) {
        logger.error(`Path ${path} not found`);
        return next(MyAppErrors.notFound(`${path} not available`));
      }

      // Validate the method for the matched path
      const methods = allowedMethods[matchedPath];
      if (!methods.includes(method)) {
        logger.error(`Method ${method} not allowed for ${path}`);
        const errorMessage =
          NODE_ENV === "production"
            ? "Method not allowed"
            : `${method} method not allowed for ${path}`;
        return next(MyAppErrors.methodNotAllowed(errorMessage));
      }

      logger.info(`Method ${method} is allowed for ${path}`);
      return next();
    };
  }

  /**
   * Middleware to handle API responses in a consistent format
   */
  responseHandler(req, res, next) {
    logger.info("Handling response");
    if (req.formattedResponse) {
      const { status_code, message, data, headers } = req.formattedResponse;
      const responseLogMessage = `
      Outgoing Response:
      Headers: ${headers ? JSON.stringify(headers, null, 2) : 'xxx No header xxx'}
      ------------------
      ${req.method} ${req.path} => ${req.ip}
      Status: ${status_code}
      Message: ${message}
      Data: ${data ? JSON.stringify(data, null, 6) : 'No data'}
      `;
      logger.debug(responseLogMessage);
      res.set(headers || {}).status(status_code).json(formatResponse(status_code, message, data));
    } else {
      next();
    }
  }

  /**
   * Middleware to handle errors in a consistent format
   */
  errorHandler(err, req, res, next) {
    if (!res.headersSent) {
      logger.info("Handling error");
      let response;
      if (err instanceof MyAppErrors) {
        logger.error(`MyAppError: ${err.message}`);
        response = formatResponse(err.statusCode, err.message, err.data);
      } else if (err instanceof Error) {
        logger.error(`Error: ${err.message}`);
        response = formatResponse(500, err.message);
      } else {
        logger.error(`Unhandled error: ${err}`);
        response = formatResponse(500, "Internal Server Error");
      }
      logger.debug(`sending Error response: ${JSON.stringify(response)}`);
      res
        .status(response.status_code)
        .set(err.headers || {})
        .json(response);
      return;
    }
  }

  /**
   * Rate limiting middleware to prevent too many requests
   */
  rateLimiter(windowMs = 15 * 60 * 1000, limit = 100) {
    return require("express-rate-limit")({
      windowMs,
      limit,
      standardHeaders: true,
      legacyHeaders: false,
      message: "Too many requests from this IP, please try again later.",
      handler: (req, res, next, options) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(options.statusCode).json({
          status: options.statusCode,
          message: options.message,
        });
      },
    });
  }

  conditionalFileUpload(req, res, next) {
    if (req.is('multipart/form-data')) {
      return upload.single('imageFile')(req, res, next);
    }
    next();
  };

  authMiddleware(req, res, next) {
    const accessToken = req.cookies['access_token'];

    if (appConfigs.environment === 'test') {
      next();
      return;
    }
    if (accessToken) {
      authController.verifyToken(accessToken, appConfigs.accessTokenSecret, (err, user) => {
        if (err) {
          return next(err);
        }
        req.user = user; // Attach user info to request
        next();
      });
    } else {
      logger.warn('No access token provided');
      next(MyAppErrors.unauthorized('Authentication token is missing'));
    }
  }

  /**
   * Request logger middleware to log incoming requests in a consistent format
   */
  requestLogger(req, res, next) {
    logger.info(`entering the routing for ${req.method} ${req.url}`);
    const { ip, method, path: requestPath, body, headers, query } = req;

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
    Cookies: 
      ${Object.keys(req.cookies)
        .map(key => `${key}: ${req.cookies[key]?.substring(0, 20) || 'undefined'}...`)
        .join('\n      ')}
    Body: ${logBody ? JSON.stringify(logBody, null, 6) : 'Empty'}
    Query: ${query ? JSON.stringify(query, null, 6) : 'Empty'}
    `;

    logger.info(requestLogMessage);
    next();
  }
}

module.exports = new Middlewares();
