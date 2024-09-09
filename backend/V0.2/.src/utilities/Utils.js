const Logger = require('./Logger');
const AppError = require('./AppErrors')

class Utils {
    static formatResponse(status_code, message, data) {
        return {
            status_code: status_code,
            message: message,
            data: data
        }
    }

    static Logger(moduleName) {
        return new Logger(moduleName);
    }


}

module.exports = Utils