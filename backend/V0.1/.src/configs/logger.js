const winston = require('winston');
const path = require('path');
const { format } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

require('dotenv').config();
const timezoned = () => {
    return new Date().toLocaleString('en-GB', {
        timeZone: 'Asia/Bangkok'
    });
}

class Logger {
    constructor(moduleName) {
        const isDevelopment = process.env.NODE_ENV === 'development';

        const transports = [
            new DailyRotateFile({
                filename: 'log/error-%DATE%.log',
                datePattern: 'YYYY-MM-DD',
                level: 'error',
                zippedArchive: true,
                maxSize: '20m',
                maxFiles: '7d'
            })
        ];

        if (isDevelopment) {
            transports.push(new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.printf(info => {
                        return `[${info.label}] ${info.level}: ${info.message}`; // specify log format for console
                    })
                )
            }));
        } else {
            transports.push(new DailyRotateFile({
                filename: 'log/combined-%DATE%.log',
                datePattern: 'YYYY-MM-DD',
                zippedArchive: true,
                maxSize: '20m',
                maxFiles: '14d'
            }));
        }

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
                    return `${info.timestamp}, [${info.label}], ${info.level}, ${info.message}`; // global log format  
                })
            ),
            defaultMeta: { service: 'wealthtrack-backend' },
            transports: transports
        });

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
