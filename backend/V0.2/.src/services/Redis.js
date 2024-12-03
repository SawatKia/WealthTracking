const redis = require('redis');

const appConfigs = require('../configs/AppConfigs');
const { Logger } = require('../utilities/Utils');

const logger = Logger('RedisService');

class RedisService {
    constructor() {
        this.client = null;
        this.connected = false;
    }

    async connect() {
        try {
            logger.debug('Attempting to connect to Redis');
            if (this.connected) {
                logger.debug('Already connected to Redis');
                return;
            }

            this.client = redis.createClient({
                url: `redis://${appConfigs.redis.host}:${appConfigs.redis.port}`,
            });

            this.client.on('error', (err) => {
                logger.error('Redis Client Error:', err);
                this.connected = false;
            });

            this.client.on('ready', () => {
                logger.info('Redis client connected to Redis server.');
                this.connected = true;
            });

            await this.client.connect();

            // Promisify Redis commands
            ['get', 'set', 'del', 'exists', 'expire'].forEach((cmd) => {
                this[cmd] = this.client[cmd].bind(this.client);
            });

            logger.info('Redis connection established');
        } catch (error) {
            logger.error('Error connecting to Redis:', error);
            throw error;
        }
    }

    async disconnect() {
        try {
            logger.debug('Attempting to disconnect from Redis');
            if (this.client) {
                await this.client.quit();
                this.connected = false;
                logger.info('Disconnected from Redis');
            } else {
                logger.debug('No Redis client to disconnect');
            }
        } catch (error) {
            logger.error('Error disconnecting from Redis:', error);
            throw error;
        }
    }

    async getClient() {
        try {
            logger.debug('Getting Redis client');
            if (!this.connected) {
                logger.debug('Not connected, attempting to connect');
                await this.connect();
            }
            return this.client;
        } catch (error) {
            logger.error('Error getting Redis client:', error);
            throw error;
        }
    }

    /**
     * Sets a JSON object with an expiration time.
     * @param {string} key - The key to set
     * @param {object} value - The value to set
     * @param {number} expireSeconds - The expiration time in seconds
     */
    async setJsonEx(key, value, expireSeconds) {
        try {
            logger.debug(`Setting JSON with expiration - Key: ${key}, ExpireSeconds: ${expireSeconds}`);
            const client = await this.getClient();
            await client.set(key, JSON.stringify(value), {
                EX: expireSeconds
            });
            logger.debug(`Successfully set JSON with expiration - Key: ${key}`);
        } catch (error) {
            logger.error(`Error setting JSON with expiration - Key: ${key}:`, error);
            throw error;
        }
    }

    /**
     * Gets a JSON object from Redis.
     * @param {string} key - The key to get
     * @returns {object} - The parsed JSON value
     */
    async getJson(key) {
        try {
            logger.debug(`Getting JSON - Key: ${key}`);
            const client = await this.getClient();
            const value = await client.get(key);
            const parsedValue = value ? JSON.parse(value) : null;
            logger.debug(`Retrieved JSON - Key: ${key}, Value found: ${!!value}`);
            return parsedValue;
        } catch (error) {
            logger.error(`Error getting JSON - Key: ${key}:`, error);
            throw error;
        }
    }

    /**
     * Deletes a key from Redis.
     * @param {string} key - The key to delete
     */
    async delete(key) {
        try {
            logger.debug(`Deleting key - Key: ${key}`);
            const client = await this.getClient();
            await client.del(key);
            logger.debug(`Successfully deleted key - Key: ${key}`);
        } catch (error) {
            logger.error(`Error deleting key - Key: ${key}:`, error);
            throw error;
        }
    }

    async listCache() {
        try {
            logger.info('Listing all cache entries using scan iterator');
            const client = await this.getClient();

            const results = [];
            for await (const key of client.scanIterator()) {
                try {
                    const value = await this.getJson(key);
                    if (value !== null) {
                        results.push({ key, value });
                    }
                } catch (error) {
                    logger.warn(`Error getting value for key ${key}: ${error.message}`);
                    // Continue with next key even if one fails
                    continue;
                }
            }

            logger.debug(`Found ${results.length} valid cache entries`);
            return results;
        } catch (error) {
            logger.error('Error listing cache entries:', error);
            throw error;
        }
    }
}

// Create and export a singleton instance
module.exports = new RedisService();
