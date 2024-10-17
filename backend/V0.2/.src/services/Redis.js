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

    // Helper method to set a key with expiration
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

    // Helper method to get and parse JSON value
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
}

// Create and export a singleton instance
module.exports = new RedisService();
