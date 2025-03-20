const Redis = require('../services/Redis');
const { Logger, formatResponse } = require('../utilities/Utils');

const logger = Logger('CacheController');

class CacheController {
    async set(req, res, next) {
        logger.info('Entering set method');
        try {
            const { key, value, expireSeconds } = req.body;
            logger.debug(`Received set request - Key: ${key}, Value: ${JSON.stringify(value)}, ExpireSeconds: ${expireSeconds}`);

            if (!key || !value) {
                logger.warn('Missing key or value in set request');
                req.formattedResponse = formatResponse(400, 'Key and value are required', null);
                return next();
            }

            const ttl = expireSeconds || 3600;
            logger.debug(`Setting cache with TTL: ${ttl} seconds`);

            await Redis.connect(); // Ensure Redis is connected
            await Redis.setJsonEx(key, value, ttl);

            logger.info(`Cache set successfully for key: ${key}`);
            req.formattedResponse = formatResponse(200, '[DEV ONLY] Cache set successfully', {
                warning: '⚠️ This endpoint is for development purposes only. Do not use in production.',
                data: { key }
            });
            next();
        } catch (error) {
            logger.error(`Error setting cache: ${error.message}`, { stack: error.stack });
            req.formattedResponse = formatResponse(500, 'Error setting cache', null);
            next();
        }
    }

    async get(req, res, next) {
        logger.info('Entering get method');
        try {
            const { key } = req.params;
            logger.debug(`Received get request for key: ${key}`);

            if (!key) {
                logger.warn('Missing key in get request');
                return res.status(400).json({ message: 'Key is required' });
            }

            const value = await Redis.getJson(key);
            logger.debug(`Retrieved value for key ${key}: ${JSON.stringify(value)}`);

            if (value === null) {
                logger.info(`Cache key not found: ${key}`);
                req.formattedResponse = formatResponse(404, 'Cache key not found', null);
            } else {
                logger.info(`Cache retrieved successfully for key: ${key}`);
                req.formattedResponse = formatResponse(200, '[DEV ONLY] Cache retrieved successfully', {
                    warning: '⚠️ This endpoint is for development purposes only. Do not use in production.',
                    data: { key, value }
                });
            }
            next();
        } catch (error) {
            logger.error(`Error getting cache: ${error.message}`, { stack: error.stack });
            next(error);
        }
    }

    async delete(req, res, next) {
        logger.info('Entering delete method');
        try {
            const { key } = req.params;
            logger.debug(`Received delete request for key: ${key}`);

            if (!key) {
                logger.warn('Missing key in delete request');
                return res.status(400).json({ message: 'Key is required' });
            }

            const result = await Redis.del(key);
            logger.debug(`Delete operation result for key ${key}: ${result}`);

            if (result === 1) {
                logger.info(`Cache deleted successfully for key: ${key}`);
                req.formattedResponse = formatResponse(200, '[DEV ONLY] Cache deleted successfully', {
                    warning: '⚠️ This endpoint is for development purposes only. Do not use in production.',
                    data: { key }
                });
            } else {
                logger.info(`Cache key not found for deletion: ${key}`);
                req.formattedResponse = formatResponse(404, 'Cache key not found', null);
            }
            next();
        } catch (error) {
            logger.error(`Error deleting cache: ${error.message}`, { stack: error.stack });
            next(error);
        }
    }

    async getAll(req, res, next) {
        logger.info('Entering getAll method');
        try {
            const results = await Redis.listCache();

            if (!results || results.length === 0) {
                logger.info('No cache keys found');
                req.formattedResponse = formatResponse(200, '[DEV ONLY] No cache keys found', {
                    warning: '⚠️ This endpoint is for development purposes only. Do not use in production.',
                    data: []
                });
                return next();
            }

            logger.info(`Retrieved ${results.length} cache entries successfully`);
            req.formattedResponse = formatResponse(200, '[DEV ONLY] Cache entries retrieved successfully', {
                warning: '⚠️ This endpoint is for development purposes only. Do not use in production.',
                data: results
            });
            next();
        } catch (error) {
            logger.error(`Error getting all cache entries: ${error.message}`);
            req.formattedResponse = formatResponse(500, '[DEV ONLY] Error getting cache entries', {
                warning: '⚠️ This endpoint is for development purposes only. Do not use in production.',
                error: error.message
            });
            next();
        }
    }
}

module.exports = new CacheController();
