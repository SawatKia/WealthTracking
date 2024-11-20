const Logger = require('./Logger');

class Utils {
    static formatResponse(status_code, message, data, headers = {}) {
        return {
            status_code: status_code,
            message: message,
            data: data,
            ...(headers || {}),
        }
    }

    static Logger(moduleName) {
        return new Logger(moduleName);
    }
}

module.exports = Utils