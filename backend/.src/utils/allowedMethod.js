const { MethodNotAllowedError, BadRequestError } = require('../utils/error');

const MethodValidator = (allowedMethods) => {
    return (req, res, next) => {
        const { method, path } = req;

        // replace any id in the path with :userId
        const pathWithParams = path.replace(/\/[0-9a-fA-F]{24}$/, '/:userId');
        // Check if the exact path or the modified path exists in allowedMethods
        if (!allowedMethods[path] && !allowedMethods[pathWithParams]) {
            return next(new BadRequestError(`${path} not available`));
        }

        // Get the allowed methods for the exact path or the modified path
        const methods = allowedMethods[path] || allowedMethods[pathWithParams];
        // Check if the method is allowed for the path
        if (!methods.includes(method)) {
            return next(new MethodNotAllowedError(`${method} method not allowed in ${path}`));
        }

        next();
    };
};

module.exports = MethodValidator;
