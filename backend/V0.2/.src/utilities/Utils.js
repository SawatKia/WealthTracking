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

    static formatDateToBkk(date) {
        if (!date) {
            return null;
        }
        const bkkDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
        return bkkDate.toISOString().split('T')[0];
    }
}

module.exports = Utils