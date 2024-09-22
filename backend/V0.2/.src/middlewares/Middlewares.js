const Utils = require('../utilities/Utils');
const MyAppErrors = require('../utilities/MyAppErrors');
const appConfigs = require('../configs/AppConfigs');

const { Logger, formatResponse } = Utils;
const logger = Logger('Middlewares');
const NODE_ENV = appConfigs.environment;

class Middlewares {
    /**
     * Middleware to validate the allowed methods for a specific path
     * @param {Object} allowedMethods - Object with allowed methods for each path
     * @returns {Function} - Express middleware function
     */
    methodValidator(allowedMethods) {
        return (req, res, next) => {
            const { method, path } = req;
            logger.info('Validating request method and path');
            logger.debug(`Request: Method=${method}, Path=${path}`);
            logger.debug(`Environment: ${NODE_ENV}`);

            // Helper function to match dynamic paths
            const matchPath = (incomingPath) => {
                for (const allowedPath in allowedMethods) {
                    const pathRegex = new RegExp(`^${allowedPath.replace(/:[^/]+/g, '[^/]+')}$`);
                    logger.debug(`Path regex: ${pathRegex}`);
                    if (pathRegex.test(incomingPath)) {
                        return allowedPath; // Return the matching allowed path
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
                const errorMessage = NODE_ENV === 'production'
                    ? 'Method not allowed'
                    : `${method} method not allowed for ${path}`;
                return next(MyAppErrors.methodNotAllowed(errorMessage));
            }

            logger.info(`Method ${method} is allowed for ${path}`);
            next();
        };
    }


    /**
     * Middleware to handle API responses in a consistent format
     */
    responseHandler(req, res, next) {
        logger.info('Handling response');
        if (req.formattedResponse) {
            const { status_code, message, data } = req.formattedResponse;
            logger.debug(`Sending response: Status=${status_code}, Message=${message}, data=${data}`);
            res.status(status_code).json(formatResponse(status_code, message, data));
        } else {
            next();
        }
    }

    /**
     * Middleware to handle errors in a consistent format
     */
    errorHandler(err, req, res, next) {
        if (!res.headersSent) {
            logger.info('Handling error');
            if (err instanceof MyAppErrors) {
                logger.error(`MyAppError: ${err.message}`);
                res.status(err.statusCode).json(formatResponse(err.statusCode, err.message));
            } else {
                logger.error(`Unhandled error: ${err}`);
                res.status(500).json(formatResponse(500, 'Internal Server Error'));
            }
            return;
        }
    }

    /**
     * Rate limiting middleware to prevent too many requests
     */
    rateLimiter(windowMs = 15 * 60 * 1000, limit = 100) {
        return require('express-rate-limit')({
            windowMs,
            limit,
            standardHeaders: true,
            legacyHeaders: false,
            message: 'Too many requests from this IP, please try again later.',
            handler: (req, res, next, options) => {
                logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
                res.status(options.statusCode).json({
                    status: options.statusCode,
                    message: options.message,
                });
            },
        });
    }
}

module.exports = new Middlewares();
