const multer = require('multer');
const fs = require('fs');
const path = require('path');
const APP_ROOT = '/usr/src/WealthTrack';

const Utils = require("../utilities/Utils");
const MyAppErrors = require("../utilities/MyAppErrors");
const appConfigs = require("../configs/AppConfigs");
const AuthUtils = require('../utilities/AuthUtils');
const { json } = require('express');

const slipToDiskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(APP_ROOT, 'uploads/slip-images/');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${req.user.sub}-${file.originalname}`);
  }
});
const profilePictureToDiskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(APP_ROOT, 'uploads/profile-pictures/');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${req.user.sub}-${file.originalname}`);
  }
});
const uploadSlipToDisk = multer({ storage: slipToDiskStorage });
const uploadProfilePictureToDisk = multer({ storage: profilePictureToDiskStorage });
const { verifyToken } = AuthUtils;
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

      res.set(headers).status(status_code).json(formatResponse(status_code, message, data));
    } else {
      next();
    }
  }

  /**
   * Middleware to handle errors in a consistent format
   */
  errorHandler(err, req, res, next) {
    logger.info("Handling error");
    if (!res.headersSent) {
      let response;
      if (err instanceof MyAppErrors) {
        logger.error(`MyAppError: ${err.message}`);
        logger.error(`stack: ${err.stack}`);
        response = formatResponse(err.statusCode, err.message, err.data);
      } else if (err instanceof Error) {
        logger.error(`Error: ${err.message}`);
        logger.error(`stack: ${err.stack}`);
        response = formatResponse(500, err.message);
      } else {
        logger.error(`Unhandled error: ${err}`);
        logger.error(`stack: ${err.stack}`);
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

  conditionalSlipUpload(req, res, next) {
    if (req.is('multipart/form-data')) {
      return uploadSlipToDisk.single('imageFile')(req, res, next);
    }
    next();
  };

  conditionalProfilePictureUpload(req, res, next) {
    if (req.is('multipart/form-data')) {
      return uploadProfilePictureToDisk.single('profilePicture')(req, res, next);
    }
    next();
  };

  authMiddleware(req, res, next) {
    logger.info("Authenticating user");

    // Check for token in both cookie and Authorization header
    const accessToken = req.cookies['access_token'] || req.headers.authorization?.split(' ')[1];

    logger.debug(`accessToken: ${accessToken ? accessToken.substring(0, 20) + '...' : 'Not present'}`);

    if (accessToken) {
      try {
        const user = verifyToken(accessToken, appConfigs.accessTokenSecret);
        req.user = user;
        logger.info(`User authenticated(req.user): ${JSON.stringify(req.user, null, 2)}`);
        next();
      } catch (err) {
        logger.warn('Invalid access token');
        next(MyAppErrors.unauthorized(
          AuthUtils.authenticationError.message,
          null,
          AuthUtils.authenticationError.headers
        ));
      }
    } else {
      logger.warn('No access token provided');
      next(MyAppErrors.unauthorized(
        AuthUtils.authenticationError.message,
        null,
        AuthUtils.authenticationError.headers
      ));
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
      logBody = {
        ...body,
        base64Image: `${body.base64Image.substring(0, 50)}... [truncated]`,
      };
    } else {
      logBody = body;
    }

    // Format headers with truncated values
    const formattedHeaders = Object.entries(headers)
      .map(([key, value]) => {
        const truncatedValue = value && value.length > 50
          ? `${value.substring(0, 50)}... [truncated]`
          : value;
        return `      ${key.padEnd(16)}: ${truncatedValue}`;
      })
      .join('\n');

    // Prepare a human-friendly log message
    const requestLogMessage = `
    Incoming Request:
    ----------------
    ${ip} => ${method} ${requestPath}
    Headers:
${formattedHeaders}
    Cookies: 
      ${Object.keys(req.cookies)
        .map(key => {
          const cookieValue = req.cookies[key];
          const displayValue = typeof cookieValue === 'string'
            ? cookieValue.substring(0, 50)
            : String(cookieValue);
          return `${key}: ${displayValue}...`;
        })
        .join('\n      ')}
    Body: ${logBody ? JSON.stringify(logBody, null, 6) : 'Empty'}
    Query: ${query ? JSON.stringify(query, null, 6) : 'Empty'}
    `;

    logger.info(requestLogMessage);
    next();
  }

  unknownRouteHandler(req, res, next) {
    logger.info('Checking if the route is unknown...');
    if (!req.formattedResponse) {
      logger.error(`Unknown route: ${req.method} ${req.url}`);
      next(MyAppErrors.notFound(`${req.method} ${req.url} not found`));
    }
    next();
  }
}

module.exports = new Middlewares();
