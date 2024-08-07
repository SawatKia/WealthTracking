const formatResponse = require('../utils/responseFormatter');

const responseHandler = (req, res, next) => {
    if (req.formattedResponse) {
        const { status_code, message, data } = req.formattedResponse;
        res.status(status_code).json(formatResponse(status_code, message, data));
    } else {
        next();
    }
};

module.exports = responseHandler;
