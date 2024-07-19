const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./database');
const logger = require('./logger');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
// cannot access the process.env throw the error


app.use(cors());
app.use(express.json());
// Serve static files from the frontend build directory
app.use(express.static(path.join(__dirname, '../frontend_build')));
app.get("/api/v1", (req, res) => {
    res.send('you are on the api/v1 route')
})

const startServer = async () => {
    try {
        logger.info('Trying to connect to database...');
        await connectDB();
        app.listen(PORT, '0.0.0.0', () => {
            logger.debug(`App listening on port ${PORT}`);
            if (logger.isDebugEnabled()) {
                logger.info('Starting server in debug mode...');
            } else {
                logger.info('Starting server...');
            }
            logger.info('Press Ctrl+C to quit.');
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

logger.info('Trying to start server...');
startServer();