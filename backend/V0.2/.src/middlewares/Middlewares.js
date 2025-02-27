const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const { Logger, formatResponse, formatBkkTime } = require("../utilities/Utils");
const serverTime = require("../utilities/StartTime");
const MyAppErrors = require("../utilities/MyAppErrors");
const appConfigs = require("../configs/AppConfigs");
const GoogleSheetService = require("../services/GoogleSheetService.js");

const AuthUtils = require('../utilities/AuthUtils');
const { verifyToken } = AuthUtils;
const logger = Logger("Middlewares");
const NODE_ENV = appConfigs.environment;
const APP_ROOT = '/usr/src/WealthTrack';
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

class Middlewares {
  constructor() {
    this.healthCheck = this.healthCheck.bind(this);
    this.formatUptime = this.formatUptime.bind(this);

    // CORS configuration
    this.corsOptions = {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, Postman)
        if (!origin) {
          return callback(null, true);
        }
        // For any origin provided, allow it
        callback(null, true);
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-Refresh-Token',
        'Accept',
      ],
      credentials: true,
      maxAge: 86400,
      exposedHeaders: ['Content-Length', 'X-Rate-Limit']
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

    // // Function to determine if a field should skip sanitization
    // const shouldSkipSanitization = (key, value) => {
    //   logger.info(`Checking if field ${key} should skip sanitization...`);
    //   // Convert value to string for testing if it's not already a string
    //   const stringValue = String(value);

    //   // Handle exact matches first
    //   if (skipPatterns[key.toLowerCase()] &&
    //     skipPatterns[key.toLowerCase()].test(stringValue)) {
    //     logger.debug(`Field ${key} should skip sanitization. by exact match`);
    //     return true;
    //   }

    //   // Handle partial matches (for fields that contain pattern names)
    //   for (const [pattern, regex] of Object.entries(skipPatterns)) {
    //     if (key.toLowerCase().includes(pattern) && regex.test(stringValue)) {
    //       logger.debug(`Field ${key} should skip sanitization. by partial match`);
    //       return true;
    //     }
    //   }

    //   return false;
    // };

    // const escapeString = (str) => {
    //   return String(str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // };

    // const sanitizeObject = (obj) => {
    //   if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    //     throw MyAppErrors.badRequest("Invalid request.");
    //   }

    //   const sanitized = {};
    //   for (const key in obj) {
    //     if (typeof obj[key] === "string") {
    //       // Skip sanitization for validated patterns
    //       if (shouldSkipSanitization(key, obj[key])) {
    //         sanitized[key] = obj[key];
    //       } else {
    //         sanitized[key] = escapeString(obj[key]);
    //       }
    //     } else if (typeof obj[key] === "object") {
    //       sanitized[key] = sanitizeObject(obj[key]);
    //     } else {
    //       sanitized[key] = obj[key];
    //     }
    //   }
    //   return sanitized;
    // };

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

        logger.debug(`Request method ${method} is allowed for ${path}`);
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

  rateLimiter(windowMs = 15 * 60 * 1000, limit = 100) {
    return require("express-rate-limit")({
      windowMs,
      limit,
      standardHeaders: true,
      legacyHeaders: false,
      trustProxy: true,
      message: "Too many requests from this IP, please try again later.",
      handler: (req, res, next, options) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        req.formattedResponse = formatResponse(options.statusCode, options.message, { retryAfter: res.getHeader('Retry-After') });
      },
    });
  }

  securityMiddleware(req, res, next) {
    const BLACKLIST_FILE = path.join(__dirname, "../../statics/", "blacklist.json");
    logger.info(`Loading blacklist from: ${BLACKLIST_FILE}`);
    const SUSPICIOUS_PATTERNS = [
      "/",         // ป้องกันการสแกนหน้าหลัก
      "/php-cgi/", // ป้องกัน RCE ผ่าน PHP-CGI
      "/lip/verify", // ป้องกันการสแกน LIP API
      "/admin/",   // ป้องกัน brute force ไปที่ /admin
      "wp-login",  // ป้องกันการสแกน WordPress
      "eval(",     // ป้องกัน XSS และ SQL Injection
      "cgi-bin",   // ป้องกัน CGI-based attack
      "passwd",    // ป้องกันการพยายามอ่านไฟล์ passwd
      "union select", // ป้องกัน SQL Injection
      "exec(", "system(", "passthru(", "shell_exec(", // ป้องกัน RCE
      ".git/config", // พยายามเข้าถึง Git repo
      ".env", ".env.local", ".env.tmp", ".env.development.local", ".env.prod.local", // พยายามอ่านไฟล์ .env
      "/prod/.env", "/production/.git/config", "/www/.git/config", // พยายามดึง environment configs
      "/modules/utils/.git/config", "/templates/.git/config", "/user_area/.git/config",
      "/test_configs/.git/config", "/images/.git/config", "/core/config/.git/config",
      "/data/private/.git/config", "/static/content/.git/config",
      "/libs/js/iframe.js" // อาจเป็นการโจมตี iframe injection
    ];

    // Load blacklist from JSON file
    const loadBlacklist = () => {
      try {
        if (!fs.existsSync(BLACKLIST_FILE)) return new Set();
        const data = JSON.parse(fs.readFileSync(BLACKLIST_FILE, "utf-8"));
        logger.debug(`Loaded blacklist: ${JSON.stringify(data.blocked_ips)}`);
        return new Set(data.blocked_ips || []);
      } catch (err) {
        logger.error(`Error loading blacklist: ${err}`);
        return new Set();
      }
    };

    // Save blacklist to JSON file
    const saveBlacklist = (blacklist) => {
      try {
        fs.writeFileSync(BLACKLIST_FILE, JSON.stringify({ blocked_ips: [...blacklist] }, null, 2));
        logger.debug(`Saved blacklist: ${JSON.stringify([...blacklist])}`);
      } catch (err) {
        logger.error("Error saving blacklist:", err);
      }
    };

    let blacklist = loadBlacklist();
    logger.debug(`blacklist:${typeof blacklist} - ${JSON.stringify(blacklist)}`);
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    if (blacklist.has(clientIp)) {
      logger.warn(`Blocked request from blacklisted IP: ${clientIp}`);
      return next(MyAppErrors.forbidden());
    }

    const suspicious = SUSPICIOUS_PATTERNS.some((pattern) =>
      req.url.includes(pattern) ||
      JSON.stringify(req.query).includes(pattern) ||
      JSON.stringify(req.body).includes(pattern)
    );

    if (suspicious) {
      logger.warn(`Suspicious request detected from ${clientIp}: ${req.method} ${req.url}`);

      if (!blacklist.has(clientIp)) {
        blacklist.add(clientIp);
        logger.debug(`Added ${clientIp} to blacklist: ${JSON.stringify(blacklist)}`);
      }
      saveBlacklist(blacklist);

      return next(MyAppErrors.forbidden());
    } else logger.debug(`/// Request from ${clientIp} is not suspicious`);

    next();
  }

  healthCheck(req, res, next) {
    const currentTime = new Date().getTime();
    const currentBkkTime = formatBkkTime(currentTime);

    req.formattedResponse = formatResponse(
      200,
      "you are connected to the /health, running in Environment: " + NODE_ENV,
      {
        status: "healthy",
        timestamp: currentBkkTime,
        server_start_at: serverTime.getFormattedStartTime(),
        uptime: serverTime.formatUptime(),
        environment: appConfigs.environment
      }
    );
    next();
  }

  requestLogger(req, res, next) {
    logger.info(`\u2193 \u2193 \u2193 ---entering the routing for ${req.method} ${req.url}`);

    const getIP = (req) => {
      const conRemoteAddress = req.connection?.remoteAddress;
      const sockRemoteAddress = req.socket?.remoteAddress;
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
    try {
      // Store the request log on the request object
      if (GoogleSheetService.isConnected()) {
        const requestLog = GoogleSheetService.prepareRequestLog(req);
        req.requestLog = requestLog; // Store for later use in response handler
      } else logger.warn('Google Sheet service is not connected');

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
          base64Image: `${body.base64Image.substring(0, 50)}... [truncated]`
        };
      } else {
        logBody = body;
      }

      const formatObjectEntries = (obj, lengthLimit = 50) => {
        if (typeof obj !== 'object' || obj === null) return '';
        return Object.entries(obj || {}).map(([key, value]) => {
          const displayValue = value && String(value).length > lengthLimit
            ? `${String(value).substring(0, lengthLimit)}... [truncated]`
            : String(value);
          return `${key.padEnd(26)}: ${displayValue}`;
        }).join('\n          ');
      }

      const requestLogMessage = `
        \u2193 \u2193 \u2193 ---Incoming Request---\u2193 \u2193 \u2193   :
        ------------------
        ${ip} => ${method} ${requestPath}
        Headers:
          ${formatObjectEntries(headers)}
        Cookies:
          ${formatObjectEntries(req.cookies)}
        Body: ${logBody ? JSON.stringify(logBody, null, 6).replace(/^/gm, '      ') : 'Empty'}
        Query: ${query ? JSON.stringify(query, null, 6).replace(/^/gm, '      ') : 'Empty'}
      `;

      logger.info(requestLogMessage);
    } catch (error) {
      logger.error(`Error occurred during request logging: ${error.message}`);
    }
    next();
  }

  async authMiddleware(req, res, next) {
    logger.info("Authenticating user");
    if (req.formattedResponse) {
      logger.info('the request was already handled. Skipping authentication');
      return next();
    }

    const accessToken = req.cookies['access_token'] || req.headers.authorization?.split(' ')[1];

    logger.debug(`accessToken: ${accessToken ? accessToken.substring(0, 10) + '...' : 'Not present'}`);

    if (accessToken) {
      try {
        const user = verifyToken(accessToken, appConfigs.accessTokenSecret);
        req.user = user;
        logger.info(`User authenticated(req.user): ${JSON.stringify(req.user, null, 2)}`);
        next();
      } catch (err) {
        logger.warn('Invalid access token');
        logger.debug(`error: ${err}`);
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
  }

  conditionalProfilePictureUpload(req, res, next) {
    logger.debug(`Middleware triggered: conditionalProfilePictureUpload`);
    logger.debug(`req.is('multipart/form-data'): ${req.is('multipart/form-data')}`);
    logger.debug(`Request body:`, req.body);
    logger.debug(`Request file:`, req.file);
    if (req.is('multipart/form-data')) {
      return uploadProfilePictureToDisk.single('profilePicture')(req, res, next);
    }
    next();
  }

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

      //NOTE - improve to log nested object in the array
      return Object.entries(obj).map(([key, value]) => {
        let displayValue = value && String(value).length > lengthLimit
          ? `${String(value).substring(0, lengthLimit)}... [truncated]`
          : String(value);
        if (key.includes('password')) displayValue = '*****';
        return `${key.padEnd(26)}: ${displayValue}`;
      }).join('\n          ');
    };

    const responseLogMessage = `
      \u2191 \u2191 \u2191  Outgoing Response \u2191 \u2191 \u2191  :
      Headers:
          ${formatObjectEntries(securityHeaders)}
      ------------------
      ${req.method} ${req.path} => ${req.ip}
      Status: ${status_code}
      File Response: ${fileResponse || 'None'}
      Message: ${message ? message : 'Not specified'}
      Data:
          ${Array.isArray(data) ? JSON.stringify(data) : formatObjectEntries(data || { "None": "None" })}
    `;

    const endingMessage = "=".repeat(5) + ` End of response: ${req.method} ${req.path} => ${status_code} => ${req.ip} ` + "=".repeat(5);

    logger[isError ? 'error' : 'info'](responseLogMessage + '\n' + endingMessage);
    return securityHeaders;
  };

  unknownRouteHandler(req, res, next) {
    logger.info('Checking if the route is unknown...');

    if (!req.formattedResponse) {
      if (!req.url.includes('favicon.ico')) {
        logger.error(`Unknown route: ${req.method} ${req.url}`);
        return next(MyAppErrors.notFound(`${req.method} ${req.url} not found`));
      }
    }

    logger.info('Route was handled eariler and returned a response.');
    next(); // Only called if req.formattedResponse is set
  }

  errorHandler = (err, req, res, next) => {
    logger.info("Handling error");
    err.stack = appConfigs.environment === "production" ? "...removed..." : err.stack;

    let response;
    // if no response has been sent
    if (!res.headersSent) {
      if (err.message === 'Not allowed by CORS') {
        logger.error(`CORS Error: ${err.message}`);
        response = formatResponse(403, "Not allowed by CORS", null);

      } else if (err instanceof MyAppErrors) {
        logger.error(`MyAppError: ${err.message}`);
        response = formatResponse(err.statusCode, err.message, err.data);

      } else if (err instanceof SyntaxError) {
        logger.error(`SyntaxError: ${err.message}`);
        response = formatResponse(400, "Invalid Syntax: " + err.message);

        if (err.message.includes('JSON')) {
          logger.error('JSONError');
          response = formatResponse(400, "Invalid JSON format: " + err.message);
        } else {
          logger.error('SyntaxError');
          response = formatResponse(400, "Invalid Syntax: " + err.message);
        }

      } else if (err instanceof Error) {
        logger.error(`Error: ${err.message}`);
        response = formatResponse(500, "Internal Server Error");

      } else {
        logger.error(`Unhandled error: ${err}`);
        response = formatResponse(500, "Internal Server Error");
      }
      logger.error(`stack: ${err.stack}`);

      // Store error headers for use in response handler
      req.errorHeaders = err.headers || {};

      // Set the formatted response
      req.formattedResponse = response;
    }

    // Continue to response handler
    next();
  }

  // Response Handler - Central place for sending all responses
  responseHandler = async (req, res, next) => {
    logger.info("Handling response");

    // Handle Swagger UI requests specifically
    if (req.url.startsWith('/api/v0.2/docs')) {
      logger.debug('Skipping response handler for Swagger UI request');
      return next();
    }

    // Handle file responses
    if (req.fileResponse) {
      logger.info("Sending file response");
      const securityHeaders = this.logResponse(req, 200, "none", null, {}, false, req.fileResponse);
      return res.set(securityHeaders).status(200).sendFile(req.fileResponse);
    }

    // If no formatted response exists, log warning and send empty response
    if (!req.formattedResponse) {
      logger.warn('Response not formatted in req.formattedResponse');
      logger.debug(`${req.method} ${req.path} => ${res.statusCode || 'Unknown'} ${res.statusMessage || 'Unknown message'} => ${req.ip}`);
      logger.warn('Sending an empty response');
      return res.send();
    }

    const { status_code, message, data } = req.formattedResponse;

    // Combine error headers (if any) with regular headers
    const headers = { ...(req.errorHeaders || {}), ...(req.formattedResponse.headers || {}) };

    // Log response to Google Sheet if service is connected
    if (GoogleSheetService.isConnected() && req.requestLog) {
      const completeLog = GoogleSheetService.prepareResponseLog(req, req.formattedResponse);
      await GoogleSheetService.appendLog(completeLog);
    } else logger.warn('Google Sheet service is not connected');

    // Get security headers
    const securityHeaders = this.logResponse(
      req,
      status_code,
      message,
      data,
      headers,
      !!req.error // Pass true if error exists
    );

    // Send response with combined headers
    res
      .set({ ...securityHeaders, ...headers })
      .status(status_code)
      .json(formatResponse(status_code, message, data));
  }

  /**
   * Format uptime given in seconds to a human readable format.
   * The format is as follows:
   * - If days > 0, days are included and the rest is ignored.
   * - If hours > 0, hours are included and the rest is ignored.
   * - If minutes > 0, minutes are included and the rest is ignored.
   * - If seconds > 0, seconds are included.
   * If no time units are greater than 0, the number of seconds is returned.
   * @param {number} seconds
   * @returns {string} A human readable format of the uptime.
   */
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
