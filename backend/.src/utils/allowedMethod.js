const { MethodNotAllowedError, BadRequestError } = require('../utils/error');

const MethodValidator = (allowedMethods) => {
    return (req, res, next) => {
        const { method, path } = req;
        if (!allowedMethods[path]) {
            return next(new BadRequestError(`${path} not available`));
        }
        if (!allowedMethods[path].includes(method)) {
            return next(new MethodNotAllowedError(`${method} method not allowed in ${path}`));
        }
        next();
    };
};

module.exports = MethodValidator;