const formatResponse = (status_code, message, data = null) => {
    return {
        status_code,
        message,
        data
    };
};

module.exports = formatResponse;