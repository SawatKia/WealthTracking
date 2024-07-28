const { MethodNotAllowedError, BadRequestError } = require('../utils/error');
const logging = require('../configs/logger');
require('dotenv').config();

const logger = new logging('allowedMethod');

const MethodValidator = (allowedMethods) => {
    return (req, res, next) => {
        logger.info('Validating request method');
        const { method, path } = req;
        logger.debug(`Validating ${method} method for ${path}`);
        // Replace any id in the path with :userId
        const pathWithParams = path.replace(/\/[0-9a-fA-F]{24}$/, '/:userId');
        logger.debug(`Modified path: ${pathWithParams}`);

        // Check if the exact path or the modified path exists in allowedMethods
        if (!allowedMethods[path] && !allowedMethods[pathWithParams]) {
            logger.error(`${path} not available`);
            return next(new BadRequestError(`${path} not available`));
        }
        logger.info(`${path} available`);

        // Get the allowed methods for the exact path or the modified path
        const methods = allowedMethods[path] || allowedMethods[pathWithParams];
        logger.debug(`Allowed methods: ${methods}`);

        // Check if the method is allowed for the path
        if (!methods.includes(method)) {
            logger.error(`${method} method not allowed in ${path}`);
            if (process.env.NODE_ENV === 'development') {
                return next(new MethodNotAllowedError(`${method} method not allowed in ${path}`));
            }
            return next(new MethodNotAllowedError('Method not allowed'));
        }
        logger.info(`${method} method allowed in ${path}`);

        next();
    };
};

module.exports = MethodValidator;
