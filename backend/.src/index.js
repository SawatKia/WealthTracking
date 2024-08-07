const express = require('express');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit')
require('dotenv').config();

const connectDB = require('./configs/database');
const Logging = require('./configs/logger');
const path = require('path');

const userRoutes = require('./routes/UserRoutes');
const BankAccountRoutes = require('./routes/BankAccountRoutes');
const formatResponse = require('./utils/responseFormatter');

const logger = new Logging('index');
const app = express();
const PORT = process.env.PORT || 3000;
const isDev = process.env.NODE_ENV === 'development';
const router = express.Router();
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: 'Too many requests from this IP, please try again later.',
    handler: (req, res, next, options) => {
        logger.warn(`Rate limit exceeded for IP ${req.ip}`);
        res.status(options.statusCode).json(formatResponse(options.statusCode, options.message));
    },
})
!isDev && app.use(limiter);
//app.use(cors());
app.use(express.json());
app.disable('x-powered-by');
// Log middleware
app.use((req, res, next) => {
    const { ip, method, path } = req;
    const debugMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"];

    if (debugMethods.includes(req.method)) {
        logger.debug(`Incoming Request, ${ip} => ${method} ${path}   with ${JSON.stringify(req.body)}`);
    } else {
        logger.silly(`Incoming Request: Method=${method}, Path=${path}`);
    }

    res.on('finish', () => {
        if (debugMethods.includes(req.method)) {
            logger.debug(`Outgoing response, ${path} => ${res.statusCode} ${res.statusMessage} => ${ip} `);
        } else {
            logger.silly(`Outgoing response: Method=${method}, Path=${path}, Status=${res.statusCode}`);
        }
    });

    next();
});
// Serve static files from the frontend build directory
app.use(express.static(path.join(__dirname, '../frontend_build')));

app.get("/api/v1", (req, res) => {
    res.status(200).json(formatResponse(200, 'you are connected to the API'));
})

router.use('/users', userRoutes);
router.use('/bank-accounts', BankAccountRoutes);

app.use('/api/v1', router);

const startServer = async () => {
    try {
        logger.info('Trying to connect to database...');
        await connectDB();
        app.listen(PORT, '0.0.0.0', () => {
            logger.debug(`App listening on port ${PORT}`);
            if (isDev) {
                logger.info('Starting server in debug mode...');
            } else {
                logger.info('Starting Production server...');
            }
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

logger.info('Trying to start server...');
startServer();