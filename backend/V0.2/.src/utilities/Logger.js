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

        // Generate unique log directory for test runs
        const testLogDir = path.join(
            __dirname,
            '../../logs',
            NODE_ENV === 'test' ? `test-run-${process.env.JEST_WORKER_ID || Date.now()}` : ''
        );

        const commonRotateOptions = {
            dirname: testLogDir,
            datePattern: NODE_ENV === 'test' ? 'YYYY-MM-DD-HH-mm' : 'YYYY-MM-DD', // Adds hours and minutes to the filename
            zippedArchive: true,             // Compress old log files
            // maxSize: '100m',                  // Maximum size of a single log file 100 MB
            maxFiles: NODE_ENV === 'test' ? '7d' : '14d',                  // Retain logs for 14 days
            frequency: '10m'                 // Rotate logs every 10 minutes
        };

        const transports = [];
        if (NODE_ENV != 'development') {
            // configure transports based on test and production environments
            transports.push(new DailyRotateFile({
                ...commonRotateOptions,
                filename: 'combined-%DATE%.log',
                symlinkName: 'current-combined.log',
            }));
        }
        // add console transport for error and info levels for all environments
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
