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
   * This middleware function validates the HTTP method and path of the incoming
   * request against a set of allowed methods and paths. If the request is valid,
   * it calls the next middleware function in the chain. If the request is invalid,
   * it returns a 400, 405, or 404 error depending on the specific error.

   * The validation is case-insensitive and allows for URL parameters. The
   * validation is also performed after sanitizing the request data to prevent
   * any potential security issues.

   * @param {Object} allowedMethods - An object containing the allowed methods
   *                                   for each path. The keys are the paths
   *                                   and the values are arrays of allowed
   *                                   methods.
   * @returns {Function} - The middleware function to validate the request.
   */
  methodValidator(allowedMethods) {
    // Common patterns that should not be sanitized
    // const skipPatterns = {
    //   'phone': /^\+?[\d\s()-]{8,}$/,
    //   /* Explanation:
    //   \+? - optional plus sign for international numbers
    //   [\d\s()-] - can contain digits, spaces, parentheses, hyphens
    //   {8,} - at least 8 characters long
    //   Examples that match:
    //   - +1 (555) 123-4567
    //   - 555-123-4567
    //   - 5551234567
    //   */

    //   'name': /^[\p{L}\s'-]{2,}$/u,
    //   /* Explanation:
    //   \p{L} - any kind of letter from any language
    //   \s - spaces
    //   '- - apostrophes and hyphens for names like O'Connor or Jean-Pierre
    //   Examples that match:
    //   - John Doe
    //   - María José
    //   - O'Connor
    //   - Jean-Pierre
    //   */

    //   'date': /^\d{4}-\d{2}-\d{2}$/,
    //   /* Explanation:
    //   \d{4} - four digits for the year
    //   \d{2} - two digits for the month
    //   \d{2} - two digits for the day
    //   Matches ISO format dates like:
    //   - 2024-02-14
    //   */

    //   'url': /^https?:\/\/[\w\-.]+(:\d+)?([\/\w\-.?=%&#+]*)?$/,
    //   /* Explanation:
    //   https? - optional protocol (http or https)
    //   :// - literal colon followed by two slashes
    //   [\w\-.]+ - domain name can contain letters, numbers, dots, hyphens
    //   (:\d+)? - optional port number
    //   ([\/\w\-.?=%&#+]*)? - optional path and query string
    //   Matches URLs like:
    //   - http://example.com
    //   - https://sub.domain.com:8080/path?param=value
    //   */

    //   'filename': /^[\w\-. ]+\.[a-zA-Z0-9]{2,4}$/,
    //   /* Explanation:
    //   [\w\-. ]+ - file name can contain letters, numbers, dots, hyphens, spaces
    //   \.[a-zA-Z0-9]{2,4} - file extension
    //   Matches filenames like:
    //   - document.pdf
    //   - my-photo.jpg
    //   - report_2024.xlsx
    //   */

    //   'address': /^[\w\s,.'#-]{5,}$/,
    //   /* Explanation:
    //   [\w\s,.'#-] - address can contain letters, spaces, commas, dots, hashes, and hyphens
    //   {5,} - at least 5 characters long
    //   Matches addresses like:
    //   - 123 Main St, Apt #4
    //   - 45-A West Avenue
    //   */

    //   // User-related patterns
    //   'email': /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}+\.{0,}[a-zA-Z]{0,}$/,
    //   /* Explanation:
    //   ^ - start of string
    //   [a-zA-Z0-9._%+-]+ - username can contain letters, numbers, dots, underscores, percent, plus, minus
    //   @ - literal @ symbol
    //   [a-zA-Z0-9.-]+ - domain name can contain letters, numbers, dots, hyphens
    //   \. - literal dot
    //   [a-zA-Z]{2,} - top-level domain must be at least 2 letters
    //   \.{0,} - optional dot
    //   [a-zA-Z]{0,} - optional subdomain
    //   $ - end of string
    //   */
    //   'national_id': /^[0-9]{13}$/, // For Thai national ID format
    //   'username': /^[\w.-]{3,50}$/, // Alphanumeric with dots and hyphens, 3-50 chars
    //   'profile_picture_uri': /^[\w\/.-]+$/, // For URI paths

    //   // Bank account patterns
    //   'account_number': /^(\d+-)+\d+$/,
    //   /* Explanation:
    //   ^ - start of string
    //   (\d+-)+ - at least one group of digits with a dash
    //   \d+ - at least one group of digits
    //   $ - end of string
    //   */
    //   'fi_code': /^[0-9]+$/, // Financial institution codes

    //   // Transaction patterns
    //   'transaction_id': /^[\w-]{1,50}$/, // Alphanumeric with hyphens
    //   'slip_uri': /^[\w\/.-]+$/, // For URI paths

    //   // Debt patterns
    //   'debt_id': /^[\w-]{1,50}$/, // Alphanumeric with hyphens
    //   'debt_name': /^[\w\s'-]{1,100}$/, // Allow spaces, hyphens, apostrophes

    //   // Money/Amount patterns
    //   'amount': /^\d+(\.\d{1,2})?$/, // Decimal numbers with up to 2 decimal places
    //   'balance': /^\d+(\.\d{1,2})?$/,
    //   'monthly_limit': /^\d+(\.\d{1,2})?$/,

    //   // Date patterns
    //   'date': /^\d{4}-\d{2}-\d{2}$/, // ISO date format (YYYY-MM-DD)
    //   'datetime': /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/, // ISO datetime
    //   'month': /^\d{4}-\d{2}$/,

    //   // Token patterns
    //   'jti': /^[\w-]+$/, // JWT ID format

    //   // Category/Type patterns (for fixed values)
    //   'expense_type': /^(Food|Transport|Travel|Groceries|House|Borrowed|Cure|Pet|Education|Clothes|Cosmetics|Accessories|Insurance|Hobby|Utilities|Vehicle|Fee|Business|Game|Debt Payment|Other Expense)$/,
    //   'auth_service': /^(local|google|facebook|apple)$/,
    //   'role': /^[\w-]{2,20}$/,

    //   // Slip patterns
    //   'payload': /^[\w+=\/-]+$/, // Base64 and URL-safe characters
    //   'trans_ref': /^[\w-]{1,255}$/,
    // };

    // Function to determine if a field should skip sanitization
    const shouldSkipSanitization = (key, value) => {
      logger.info(`Checking if field ${key} should skip sanitization...`);
      // Convert value to string for testing if it's not already a string
      const stringValue = String(value);

      // Handle exact matches first
      if (skipPatterns[key.toLowerCase()] &&
        skipPatterns[key.toLowerCase()].test(stringValue)) {
        logger.debug(`Field ${key} should skip sanitization. by exact match`);
        return true;
      }

      // Handle partial matches (for fields that contain pattern names)
      for (const [pattern, regex] of Object.entries(skipPatterns)) {
        if (key.toLowerCase().includes(pattern) && regex.test(stringValue)) {
          logger.debug(`Field ${key} should skip sanitization. by partial match`);
          return true;
        }
      }

      return false;
    };

    const escapeString = (str) => {
      return String(str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    };

    const sanitizeObject = (obj) => {
      if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
        throw MyAppErrors.badRequest("Invalid request.");
      }

      const sanitized = {};
      for (const key in obj) {
        if (typeof obj[key] === "string") {
          // Skip sanitization for validated patterns
          if (shouldSkipSanitization(key, obj[key])) {
            sanitized[key] = obj[key];
          } else {
            sanitized[key] = escapeString(obj[key]);
          }
        } else if (typeof obj[key] === "object") {
          sanitized[key] = sanitizeObject(obj[key]);
        } else {
          sanitized[key] = obj[key];
        }
      }
      return sanitized;
    };

    return (req, res, next) => {
      try {
        const method = String(req.method || "").toUpperCase().trim();
        let path = String(req.path || "").trim();

        logger.debug(`Validating request: Method=${method}, Path=${path}`);

        // if (req.query && Object.keys(req.query).length > 0) {
        //   logger.debug(`Original query: ${JSON.stringify(req.query)}`);
        //   req.query = sanitizeObject(req.query);
        //   logger.debug(`Normalized query: ${JSON.stringify(req.query)}`);
        // }

        // if (req.body && Object.keys(req.body).length > 0) {
        //   logger.debug(`Original body: ${JSON.stringify(req.body)}`);
        //   req.body = sanitizeObject(req.body);
        //   logger.debug(`Normalized body: ${JSON.stringify(req.body)}`);
        // }

        // if (req.files) {
        //   req.files.forEach((file) => {
        //     logger.debug(`Original file: ${JSON.stringify(file)}`);
        //     logger.debug(`Original file name: ${file.originalname}`);
        //     file.originalname = escapeString(file.originalname);
        //     file.mimetype = escapeString(file.mimetype);
        //     logger.debug(`Normalized file: ${JSON.stringify(file)}`);
        //     logger.debug(`Normalized file name: ${file.originalname}`);
        //   });
        // }

        logger.debug(`Allowed methods: ${JSON.stringify(allowedMethods)}`);

        const matchPath = (incomingPath) => {
          for (const allowedPath in allowedMethods) {
            const escapedPath = escapeString(allowedPath.replace(/:[^/]+/g, "[^/]+"));
            const pathRegex = new RegExp(`^${escapedPath}$`);
            if (pathRegex.test(incomingPath)) {
              return allowedPath;
            }
          }
          return null;
        };

        const matchedPath = matchPath(path);

        logger.debug(`Matched path: ${matchedPath}`);

        if (!matchedPath) {
          if (NODE_ENV !== "production") {
            logger.warn(`Path ${path} not found`);
          }
          return next(MyAppErrors.notFound("Resource not found"));
        }

        if (!allowedMethods[matchedPath].includes(method)) {
          if (NODE_ENV !== "production") {
            logger.warn(`Method ${method} not allowed for ${path}`);
          }
          return next(MyAppErrors.methodNotAllowed("Method not allowed"));
        }

        if (NODE_ENV !== "production") {
          logger.info(`Request method ${method} is allowed for ${path}`);
        }
        next();
      } catch (error) {
        if (error instanceof MyAppErrors) {
          if (NODE_ENV !== "production") {
            logger.error(`Sanitization error: ${error.message}`);
          }
          next(MyAppErrors.badRequest("Invalid request."));
        } else {
          if (NODE_ENV !== "production") {
            logger.error(`Unexpected error during validation: ${error.message}`);
          }
          next(MyAppErrors.internalServerError("An unexpected error occurred"));
        }
      }
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

  requestLogger(req, res, next) {
    logger.info(`🡳🡳🡳 entering the routing for ${req.method} ${req.url}`);

    const getIP = (req) => {
      // req.connection is deprecated
      const conRemoteAddress = req.connection?.remoteAddress;
      // req.socket is said to replace req.connection
      const sockRemoteAddress = req.socket?.remoteAddress;
      // some platforms use x-real-ip
      const xRealIP = req.headers['x-real-ip'];
      // most proxies use x-forwarded-for
      const xForwardedForIP = (() => {
        const xForwardedFor = req.headers['x-forwarded-for'];
        if (xForwardedFor) {
          // The x-forwarded-for header can contain a comma-separated list of
          // IP's. Further, some are comma separated with spaces, so whitespace is trimmed.
          const ips = xForwardedFor.split(',').map((ip) => ip.trim());
          return ips[0];
        }
      })();
      // prefer x-forwarded-for and fallback to the others
      return xForwardedForIP || xRealIP || sockRemoteAddress || conRemoteAddress;
    };

    const method = req.method;
    const requestPath = req.path;
    const body = req.body;
    const headers = req.headers;
    const query = req.query;
    const ip = getIP(req);
    Object.defineProperty(req, 'ip', {
      get: () => ip,
      configurable: true // Allows the property to be redefined later if needed
    });

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
      if (typeof obj !== 'object' || obj === null) {
        return '';
      }
      return Object.entries(obj || {})
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
      🡳🡳🡳 Incoming Request 🡳🡳🡳 :
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
  logResponse = (req, status_code, message, data, headers = {}, isError = false, fileResponse = null) => {
    const securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Content-Security-Policy': `default-src '${req.path === '/users/profile-picture' ? 'self; img-src data: blob:' : 'self'}'`,
      ...headers
    };

    const formatObjectEntries = (obj, lengthLimit = 50) => {
      if (typeof obj !== 'object' || obj === null) return '';
      return Object.entries(obj).map(([key, value]) => {
        let displayValue = value && String(value).length > lengthLimit
          ? `${String(value).substring(0, lengthLimit)}... [truncated]`
          : String(value);
        if (key.includes('password')) displayValue = '*****';
        return `${key.padEnd(26)}: ${displayValue}`;
      }).join('\n          ');
    };

    const responseLogMessage = `
      ${isError ? '🡱🡱🡱 Error Response 🡱🡱🡱 :' : '🡱🡱🡱 Outgoing Response 🡱🡱🡱 :'}
      Headers:
          ${formatObjectEntries(securityHeaders)}
      ------------------
      ${req.method} ${req.path} => ${req.ip}
      Status: ${status_code}
      File Response: ${fileResponse || 'None'}
      Message: ${message ? message : 'Not specified'}
      Data:
          ${data ? formatObjectEntries(data) : 'Not specified'}
    `;

    const endingMessage = "=".repeat(5) + "End of response: " + `${req.method} ${req.path} => ${status_code} => ${req.ip}` + "=".repeat(5);

    logger[isError ? 'error' : 'info'](responseLogMessage + endingMessage);
    return securityHeaders;
  };


  responseHandler = (req, res, next) => {
    logger.info("Handling response");
    let securityHeaders = {};
    let status_code = 500;
    let message = 'Internal Server Error';
    let headers = {};
    let data = null;

    if (req.fileResponse) {
      logger.info("Sending file response");
      securityHeaders = this.logResponse(req, 200, "none", data, headers, false, req.fileResponse);
      return res.set(securityHeaders).status(200).sendFile(req.fileResponse);
    }

    // Handle Swagger UI requests specifically
    if (req.url.startsWith('/api/v0.2/docs')) {
      logger.debug('Skipping response handler for Swagger UI request');
      return next();
    }

    if (req.formattedResponse) {
      ({ status_code, message, data, headers } = req.formattedResponse);
      securityHeaders = this.logResponse(req, status_code, message, data, headers);
    } else {
      logger.warn('Response not formatted in req.formattedResponse');
      logger.debug(`${req.method} ${req.path} => ${res.statusCode || 'Unknown'} ${res.statusMessage || 'Unknown message'} => ${req.ip}`);
      logger.warn('Sending an empty response');
      res.send();
      return;
    }

    res.set(securityHeaders).status(status_code).json(formatResponse(status_code, message, data));
    return;
  }

  errorHandler = (err, req, res, next) => {
    logger.info("Handling error");
    err.stack = appConfigs.environment === "production" ? "" : err.stack;
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
        logger.error(`stack: ${appConfigs.environment === 'development' ? err.stack : err}`);
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
    } else {
      next();
    }
  }

  unknownRouteHandler(req, res, next) {
    logger.info('Checking if the route is unknown...');

    if (!req.formattedResponse) {
      logger.error(`Unknown route: ${req.method} ${req.url}`);
      return next(MyAppErrors.notFound(`${req.method} ${req.url} not found`));
    }

    logger.info('Route was handled eariler and returned a response.');
    next(); // Only called if req.formattedResponse is set
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
