const winston = require('winston');
const path = require('path');
const { format } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const appConfigs = require('../configs/AppConfigs');

const NODE_ENV = appConfigs.environment;

const timezoned = () => {
    const d = new Date();
    const ms = d.getMilliseconds();
    // Always pad milliseconds to 3 digits
    const paddedMs = ms.toString().padStart(3, '0');

    // Get the base datetime string without milliseconds
    const baseDateTime = d.toLocaleString('en-GB', {
        timeZone: 'Asia/Bangkok',
        hour12: false,
    });

    // Return the formatted datetime with 3-digit milliseconds
    return baseDateTime.replace(/(\d{2}:\d{2}:\d{2})(?:\.\d+)?/, `$1.${paddedMs}`);
}

// Utility function to extract calling method from stack trace
function getCaller() {
    const originalFunc = Error.prepareStackTrace;

    let callerFile;
    try {
        const err = new Error();
        let currentFile;

        Error.prepareStackTrace = function (err, stack) { return stack; };
        currentFile = err.stack.shift().getFileName();

        while (err.stack.length) {
            callerFile = err.stack.shift();
            if (currentFile !== callerFile.getFileName()) break;
        }
    } catch (e) {
        console.error('Error retrieving caller information:', e);
    }

    Error.prepareStackTrace = originalFunc;

    if (!callerFile) return 'unknown:0:0';

    const callerLine = callerFile.getLineNumber();
    const callerFunction = callerFile.getFunctionName() || 'anonymous';
    const callerFileName = callerFile.getFileName().split('/').pop();

    return `${callerFileName}/${callerFunction}():${callerLine}`;
}

class Logger {
    constructor(moduleName) {
        const isDevelopment = NODE_ENV === 'development' || NODE_ENV === 'test';

        const testLogDir = path.join(
            appConfigs.environment === 'production'
                ? '/usr/src/' + process.env.APP_DOMAIN + '/logs'
                : path.join(__dirname, '../logs/')
        );

        const commonRotateOptions = {
            dirname: testLogDir,
            datePattern: NODE_ENV === 'test' ? 'YYYY-MM-DD-HH' : 'YYYY-MM-DD',      // Adds hours and minutes to the filename
            zippedArchive: NODE_ENV === 'production' ? true : false,                // Compress old log files
            maxFiles: NODE_ENV === 'test' ? '7d' : '14d',                           // Retain logs for 14 days
        };

        const transports = [];
        const fileTransport = new DailyRotateFile({
            ...commonRotateOptions,
            filename: 'combined-%DATE%.log',
            symlinkName: 'current-combined.log',
            level: 'debug', // Log debug and above levels to file
        });

        const consoleTransport = new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(info => {
                    return `${info.timestamp} [${info.caller ? info.caller : info.label}] ${info.level}: ${info.message}`;
                })
            ),
            level: NODE_ENV == 'development' ? 'debug' : 'info', // Log only info and above to console
        });

        if (NODE_ENV != 'development') {
            // configure transports based on test and production environments
            transports.push(fileTransport);
        }
        // write  logs to console for any log levels and environments
        transports.push(consoleTransport);


        this.logger = winston.createLogger({
            level: isDevelopment ? 'debug' : 'info',
            // level: 'silly',
            format: winston.format.combine(
                format.timestamp({
                    format: timezoned
                }),
                winston.format.errors({ stack: true }),
                winston.format.splat(),
                winston.format.label({ label: moduleName }),
                winston.format.printf(info => {
                    return `${info.timestamp} [${info.caller || info.label}] ${info.level} - ${info.message}`; // default (global) log format, if not specified
                })
            ),
            defaultMeta: { service: 'wealthtrack-backend' },
            transports: transports
        });

        this.logger.isDebugEnabled = () => isDevelopment;
    }

    log(level, message) {
        this.logger.log(level, message, { caller: getCaller() });
    }

    info(message) {
        this.logger.info(message, { caller: getCaller() });
    }

    warn(message) {
        this.logger.warn(message, { caller: getCaller() });
    }

    error(message) {
        this.logger.error(message, { caller: getCaller() });
    }

    debug(message) {
        this.logger.debug(message, { caller: getCaller() });
    }

    silly(message) {
        this.logger.silly(message, { caller: getCaller() });
    }

    verbose(message) {
        this.logger.verbose(message, { caller: getCaller() });
    }
}

module.exports = Logger;
