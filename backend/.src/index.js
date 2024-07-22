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

app.use(cors());
app.use(express.json());
// Log middleware
app.use((req, res, next) => {
    const { ip, method, path } = req;
    logger.silly(`Incoming request: IP=${ip}, Method=${method}, Path=${path}`);
    if (req.method == "POST" ||
        req.method == "PUT" ||
        req.method == "PATCH" ||
        req.method == "DELETE") {
        logger.debug(`Incoming Request, body: IP=${ip}, Method=${method}, Path=${path}, Body=${JSON.stringify(req.body)}`);
    }
    res.on('finish', () => {
        if (req.method == "POST" ||
            req.method == "PUT" ||
            req.method == "PATCH" ||
            req.method == "DELETE") {
            logger.debug(`Response status=${res.statusCode}`);
        }
        logger.silly(`Outgoing response: IP=${ip}, Method=${method}, Path=${path}, Status=${res.statusCode}`);
    });
    next();
});
// Serve static files from the frontend build directory
app.use(express.static(path.join(__dirname, '../frontend_build')));

app.get("/api/v1", (req, res) => {
    res.send('you are on the api/v1 route');
})
app.use('/api/v1/user', userRoutes);

const startServer = async () => {
    try {
        logger.info('Trying to connect to database...');
        await connectDB();
        app.listen(PORT, '0.0.0.0', () => {
            logger.debug(`App listening on port ${PORT}`);
            if (isDevelopment) {
                logger.info('Starting server in debug mode...');
            } else {
                logger.info('Starting server...');
            }
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

logger.info('Trying to start server...');
startServer();