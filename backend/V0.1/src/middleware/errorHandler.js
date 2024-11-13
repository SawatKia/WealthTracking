const Logging = require('../configs/logger');
const { AppError } = require('../utils/error');
const formatResponse = require('../utils/responseFormatter');

const logger = new Logging('ErrorHandler');

const errorHandler = (err, req, res, next) => {
    if (err instanceof AppError) {
        res.status(err.statusCode).json(formatResponse(err.statusCode, err.message));
    } else {
        logger.error(err);
        res.status(500).json(formatResponse(500, 'Something went wrong'));
    }
};

module.exports = errorHandler;
