const Logging = require('../configs/logger');
const formatResponse = require('../utils/responseFormatter');

const Logger = new Logging('ResponseHandler');

const responseHandler = (req, res, next) => {
    if (req.formattedResponse) {
        const { status_code, message, data } = req.formattedResponse;
        Logger.debug(`Sending response to client, status_code: ${status_code}, message: ${message}`);
        res.status(status_code).json(formatResponse(status_code, message, data));
    } else {
        next();
    }
};

module.exports = responseHandler;
