const winston = require('winston');
const path = require('path');

require('dotenv').config();


class Logger {
    constructor(moduleName) {
        const isDevelopment = process.env.NODE_ENV === 'development';

        this.logger = winston.createLogger({
            level: isDevelopment ? 'debug' : 'info',
            format: winston.format.combine(
                winston.format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss'
                }),
                winston.format.errors({ stack: true }),
                winston.format.splat(),
                winston.format.label({ label: moduleName }), // Add label with moduleName
                winston.format.printf(info => {
                    return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`; // Use label instead of moduleName
                })
            ),
            defaultMeta: { service: 'wealthtrack-backend' },
            transports: [
                new winston.transports.File({ filename: 'error.log', level: 'error' }),
                isDevelopment ? new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.printf(info => {// make it still colorized
                            return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
                        })
                    )
                }) : new winston.transports.File({ filename: 'combined.csv', format: winston.format.combine(winston.format.csv()) })
            ]
        });

        // Add a custom method to check if debug is enabled
        this.logger.isDebugEnabled = () => isDevelopment;
    }

    log(level, message) {
        this.logger.log(level, message);
    }

    info(message) {
        this.logger.info(message);
    }

    warn(message) {
        this.logger.warn(message);
    }

    error(message) {
        this.logger.error(message);
    }

    debug(message) {
        this.logger.debug(message);
    }
    silly(message) {
        this.logger.silly(message);
    }

    verbose(message) {
        this.logger.verbose(message);
    }
}

module.exports = Logger;
