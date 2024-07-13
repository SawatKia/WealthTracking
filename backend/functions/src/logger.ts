import { createLogger, format, transports } from "winston";
import { LoggingWinston } from "@google-cloud/logging-winston";

const logger = createLogger({
    level: "debug",
    format: format.combine(
        format.colorize(),
        format.timestamp({
            format: "YYYY-MM-DD HH:mm:ss",
        }),
        format.errors({ stack: true }),
        format.splat(),
        format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)),
    transports: [new transports.Console(),
        new LoggingWinston(),
    ]
});

export default logger