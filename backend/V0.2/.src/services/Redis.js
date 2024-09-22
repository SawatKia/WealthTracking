const redis = require('redis');
const { promisify } = require('util');
const { Logger } = require('../utilities/Utils');

const logger = Logger('RedisService');

class RedisService {
    constructor() {
        this.client = null;
        this.connected = false;
    }

    async connect() {
        if (this.connected) {
            return;
        }

        this.client = redis.createClient({
            // You can add configuration options here
            // For example:
            // host: process.env.REDIS_HOST,
            // port: process.env.REDIS_PORT,
            // password: process.env.REDIS_PASSWORD,
        });

        this.client.on('error', (err) => {
            logger.error('Redis Client Error:', err);
        });

        this.client.on('ready', () => {
            logger.info('Redis client connected to Redis server.');
            this.connected = true;
        });

        // Promisify Redis commands
        ['get', 'set', 'del', 'exists', 'expire'].forEach((cmd) => {
            this[cmd] = promisify(this.client[cmd]).bind(this.client);
        });

        // Connect to Redis
        return new Promise((resolve, reject) => {
            this.client.once('ready', resolve);
            this.client.once('error', reject);
        });
    }

    async disconnect() {
        if (this.client) {
            await this.client.quit();
            this.connected = false;
            logger.info('Disconnected from Redis');
        }
    }

    async getClient() {
        if (!this.connected) {
            await this.connect();
        }
        return this.client;
    }

    // Helper method to set a key with expiration
    async setJsonEx(key, value, expireSeconds) {
        await this.set(key, JSON.stringify(value));
        await this.expire(key, expireSeconds);
    }

    // Helper method to get and parse JSON value
    async getJson(key) {
        const value = await this.get(key);
        return value ? JSON.parse(value) : null;
    }
}

// Create and export a singleton instance
module.exports = new RedisService();