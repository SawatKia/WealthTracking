const mongoose = require('mongoose');
const Logging = require('./logger');

const logger = new Logging('Database');
const MONGO_USERNAME = process.env.MONGO_INITDB_ROOT_USERNAME;
const MONGO_PASSWORD = process.env.MONGO_INITDB_ROOT_PASSWORD;
const DB_NAME = process.env.DB_NAME;
const MONGO_HOST = process.env.MONGO_HOST || 'localhost';

const MONGO_URI = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOST}:27017/${DB_NAME}?authSource=admin`;

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        logger.info('Connected to MongoDB');
        logger.debug(`Connected to MongoDB at Mongo Host: ${MONGO_HOST}`);
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
};

module.exports = connectDB;