const winston = require('winston');

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
    //  ensure that your logs are saved persistently
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
    ]
});

if (isDevelopment) {
    // output log messages to the console (terminal).
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// Add a custom method to check if debug is enabled
logger.isDebugEnabled = () => isDevelopment;

module.exports = logger;