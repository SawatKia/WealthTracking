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
    this.blacklist = new Set();
    this.blacklistLastLoad = 0;
    this.blacklistRefreshInterval = 5 * 60 * 1000; // 5 minutes

    // CORS configuration
    this.corsOptions = {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, Postman)
        if (!origin) {
          return callback(null, true);
        }
        // For any origin provided, allow it
        return callback(null, true);
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
    this.corsMiddleware = (req, res, next) => {
      logger.info(`Handling CORS for ${req.method} ${req.url}`);
      logger.debug(`Origin: ${req.headers.origin || 'No origin'}`);
      return cors(this.corsOptions)(req, res, next);
    };

    // Bind all methods to the class
    Object.getOwnPropertyNames(Middlewares.prototype).forEach(key => {
      if (typeof this[key] === 'function') {
        this[key] = this[key].bind(this);
      }
    });
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
    logger.info('request validation middleware...');
    return (req, res, next) => {
      try {
        const method = String(req.method || "").toUpperCase().trim();
        // Normalize the path by removing trailing slash and ensuring leading slash
        let path = String(req.path || "").trim();
        path = path.replace(/\/+$/, ''); // Remove trailing slashes
        if (!path.startsWith('/')) {
          path = '/' + path;
        }

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
          // Remove trailing slashes from incoming path
          incomingPath = incomingPath.replace(/\/+$/, '');

          for (const allowedPath in allowedMethods) {
            // Normalize allowed path as well
            const normalizedAllowedPath = allowedPath
              .replace(/\/+$/, '')  // Remove trailing slashes
              .startsWith('/') ? allowedPath : '/' + allowedPath; // Add leading slash  

            // For exact matches (non-parameterized routes)
            if (incomingPath === normalizedAllowedPath) {
              return allowedPath;
            }

            // For parameterized routes
            const pathRegex = new RegExp(
              `^${normalizedAllowedPath.replace(/:[^/]+/g, "[^/]+")}$`
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
    logger.info('Rate limiter initialized');
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
    logger.info(`set blacklist file path: ${BLACKLIST_FILE}`);

    const SUSPICIOUS_PATTERNS = [
      "^/php-cgi/",      // Match exact path prefix
      "^/admin/",        // Match exact path prefix
      "^wp-",            // WordPress specific prefix
      "\\beval\\(",      // Ensure eval is a complete word
      "\\brm -rf\\b",    // Ensure rm -rf is a complete command
      "\\bwget\\b",      // Complete word boundaries
      "\\bcurl\\b",      // Complete word boundaries
      "\\b(?<!refre)sh\\b", // Match sh but not when part of refresh
      "\\bbash\\b", "\\bcmd\\b", "\\bpowershell\\b", "\\bphp\\b", "\\bpython\\b",
      "\\bnode\\b", "\\bnpm\\b", "\\byarn\\b", "\\bgo\\b",
      "\\.txt$", "\\.json$", "\\.log$", "\\.bak$",  // File extensions at end only
      "\\btelescope\\b",
      "\\bcgi\\b",
      "passwd",
      "union\\s+select",
      "\\bexec\\(", "\\bsystem\\(", "\\bpassthru\\(", "\\bshell_exec\\(",
      "\\.git/config",
      "\\.env(?:\\.local|\\.tmp|\\.development\\.local|\\.prod\\.local)?$",
      "/prod/\\.env", "/production/\\.git/config", "/www/\\.git/config",
      "/modules/utils/\\.git/config", "/templates/\\.git/config",
      "/user_area/\\.git/config", "/test_configs/\\.git/config",
      "/images/\\.git/config", "/core/config/\\.git/config",
      "/data/private/\\.git/config", "/static/content/\\.git/config",
      "/libs/js/iframe\\.js",
    ];

    // Define whitelisted paths from allowedMethods
    const WHITELISTED_PATHS = [
      '/health',
      '/favicon.ico',
      '/api',
      '/api/v0.2/',
      '/api/v0.2/users',
      '/api/v0.2/banks',
      '/api/v0.2/banks/:account_number/:fi_code',
      '/api/v0.2/debts',
      '/api/v0.2/debts/:debt_id',
      '/api/v0.2/debts/:debt_id/payments',
      '/api/v0.2/slip/quota',
      '/api/v0.2/slip',
      '/api/v0.2/slip/verify',
      '/api/v0.2/cache',
      '/api/v0.2/cache/:key',
      '/api/v0.2/login',
      '/api/v0.2/refresh',
      '/api/v0.2/logout',
      '/api/v0.2/google/login',
      '/api/v0.2/google/callback',
      '/api/v0.2/transactions',
      '/api/v0.2/transactions/list/types',
      '/api/v0.2/transactions/summary/monthly',
      '/api/v0.2/transactions/summary/month-expenses',
      '/api/v0.2/transactions/account/:account_number/:fi_code',
      '/api/v0.2/transactions/:transaction_id',
      '/api/v0.2/budgets',
      '/api/v0.2/budget/types',
      '/api/v0.2/budgets/history',
      '/api/v0.2/budgets/:expenseType'
    ];

    // Helper function to check if a path matches whitelist pattern
    const isPathWhitelisted = (requestPath) => {
      logger.info(`Checking if ${requestPath} is a whitelisted path`);
      const isWhitelisted = WHITELISTED_PATHS.some(pattern => {
        // Define base whitelisted paths
        const BASE_PATHS = ['/health', '/favicon.ico', '/api'];

        // Check base paths first
        if (BASE_PATHS.includes(requestPath)) {
          logger.debug(`Path ${requestPath} matches base whitelist`);
          return true;
        }

        // Check if path starts with /api/v0.2
        if (requestPath.startsWith('/api/v0.2')) {
          logger.debug(`Path ${requestPath} matches API v0.2 prefix`);
          return true;
        }

        // Convert route pattern to regex
        const regexPattern = pattern
          .replace(/:[^/]+/g, '[^/]+') // Replace :params with regex
          .replace(/\//g, '\\/') // Escape forward slashes
          .replace(/\//g, '\\/?'); // Make trailing slash optional
        const regex = new RegExp(`^${regexPattern}$`);
        logger.silly(`testing path ${requestPath} against regex: ${regex}`);
        const result = regex.test(requestPath);
        return result;
      });
      logger.debug(`the path ${requestPath} is ${isWhitelisted ? 'whitelisted' : 'not whitelisted'}`);
      return isWhitelisted;
    };

    // Load blacklist from JSON file
    const loadBlacklist = () => {
      try {
        if (!fs.existsSync(BLACKLIST_FILE)) return new Set();
        logger.info(`Loading blacklist from ${BLACKLIST_FILE}`);
        const data = JSON.parse(fs.readFileSync(BLACKLIST_FILE, "utf-8"));
        return new Set(data.blocked_ips || []);
      } catch (err) {
        logger.error(`Error loading blacklist: ${err}`);
        return new Set();
      }
    };

    // Save blacklist to JSON file
    const saveBlacklist = (blacklist) => {
      try {
        // Create directory if it doesn't exist
        const dir = path.dirname(BLACKLIST_FILE);
        logger.info('verifying directory existing');
        logger.debug(`dir: ${dir}`);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          logger.debug(`Created directory for blacklist at ${dir}`);
        }

        fs.writeFileSync(BLACKLIST_FILE, JSON.stringify({ blocked_ips: [...blacklist] }, null, 2));
        logger.warn(`Added IP to blacklist: ${JSON.stringify([...blacklist])}`);
      } catch (err) {
        logger.error("Error saving blacklist:", err);
      }
    };

    const loadBlacklistIfNeeded = () => {
      logger.info('Loading blacklist if needed');
      const now = Date.now();

      // Initialize lastLoad if it's 0 (first run)
      if (this.blacklistLastLoad === 0) {
        logger.debug('First run, initializing lastLoad time and loading blacklist');
        this.blacklist = loadBlacklist(); // Load blacklist on first run
        this.blacklistLastLoad = now;
        logger.debug(`Initial blacklist loaded with ${this.blacklist.size} entries`);
      } else {
        // For subsequent runs, check if refresh is needed
        const timeSinceLastLoad = Math.max(0, (now - this.blacklistLastLoad) / 1000); // Convert to seconds
        const timeUntilNextLoad = Math.max(0, (this.blacklistRefreshInterval - (now - this.blacklistLastLoad)) / 1000); // Convert to seconds

        // Format times for logging
        const formatDuration = (seconds) => {
          if (seconds < 60) return `${Math.round(seconds)}s`;
          if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
          return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m ${Math.round(seconds % 60)}s`;
        };

        logger.debug(`considering blacklist reloading:\n` +
          `Current time: ${formatBkkTime(now)}\n` +
          `Last load: ${formatBkkTime(this.blacklistLastLoad)}\n` +
          `Refresh interval: ${formatDuration(this.blacklistRefreshInterval / 1000)}\n` +
          `Time since last load: ${formatDuration(timeSinceLastLoad)}\n` +
          `Time until next load: ${timeUntilNextLoad <= 0 ? 'now' : formatDuration(timeUntilNextLoad) + " which is " + formatBkkTime(now + timeUntilNextLoad * 1000)}`
        );

        // Check if refresh is needed
        if (now - this.blacklistLastLoad > this.blacklistRefreshInterval) {
          logger.warn(' \u21BB \u21BB Refreshing blacklist after ' + formatDuration(timeSinceLastLoad));
          this.blacklist = loadBlacklist();
          this.blacklistLastLoad = now;
        } else {
          logger.info("Skipping blacklist refresh");
        }
      }

      logger.debug(`Cached blacklist: ${this.blacklist.size} entries [${[...this.blacklist].join(', ')}]`);
      return this.blacklist;
    };

    // Function to check all possible input sources
    const checkSuspiciousPatterns = (input, source) => {
      logger.info(`Checking for suspicious patterns in ${source}`);
      if (!input) return false;

      return SUSPICIOUS_PATTERNS.some(pattern => {
        const regex = new RegExp(pattern, 'i');
        logger.silly(`testing input ${typeof input === 'object' ? JSON.stringify(input) : input}::${typeof input} against regex: ${regex}`);
        if (typeof input === 'string') {
          if (regex.test(input)) {
            logger.warn(`Suspicious pattern "${pattern}" found in ${source}: ${input}`);
            return true;
          }
        } else if (typeof input === 'object') {
          const stringified = JSON.stringify(input);
          if (regex.test(stringified)) {
            logger.warn(`Suspicious pattern "${pattern}" found in ${source}: ${stringified}`);
            return true;
          }
        }
        return false;
      });
    };

    // Check if the path is whitelisted
    if (isPathWhitelisted(req.path)) {
      logger.info(`${req.path} is a whitelisted path, skipping security checks`);
      return next();
    }

    loadBlacklistIfNeeded();
    logger.debug(`blacklist: ${JSON.stringify([...this.blacklist])}::${typeof this.blacklist}`);
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    if (this.blacklist.has(clientIp)) {
      logger.warn(`Blocked request from blacklisted IP: ${clientIp}`);
      return next(MyAppErrors.forbidden());
    }
    logger.info(`${clientIp} is not in the black list`);

    logger.info('Checking for suspicious patterns');
    // Check all possible input sources
    const isSuspicious = (
      (req.url && checkSuspiciousPatterns(req.url, 'URL')) ||
      (req.path && checkSuspiciousPatterns(req.path, 'Path')) ||
      (req.query && typeof req.query === 'object' && checkSuspiciousPatterns(req.query, 'Query Parameters')) ||
      (req.params && typeof req.params === 'object' && checkSuspiciousPatterns(req.params, 'URL Parameters')) ||
      (req.body && typeof req.body === 'object' && checkSuspiciousPatterns(req.body, 'Request Body')) ||
      (req.headers && typeof req.headers === 'object' && checkSuspiciousPatterns(req.headers, 'Headers')) ||
      (req.cookies && typeof req.cookies === 'object' && checkSuspiciousPatterns(req.cookies, 'Cookies')) ||
      (req.files && Array.isArray(req.files) && checkSuspiciousPatterns(
        req.files.map(f => f.originalname).join(','),
        'File Names'
      ))
    );

    if (isSuspicious) {
      logger.warn(`Suspicious request detected from ${clientIp} => ${req.method} ${req.url}`);

      // Only add to blacklist if the request is request to a valid host and not already in the blacklist
      if (this._isValidHost(req) && !this.blacklist.has(clientIp)) {
        blacklist.add(clientIp);
        logger.warn(`Added ${clientIp} to blacklist: ${JSON.stringify(this.blacklist)}`);
        saveBlacklist(this.blacklist);

        return next(MyAppErrors.forbidden());
      } else logger.info(`${clientIp} is exist in the black list, not need to add again`);
    }

    logger.info(`${clientIp} => ${req.method} ${req.url} passed through security check`);

    next();
  }

  /**
  * Validates if the request is requesting to an authorized host server
  * @param {Object} req - Express request object
  * @returns {boolean} - Returns true if the request is request to a valid host, false otherwise
  */
  _isValidHost(req) {
    try {
      // Check if host header exists
      if (!req.headers.host) {
        logger.error('No host header present in request');
        return false;
      }

      // Clean the host value
      const requestHost = req.headers.host.toLowerCase().trim();
      const configuredHost = (appConfigs.appHost || "").toLowerCase().trim();

      // Check for exact match
      if (requestHost === configuredHost) {
        logger.debug(`Valid host: ${requestHost}`);
        return true;
      }

      // Log invalid host
      logger.warn(`Unauthorized host detected: ${requestHost}`);
      logger.debug(`Expected host: ${configuredHost}`);
      return false;

    } catch (error) {
      logger.error(`Error in host validation: ${error.message}`);
      return false;
    }
  }

  /**
     * Checks if the given path is a Swagger UI related request
     * @param {string} path - The request path to check
     * @returns {boolean} - True if the path is Swagger related, false otherwise
     */
  isSwaggerRequest(path) {
    logger.info(`Checking if path ${path} is a Swagger request`);
    const isSwagger = path.startsWith('/api/v0.2/docs') ||
      path.includes('docs') ||
      path.includes('swagger-ui') ||
      path.includes('api-docs');
    logger.debug(`Is Swagger request: ${isSwagger}`);
    return isSwagger;
  }

  /**
   * Bypasses the middleware for swagger requests
   */
  swaggerBypass = (req, res, next) => {
    if (this.isSwaggerRequest(req.path)) {
      logger.debug(`Bypassing middleware for Swagger request: ${req.path}`);
      return next();
    }
    return next();
  };

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
    // Add debug log for all requests, including Swagger
    logger.debug(`Incoming request: ${req.method} ${req.url}`);

    // Special handling for Swagger requests
    if (this.isSwaggerRequest(req.path)) {
      logger.info(`Swagger UI request detected: ${req.method} ${req.url}`);
      return next();
    }

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
          logger.debug(`x-forwarded-for ips: ${ips.join(' ')}`);
          return ips[0];
        }
      })();
      logger.debug(`x-forwarded-for: ${xForwardedForIP}`);
      logger.debug(`x-real-ip: ${xRealIP}`);
      logger.debug(`socket remote address: ${sockRemoteAddress}`);
      logger.debug(`connection remote address: ${conRemoteAddress}`);
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
      logger.info('Preparing request log entry...');

      const ip = getIP(req);
      logger.debug(`parsed request IP: ${ip}`);
      Object.defineProperty(req, 'ip', {
        get: () => ip,
        configurable: true // Allows the property to be redefined later if needed
      });
      logger.info(`req.ip: ${req.ip}`);

      const requestLog = GoogleSheetService.prepareRequestLog(req);
      req.requestLog = requestLog; // Store for later use in response handler

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
    try {
      logger.info("Authenticating user");

      // Skip if response is already formatted
      if (req.formattedResponse) {
        logger.info('The request was already handled. Skipping authentication');
        return next();
      }

      const accessToken = req.cookies['access_token'] || req.headers.authorization?.split(' ')[1];
      logger.debug(`accessToken: ${accessToken ? accessToken.substring(0, 10) + '...' : 'Not present'}`);

      // If no access token is provided
      if (!accessToken) {
        logger.warn('No access token provided, skipping authentication');
        return next();
      }

      // Verify token and set user
      try {
        const user = verifyToken(accessToken, appConfigs.accessTokenSecret);
        req.user = user;
        logger.info(`User authenticated(req.user): ${JSON.stringify(req.user, null, 2)}`);
        return next();
      } catch (err) {
        logger.warn('Invalid access token');
        logger.debug(`error: ${err}`);
        return next(MyAppErrors.unauthorized(
          AuthUtils.authenticationError.message,
          null,
          AuthUtils.authenticationError.headers
        ));
      }
    } catch (error) {
      logger.error(`Unexpected error in auth middleware: ${error.message}`);
      return next(MyAppErrors.internalServerError('Authentication failed'));
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

    const formatObjectEntries = (obj, lengthLimit = 50, indentLevel = 0) => {
      if (typeof obj !== 'object' || obj === null) return '';

      const indent = '  '.repeat(indentLevel * 2);
      return Object.entries(obj).map(([key, value]) => {
        let displayValue;

        if (typeof value === 'object' && value !== null) {
          // Recursively format nested objects
          displayValue = `\n          ${formatObjectEntries(value, lengthLimit, indentLevel + 1)}`;
        } else {
          displayValue = value && String(value).length > lengthLimit
            ? `${String(value).substring(0, lengthLimit)}... [truncated]`
            : String(value);
          if (key.includes('password') || key.includes('token')) displayValue = '*****';
        }

        return `${indent}${key.padEnd(26)}: ${displayValue}`;
      }).join('\n          ');
    };

    // Calculate performance metrics
    const responseTimeMs = Date.now();
    const processingTime = responseTimeMs - (req.requestTimeMs || responseTimeMs);
    const performanceMetrics = {
      requestTime: req.requestTimeMs ? formatBkkTime(new Date(req.requestTimeMs)) : 'N/A',
      responseTime: formatBkkTime(new Date(responseTimeMs)),
      processingTimeMs: processingTime
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
      Performance:
          ${formatObjectEntries(performanceMetrics)}
    `;

    const endingMessage = "=".repeat(5) + ` End of response: ${req.method} ${req.path} => ${status_code} => ${req.ip} ` + "=".repeat(5);

    logger[isError ? 'error' : 'info'](responseLogMessage + '\n' + endingMessage);
    return securityHeaders;
  };

  unknownRouteHandler(req, res, next) {
    logger.info('Checking route handling status...');

    // First check: If it's a Swagger request, let it through
    if (this.isSwaggerRequest(req.path)) {
      logger.info(`Allowing Swagger UI request: ${req.method} ${req.url}`);
      return next();
    }

    // Second check: If response is already formatted, let it through
    if (req.formattedResponse) {
      logger.info('Route was handled earlier and has a formatted response');
      return next();
    }

    // Third check: Ignore favicon requests
    if (req.url.includes('favicon.ico')) {
      logger.debug('Ignoring favicon request');
      return next();
    }

    // If none of the above conditions are met, it's an unknown route
    logger.error(`Unknown route detected: ${req.method} ${req.url}`);
    return next(MyAppErrors.notFound(`${req.method} ${req.url} not found`));
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
    let status_code = 500;
    let message = "Internal Server Error";
    let data = null;
    let headers = {};

    try {
      logger.info("Handling response");

      // Calculate response time for all environments
      const responseTimeMs = Date.now();
      const processingTime = responseTimeMs - (req.requestTimeMs || responseTimeMs);

      // Add response time header
      res.set('X-Response-Time', `${processingTime}ms`);
      logger.info(`Request processed in ${processingTime}ms`);

      // Add cache headers for GET requests
      if (req.method === 'GET') {
        const cacheEndpoints = ['/transactions/list/types'];
        const cachePrefix = ['/fi'];

        // Check if the request path matches any cache endpoint or prefix
        const shouldCache = cacheEndpoints.includes(req.path) || cachePrefix.some(prefix => req.path.startsWith(prefix));

        if (shouldCache) {
          logger.info('Adding cache headers max-age=1800');
          res.set('Cache-Control', 'public, max-age=1800'); // Cache for 30 minutes
        } else {
          logger.info('Adding no-cache headers for bank account endpoints');
          res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.set('Pragma', 'no-cache');
          res.set('Expires', '0');
        }
      }

      // Skip for Swagger UI requests
      if (req.url.startsWith('/api/v0.2/docs')) {
        logger.debug('Skipping response handler for Swagger UI request');
        return next();
      }

      // Handle file responses
      if (req.fileResponse) {
        logger.info("Sending file response");
        headers = this.logResponse(req, 200, "none", null, {}, false, req.fileResponse);
        // Add return to prevent further execution
        return res.set(headers).status(200).sendFile(req.fileResponse, (err) => {
          if (err) {
            // Log error but don't send another response
            logger.error(`Error sending file: ${err.message}`);
          }
        });
      }

      // Handle formatted responses
      if (!req.formattedResponse) {
        logger.warn('Response not formatted in req.formattedResponse');
        status_code = 200;
        message = "OK";
      } else {
        status_code = req.formattedResponse.status_code;
        message = req.formattedResponse.message;
        data = req.formattedResponse.data;
        headers = { ...(req.errorHeaders || {}), ...(req.formattedResponse.headers || {}) };
      }

      // Only send response if headers haven't been sent
      if (!res.headersSent) {
        const securityHeaders = this.logResponse(req, status_code, message, data, headers, status_code >= 400);
        res.set({ ...securityHeaders, ...headers })
          .status(status_code)
          .json(formatResponse(status_code, message, data));
      }

      // Handle Google Sheet logging asynchronously after sending response
      if (GoogleSheetService.isConnected() && req.requestLog) {
        logger.info('Google Sheet service is connected, logging asynchronously');
        const completeLog = GoogleSheetService.prepareResponseLog(req, req.formattedResponse);

        // Fire and forget - don't wait for the result
        GoogleSheetService.appendLog(completeLog)
          .catch(error => {
            logger.error(`Failed to append log to Google Sheet: ${error.message}`);
          });
      } else logger.warn('Google Sheet service is not connected');

    } catch (error) {
      logger.error(`Error in response handler: ${error.message}`);
      // Only send error response if headers haven't been sent
      if (!res.headersSent) {
        const securityHeaders = this.logResponse(req, 500, "Internal Server Error", null, {}, true);
        return res
          .set(securityHeaders)
          .status(500)
          .json(formatResponse(500, "Internal Server Error", null));
      }
    }
  };


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
