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
const getCaller = () => {
    const stack = new Error().stack;
    if (!stack) return '';
    const stackLines = stack.split('\n');
    if (stackLines.length < 4) return ''; // Make sure there's enough stack info
    const callerLine = stackLines[3].trim(); // 3rd line usually contains the caller info
    return callerLine.replace(/^at\s/, ''); // Clean up the line
}

class Logger {
    constructor(moduleName) {
        const isDevelopment = NODE_ENV === 'development' || NODE_ENV === 'test';

        const transports = [];
        // configure transports based on NODE_ENV
        if (NODE_ENV === 'production' || NODE_ENV === 'test') {
            // rotate error logs every day, keep for 7 days
            transports.push(new DailyRotateFile({
                filename: 'log/error-%DATE%.log',
                datePattern: 'YYYY-MM-DD',
                level: 'error',
                zippedArchive: true,
                maxSize: '20m',
                maxFiles: '7d'
            }));

            // rotate combined logs every day, keep for 14 days
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
                    return `[caller: ${info.caller ? `${info.caller}` : 'Unknown caller'}] ${info.level}: ${info.message}`;
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
                    return `${info.timestamp} [${info.label}] ${info.level} - ${info.message}`; // global log format  
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
