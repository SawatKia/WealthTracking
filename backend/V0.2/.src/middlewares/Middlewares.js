const multer = require('multer');
const fs = require('fs');
const path = require('path');
const APP_ROOT = '/usr/src/WealthTrack';
const cors = require('cors');

const { Logger, formatResponse } = require("../utilities/Utils");
const MyAppErrors = require("../utilities/MyAppErrors");
const appConfigs = require("../configs/AppConfigs");
const AuthUtils = require('../utilities/AuthUtils');
const { json } = require('express');

// Custom storage engine that combines memory and disk storage
class CustomStorage {
  constructor(options) {
    this.diskStorage = multer.diskStorage({
      destination: options.destination,
      filename: options.filename
    });
    this.memoryStorage = multer.memoryStorage();
  }

  _handleFile(req, file, cb) {
    // First, store in memory
    this.memoryStorage._handleFile(req, file, (memoryError, memoryInfo) => {
      if (memoryError) return cb(memoryError);

      // Keep the buffer in the file object
      file.buffer = memoryInfo.buffer;

      // Then, store on disk
      this.diskStorage._handleFile(req, file, (diskError, diskInfo) => {
        if (diskError) return cb(diskError);

        // Log message to show file was saved to disk at <path>
        logger.debug(`File saved to disk at ${diskInfo.path}`);

        // Combine memory and disk info
        cb(null, {
          ...diskInfo,
          buffer: memoryInfo.buffer
        });
      });
    });
  }

  _removeFile(req, file, cb) {
    this.diskStorage._removeFile(req, file, cb);
  }
}

// Create storage instance
const hybridSlipStorage = new CustomStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(APP_ROOT, 'uploads/slip-images/');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      logger.debug(`Created directory for slip images at ${uploadDir}`);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${req.user.sub}-${file.originalname}`);
  }
});

// Create multer instance with hybrid storage
const uploadSlip = multer({
  storage: hybridSlipStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// const slipToDiskStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadDir = path.join(APP_ROOT, 'uploads/slip-images/');
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${req.user.sub}-${file.originalname}`);
//   }
// });
const profilePictureToDiskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(APP_ROOT, 'uploads/profile-pictures/');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      logger.debug(`Created directory for profile pictures at ${uploadDir}`);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${req.user.sub}-${file.originalname}`);
  }
});
// const uploadSlipToDisk = multer({ storage: slipToDiskStorage });
const uploadProfilePictureToDisk = multer({ storage: profilePictureToDiskStorage });
const { verifyToken } = AuthUtils;
const logger = Logger("Middlewares");
const NODE_ENV = appConfigs.environment;

class Middlewares {
  constructor() {
    this.healthCheck = this.healthCheck.bind(this);
    this.formatUptime = this.formatUptime.bind(this);

    // Add CORS configuration
    this.corsOptions = {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin) {
          return callback(null, true);
        }

        const allowedOrigins = [
          // Add your allowed origins here
          'http://localhost:3000',          // Development
          'exp://localhost:19000',          // Expo development server
          'exp://192.168.x.x:19000', // Local network IP for mobile device testing
          // 'https://your-production-domain.com', // Production web client
          // 'capacitor://localhost',          // Capacitor/Ionic
          // 'ionic://localhost',              // Ionic specific
        ];

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-Refresh-Token', // For refresh token
        'Accept',
      ],
      credentials: true, // Allow credentials (cookies)
      maxAge: 86400, // Cache preflight requests for 24 hours
      exposedHeaders: ['Content-Length', 'X-Rate-Limit'] // Headers that can be exposed to the client
    };

    // Create CORS middleware
    this.corsMiddleware = cors(this.corsOptions);
  }

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

    const formatObjectEntries = (obj, lengthLimit = 50) => {
      return Object.entries(obj)
        .map(([key, value]) => {
          const displayValue = value && String(value).length > lengthLimit
            ? `${String(value).substring(0, lengthLimit)}... [truncated]`
            : String(value);
          return `${key.padEnd(26)}: ${displayValue}`;
        })
        .join('\n          ');
    }

    // Prepare a human-friendly log message
    const requestLogMessage = `
      Incoming Request:
      ----------------
      ${ip} => ${method} ${requestPath}
      Headers:
          ${formatObjectEntries(headers)}
      Cookies:
          ${formatObjectEntries(req.cookies)}
      Body: ${logBody ? JSON.stringify(logBody, null, 6).replace(/^/gm, '      ') : 'Empty'}
      Query: ${query ? JSON.stringify(query, null, 6).replace(/^/gm, '      ') : 'Empty'}
      `;

    logger.info(requestLogMessage);
    next();
  }

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

  conditionalSlipUpload(req, res, next) {
    if (req.is('multipart/form-data')) {
      return uploadSlip.single('imageFile')(req, res, next);
    }
    next();
  };

  conditionalProfilePictureUpload(req, res, next) {
    if (req.is('multipart/form-data')) {
      return uploadProfilePictureToDisk.single('profilePicture')(req, res, next);
    }
    next();
  };

  /**
 * Health check middleware to check the health of the server
 * 
 * it provides:
 * 
 * - the current time in Bangkok
 * - the uptime of the server
 * - the environment
 */
  healthCheck(req, res, next) {
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
        uptime: this.formatUptime(process.uptime()) || process.uptime(),
        environment: appConfigs.environment
      }
    );
    next();
  };

  /**
 * Helper method to log response details
 */
  logResponse = (req, status_code, message, data, headers = {}, isError = false) => {
    const securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Content-Security-Policy': `default-src '${req.path === '/users/profile-picture' ? 'self; img-src data: blob:' : 'self'}'`,
      ...headers
    };

    const formatObjectEntries = (obj, lengthLimit = 50) => {
      return Object.entries(obj)
        .map(([key, value]) => {
          const displayValue = value && String(value).length > lengthLimit
            ? `${String(value).substring(0, lengthLimit)}... [truncated]`
            : String(value);
          return `${key.padEnd(26)}: ${displayValue}`;
        })
        .join('\n          ');
    }


    const responseLogMessage = `
      ${isError ? 'Error Response:' : 'Outgoing Response:'}
      Headers:
          ${formatObjectEntries(securityHeaders)}
      ------------------
      ${req.method} ${req.path} => ${req.ip}
      Status: ${status_code}
      Message: ${message}
      Data: ${data ? JSON.stringify(data, null, 8).substring(0, 550) + (JSON.stringify(data, null, 8).length > 550 ? '...[truncated]...' : '') : ''}
      `;
    const endingMessage = "=".repeat(10) + "End of response: " + `${status_code} => ${req.ip}` + "=".repeat(10);

    logger[isError ? 'error' : 'debug'](responseLogMessage + endingMessage);
    return securityHeaders;
  }

  responseHandler = (req, res, next) => {
    logger.info("Handling response");
    let securityHeaders = {};
    let status_code = 500;
    let message = 'Internal Server Error';
    let headers = {};
    let data = null;

    if (req.formattedResponse) {
      ({ status_code, message, data, headers } = req.formattedResponse);
      securityHeaders = this.logResponse(req, status_code, message, data, headers);
    } else {
      logger.warn('Response not formatted in req.formattedResponse');
      logger.warn('Sending an empty response');
      res.send();
      return;
    }

    res.set(securityHeaders).status(status_code).json(formatResponse(status_code, message, data));
    return;
  }

  errorHandler = (err, req, res, next) => {
    logger.info("Handling error");
    if (!res.headersSent) {
      let response;
      if (err instanceof MyAppErrors) {
        logger.error(`MyAppError: ${err.message}`);
        logger.error(`stack: ${err.stack}`);
        response = formatResponse(err.statusCode, err.message, err.data);
      } else if (err instanceof SyntaxError) {
        response = formatResponse(400, "Invalid Syntax: " + err.message);
        logger.error(`SyntaxError: ${err.message}`);
        logger.error(`stack: ${err.stack}`);
        if (err.message.includes('JSON')) {
          response = formatResponse(400, "Invalid JSON format: " + err.message);
        }
      } else if (err instanceof Error) {
        logger.error(`Error: ${err.message}`);
        logger.error(`stack: ${err.stack}`);
        response = formatResponse(500, err.message);
      } else {
        logger.error(`Unhandled error: ${err}`);
        logger.error(`stack: ${err.stack}`);
        response = formatResponse(500, "Internal Server Error");
      }

      const securityHeaders = this.logResponse(
        req,
        response.status_code,
        response.message,
        response.data,
        err.headers || {},
        true
      );

      res
        .status(response.status_code)
        .set({ ...securityHeaders, ...(err.headers || {}) })
        .json(response);
      return;
    }
  }

  unknownRouteHandler(req, res, next) {
    logger.info('Checking if the route is unknown...');
    if (!req.formattedResponse) {
      logger.error(`Unknown route: ${req.method} ${req.url}`);
      next(MyAppErrors.notFound(`${req.method} ${req.url} not found`));
    } else {
      logger.info('route was handled and returned a response');
    }
    next();
  }

  formatUptime(seconds) {
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


}

module.exports = new Middlewares();
