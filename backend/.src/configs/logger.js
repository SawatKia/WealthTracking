const winston = require('winston');
const path = require('path');

const isDevelopment = process.env.NODE_ENV === 'development';

const logger = winston.createLogger({
    level: isDevelopment ? 'debug' : 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'wealthtrack-backend' },
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        isDevelopment ? new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }) : new winston.transports.File({ filename: 'combined.csv', format: winston.format.combine(winston.format.csv()) })
    ]
});

// Add a custom method to check if debug is enabled
logger.isDebugEnabled = () => isDevelopment;

module.exports = logger;