const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./configs/database');
const Logging = require('./configs/logger');
const path = require('path');
const userRoutes = require('./routes/UserRoutes');

const logger = new Logging('index');
const app = express();
const PORT = process.env.PORT || 3000;
const isDevelopment = process.env.NODE_ENV === 'development';
const router = express.Router();

app.use(cors());
app.use(express.json());
app.disable('x-powered-by');
// Log middleware
app.use((req, res, next) => {
    const { ip, method, path } = req;
    const allowedMethods = ["POST", "PUT", "PATCH", "DELETE"];

    if (allowedMethods.includes(req.method)) {
        logger.debug(`Incoming Request, ${ip} => ${method} ${path}   with ${JSON.stringify(req.body)}`);
    } else {
        logger.silly(`Incoming Request: Method=${method}, Path=${path}`);
    }

    res.on('finish', () => {
        if (allowedMethods.includes(req.method)) {
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
    res.send('you are on the api/v1 route');
})

router.use('/user', userRoutes);

app.use('/api/v1', router);

const startServer = async () => {
    try {
        logger.info('Trying to connect to database...');
        await connectDB();
        app.listen(PORT, '0.0.0.0', () => {
            logger.debug(`App listening on port ${PORT}`);
            if (isDevelopment) {
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