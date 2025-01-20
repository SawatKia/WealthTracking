const winston = require('winston');
const path = require('path');
const { format } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

const appConfigs = require('../configs/AppConfigs');

const NODE_ENV = appConfigs.environment;

const timezoned = () => {
    return new Date().toLocaleString('en-GB', {
        timeZone: 'Asia/Bangkok'
    });
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
    } catch (e) { }

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

        const transports = [];
        // configure transports based on NODE_ENV
        if (NODE_ENV === 'test') {
            const testRotateOptions = {
                datePattern: 'YYYY-MM-DD',
                zippedArchive: true,
                maxSize: '20m',
                maxFiles: '1d',
                createSymlink: true,
                // options: { start: 0, flags: 'r+' }
            };

            // rotate error logs for test environment
            transports.push(new DailyRotateFile({
                ...testRotateOptions,
                filename: 'log/error-%DATE%.log',
                level: 'error',
                symlinkName: 'current-error.log',
            }));

            // rotate combined logs for test environment
            transports.push(new DailyRotateFile({
                ...testRotateOptions,
                filename: 'log/combined-%DATE%.log',
                symlinkName: 'current-combined.log',
            }));
        } else if (NODE_ENV === 'production') {
            // rotate error logs for production environment
            transports.push(new DailyRotateFile({
                filename: 'log/error-%DATE%.log',
                datePattern: 'YYYY-MM-DD',
                level: 'error',
                zippedArchive: true,
                maxSize: '20m',
                maxFiles: '7d'
            }));

            // rotate combined logs for production environment
            transports.push(new DailyRotateFile({
                filename: 'log/combined-%DATE%.log',
                datePattern: 'YYYY-MM-DD',
                zippedArchive: true,
                maxSize: '20m',
                maxFiles: '14d'
            }));
        }
        // add console transport for error and info levels
        transports.push(new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(info => {
                    return `[${info.caller ? info.caller : info.label}] ${info.level}: ${info.message}`;
                })
            )
        }));


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
                    return `${info.timestamp} [${info.caller || info.label}] ${info.level} - ${info.message}`; // global log format, if not specified
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
