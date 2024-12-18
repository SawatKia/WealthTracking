const { Ollama } = require('ollama');
const { Logger } = require('../utilities/Utils');
const appConfigs = require('../configs/AppConfigs');
const transactionTypes = require('../../statics/types.json');
const logger = Logger('OllamaService');
let logUpdate;

class OllamaService {
    constructor() {
        logger.info('Initializing OllamaService');
        (async () => {
            const logUpdateModule = await import('log-update');
            logUpdate = logUpdateModule.default;
        })();
        this.ollama = new Ollama({
            host: appConfigs.ollama?.host
        });
        this.modelName = appConfigs.ollama?.model;

        // Create a formatted string of all transaction types for the system prompt
        this.typesList = Object.entries(transactionTypes)
            .map(([category, types]) => `${category}: ${types.join(', ')}`)
            .join('\n');

        this.systemPrompt = `You are a financial transaction classifier. Your task is to analyze text from Thai payment slips and determine the most appropriate transaction type.

Available transaction types are:
${this.typesList}

Respond only with a JSON object in this format:
{
    "category": "one of: Expense, Income, or Transfer",
    "type": "specific type from the category",
    "confidence": "number between 0 and 1",
    "reasoning": "brief explanation of why this type was chosen"
}

Rules:
1. If the text mentions products or services, focus on those to determine the type
2. If multiple types could apply, choose the most specific one
3. If unsure, use the most general type within the appropriate category
4. For transfers between accounts, always use Transfer category
5. For unclear cases, set confidence below 0.7`;
        if (this.ollama) {
            logger.info('OllamaService initialized');
        } else {
            logger.error('OllamaService failed to initialize');
        }

        // Add properties for download tracking
        this.downloadStartTime = 0;
        this.lastProgressUpdate = 0;
        this.lastBytesCompleted = 0;
        this.speedHistory = [];
        this.SPEED_HISTORY_SIZE = 20; // Keep last 20 speed measurements

        // Add property for tracking current download
        this.currentDownloadId = 0;
    }

    /**
     * Check if model exists locally
     * @returns {Promise<boolean>}
     */
    async _isModelAvailable() {
        try {
            logger.info('Checking if model is available...');
            const models = await this.ollama.list();
            logger.debug(`Models: ${JSON.stringify(models)}`);
            const isAvailable = models.models.some(model => model.name.includes(this.modelName));
            logger.debug(`Model ${this.modelName} is available: ${isAvailable}`);
            return isAvailable;
        } catch (error) {
            logger.error('Error checking model availability:', error);
            return false;
        }
    }

    /**
     * Format bytes to human readable size
     * @param {number} bytes
     * @returns {string}
     */
    _formatSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }

    /**
     * Calculate download percentage
     * @param {number} completed
     * @param {number} total
     * @returns {string}
     */
    _calculateProgress(completed, total) {
        return ((completed / total) * 100).toFixed(2);
    }

    /**
     * Calculate and update moving average speed
     * @param {number} bytesCompleted
     * @param {number} currentTime
     * @returns {number} Average speed in bytes per second
     */
    _updateMovingAverageSpeed(bytesCompleted, currentTime) {
        const timeDiff = (currentTime - this.lastProgressUpdate) / 1000;
        const bytesDiff = bytesCompleted - this.lastBytesCompleted;

        if (timeDiff > 0) {
            const currentSpeed = bytesDiff / timeDiff;

            // Add current speed to history
            this.speedHistory.push(currentSpeed);

            // Keep only the last N measurements
            if (this.speedHistory.length > this.SPEED_HISTORY_SIZE) {
                this.speedHistory.shift();
            }

            // Calculate moving average, excluding outliers
            const validSpeeds = this.speedHistory.filter(speed => speed > 0);
            if (validSpeeds.length > 0) {
                return validSpeeds.reduce((a, b) => a + b) / validSpeeds.length;
            }
        }

        // Fallback to average speed since start if no valid moving average
        const totalTime = (currentTime - this.downloadStartTime) / 1000;
        return totalTime > 0 ? bytesCompleted / totalTime : 0;
    }

    /**
     * Format time duration to readable format
     * @param {number} seconds
     * @returns {string}
     */
    _formatTime(seconds) {
        if (!isFinite(seconds) || seconds <= 0) {
            return 'calculating...';
        }
        if (seconds < 60) {
            return `${Math.round(seconds)}s`;
        }
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.round(seconds % 60);
        return `${minutes}m ${remainingSeconds}s`;
    }

    /**
     * Format speed to human readable format
     * @param {number} bytesPerSecond
     * @returns {string}
     */
    _formatSpeed(bytesPerSecond) {
        return `${this._formatSize(bytesPerSecond)}/s`;
    }

    /**
     * Create a progress bar string
     * @param {number} percentage
     * @param {number} length
     * @returns {string}
     */
    _createProgressBar(percentage, length = 20) {
        const filledLength = Math.round(length * (percentage / 100));
        const empty = length - filledLength;
        return '█'.repeat(filledLength) + '▒'.repeat(empty);
    }

    /**
     * Pull the model if not available locally
     */
    async _ensureModel() {
        try {
            logger.info(`Checking if model ${this.modelName} is available...`);
            const isAvailable = await this._isModelAvailable();

            if (!isAvailable) {
                logger.info(`Model ${this.modelName} not found locally. Pulling...`);
                const progressResponse = await this.ollama.pull({
                    model: this.modelName,
                    stream: true
                });

                // Increment download ID to invalidate previous progress updates
                this.currentDownloadId++;
                const thisDownloadId = this.currentDownloadId;

                this.downloadStartTime = Date.now();
                this.lastProgressUpdate = this.downloadStartTime;
                this.lastBytesCompleted = 0;
                this.speedHistory = [];

                for await (const progress of progressResponse) {
                    // Skip if this isn't the most recent download
                    if (thisDownloadId !== this.currentDownloadId) continue;

                    if (progress.total && progress.completed) {
                        const currentTime = Date.now();
                        const downloadedSize = this._formatSize(progress.completed);
                        const totalSize = this._formatSize(progress.total);
                        const percentage = this._calculateProgress(progress.completed, progress.total);
                        const progressBar = this._createProgressBar(percentage);

                        // Calculate moving average speed and remaining time
                        const avgSpeed = this._updateMovingAverageSpeed(progress.completed, currentTime);
                        const remainingBytes = progress.total - progress.completed;
                        const remainingSeconds = avgSpeed > 0 ? remainingBytes / avgSpeed : 0;

                        const progressMessage =
                            `Downloading ${this.modelName}...\n` +
                            `${progressBar} ${percentage}% (${downloadedSize}/${totalSize})\n` +
                            `Speed: ${this._formatSpeed(avgSpeed)}\n` +
                            `Time remaining: ${this._formatTime(remainingSeconds)}`;

                        logUpdate(progressMessage);

                        // Update tracking variables
                        this.lastProgressUpdate = currentTime;
                        this.lastBytesCompleted = progress.completed;
                    }
                }

                // Clear the progress display when done
                logUpdate.clear();

                const totalTime = this._formatTime((Date.now() - this.downloadStartTime) / 1000);
                logger.info(`Model ${this.modelName} pulled successfully in ${totalTime}`);
            } else {
                logger.info(`Model ${this.modelName} is already available`);
            }
        } catch (error) {
            logUpdate.clear(); // Clear progress on error
            logger.error('Error ensuring model availability:', error);
            throw new Error(`Failed to ensure model availability: ${error.message}`);
        }
    }


    /**
     * Initialize the Ollama service and verify connection
     */
    async init() {
        try {
            logger.info('Testing Ollama connection...');
            await this.ollama.list();
            logger.info('Ollama connection successful');

            // Ensure model is available
            await this._ensureModel();

            // Test the model with a simple prompt
            logger.debug(`Testing model with prompt: "${'This is a test prompt. Please respond with "OK" if you can read this.'}"`);
            const testResponse = await this._timedGenerate({
                model: this.modelName,
                prompt: 'This is a test prompt. Please respond with "OK" if you can read this.',
                options: {
                    temperature: 0.1
                }
            });

            if (!testResponse.response) {
                logger.error('Model test failed: No response received');
                throw new Error('Model test failed: No response received');
            }
            logger.debug(`Model test response: ${JSON.stringify(testResponse)}`);

            logger.info('Model test successful');
        } catch (error) {
            logger.error('Failed to initialize Ollama service:', error.message);
            throw new Error('Ollama service initialization failed');
        }
    }

    /**
     * Classify transaction type from OCR text
     * @param {string} text - The OCR text from the slip
     * @returns {Promise<Object>} Classification result
     */
    async classifyTransaction(text) {
        try {
            logger.info('Classifying transaction from OCR text');
            logger.debug(`Input text: ${text}`);

            const response = await this._timedGenerate({
                model: this.modelName,
                prompt: text,
                system: this.systemPrompt,
                format: 'json',
                options: {
                    temperature: 0.3, // Lower temperature for more focused responses
                    top_k: 50,
                    top_p: 0.9
                }
            });
            logger.debug(`Ollama response: ${response.response}`);

            if (!response.response) {
                throw new Error('No response from Ollama');
            }

            try {
                const result = JSON.parse(response.response);
                logger.debug(`Classification result: ${JSON.stringify(result)}`);

                // Validate the response format
                if (!result.category || !result.type || !result.confidence) {
                    throw new Error('Invalid response format from LLM');
                }

                // Validate that the category and type exist in our types
                if (!transactionTypes[result.category]?.includes(result.type)) {
                    throw new Error('Invalid category or type returned by LLM');
                }

                if (result.confidence > 0.6) {
                    return result.type;
                }
            } catch (parseError) {
                logger.error('Failed to parse LLM response:', parseError);
                throw new Error('Invalid response format from LLM');
            }
        } catch (error) {
            logger.error('Error classifying transaction:', error);
            throw error;
        }
    }

    /**
     * Terminate the Ollama service
     */
    async terminate() {
        logger.info('Terminating OllamaService');
        // Add any cleanup code here if needed
    }

    /**
     * Wrapper for ollama.generate that includes timing
     * @param {Object} params - Parameters for generate
     * @returns {Promise<Object>} - Generation result
     */
    async _timedGenerate(params) {
        const startTime = Date.now();
        logger.debug(`Starting generation with prompt: ${JSON.stringify(params.prompt)}`);

        try {
            const response = await this.ollama.generate(params);
            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000; // Convert to seconds

            logger.info(`Generation completed in ${duration.toFixed(2)}s`);
            logger.debug(`Generation response: ${JSON.stringify(response)}`);

            return response;
        } catch (error) {
            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000;
            logger.error(`Generation failed after ${duration.toFixed(2)}s:`, error);
            throw error;
        }
    }
}

// Create and export a singleton instance
module.exports = new OllamaService(); 