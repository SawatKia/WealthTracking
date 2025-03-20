const Logger = require('./Logger');

class Utils {
    static formatResponse(status_code, message, data, headers = {}) {
        return {
            status_code: status_code,
            message: message,
            data: data,
            ...(headers || {}),
        };
    }


    static Logger(moduleName) {
        return new Logger(moduleName);
    }
    /**
     * Formats a given Date object as a string that represents the time
     * in the Asia/Bangkok timezone. The string is formatted as
     * "Weekday, Year Month Day, Hour:Minute:Second Timezone".
     * @param {Date} time - Date object to format
     * @returns {string} Formatted string
     */

    static formatBkkTime(time) {
        const date = new Date(time);
        const options = {
            timeZone: 'Asia/Bangkok',
            weekday: 'short',
            day: 'numeric',
            month: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3,
            hour12: false,
            timeZoneName: 'short'
        };
        return date.toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', ...options }) + "; ";
    }
}

module.exports = Utils;