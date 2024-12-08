const fs = require('fs');
const os = require('os');

const { createScheduler, createWorker } = require('tesseract.js');
const { Logger } = require('../utilities/Utils');
const appConfigs = require('../configs/AppConfigs');
const logger = Logger('TesseractService');

class TesseractService {
    constructor() {
        logger.info('Initializing TesseractService');

        // Generate whitelist for supported characters
        const generateWhitelist = () => {
            const englishLower = 'abcdefghijklmnopqrstuvwxyz';
            const englishUpper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const numbers = '0123456789';
            const thaiChars = 'กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮะัาำิีึืุู฿เแโใไๅๆ็่้๊๋์ํ๎๏๐๑๒๓๔๕๖๗๘๙๚๛';
            return englishLower + englishUpper + numbers + thaiChars;
        };

        // configuration reference: https://github.com/tesseract-ocr/tesseract/blob/main/doc/tesseract.1.asc#options
        this.params = {
            tessedit_pageseg_mode: 12,  // PSM_SPARSE_TEXT_OSD
            tessedit_char_whitelist: generateWhitelist(),
            preserve_interword_spaces: '1'
        };

        // Initialize scheduler and workers pool
        this.scheduler = null;
        this.workerLimit = Math.min(os.cpus().length, 4);
        this.jobCounter = 0;
        this.MAX_JOBS_BEFORE_RESET = Math.min(500, Math.floor(os.freemem() / appConfigs.tesseract.memoryPerJob));

        const tessProperties = 'WorkerLimit: ' + this.workerLimit + ', MaxJobsBeforeReset: ' + this.MAX_JOBS_BEFORE_RESET;
        logger.debug(`Tesseract properties: ${tessProperties}`);
        logger.debug(`Tesseract config: ${JSON.stringify(this.params)}`);
    }

    async initializeScheduler() {
        logger.info('Initializing scheduler');
        this.scheduler = createScheduler();

        // Create worker pool
        for (let i = 0; i < this.workerLimit; i++) {
            const worker = await createWorker(['eng', 'tha'], 1, {
                // langPath: '../../statics/tranieddata',
                logger: m => logger.silly(`Worker[${i + 1}]: ${JSON.stringify(m)}`),
                errorHandler: err => logger.error(`Worker[${i + 1}] error: ${err}`),
            });

            logger.debug(`Worker[${i + 1}] initialized`);
            await worker.setParameters(this.params);
            this.scheduler.addWorker(worker);
            logger.debug(`Worker[${i + 1}] added to scheduler`);
        }
        const numWorkers = this.scheduler.getNumWorkers();
        logger.debug(`Number of workers was initialized: ${numWorkers}/${this.workerLimit}`);
        if (numWorkers <= this.workerLimit) {
            logger.info('TesseractService initialized');
        }
    }

    /**
     * Check and reset scheduler if needed based on job count
     * @param {number} jobCount - Number of jobs to add to counter
     * @param {boolean} force - Force reset regardless of counter
     */
    async resetSchedulerIfNeeded(jobCount = 1, force = false) {
        logger.info('Resetting scheduler if needed');
        logger.debug(`jobCount: ${jobCount}, force: ${force}`);
        this.jobCounter += jobCount;

        if (force || this.jobCounter >= this.MAX_JOBS_BEFORE_RESET) {
            logger.info('Resetting scheduler', {
                reason: force ? 'forced reset' : 'job limit reached',
                jobsProcessed: this.jobCounter
            });
            await this.scheduler.terminate();
            await this.initializeScheduler();
            this.jobCounter = 0;
        }
        logger.debug(`Job counter: ${this.jobCounter}`);
    }

    /**
     * Validate image buffer
     * @param {Buffer} buffer - Image buffer to validate
     * @returns {boolean} - True if valid, throws error if invalid
     */
    _validateImageBuffer(buffer) {
        logger.info('Validating image buffer');
        logger.debug(`Buffer: ${JSON.stringify(buffer).substring(0, 100)}${JSON.stringify(buffer).length > 100 ? "...[truncated]..." : ""}`);
        logger.debug(`Buffer length: ${buffer.length}`);
        if (!Buffer.isBuffer(buffer)) {
            logger.error('Invalid image: Not a buffer');
            throw new Error('Invalid image: Not a buffer');
        }
        if (buffer.length === 0) {
            logger.error('Invalid image: Empty buffer');
            throw new Error('Invalid image: Empty buffer');
        }

        // Check for common image headers
        const headers = {
            jpg: [0xFF, 0xD8],
            png: [0x89, 0x50, 0x4E, 0x47],
            gif: [0x47, 0x49, 0x46]
        };

        for (const [format, header] of Object.entries(headers)) {
            if (header.every((byte, i) => buffer[i] === byte)) {
                logger.debug(`Valid ${format} image detected`);
                return true;
            }
        }

        throw new Error('Invalid image: Unrecognized format or corrupted file');
    }

    /**
     * Recognize text from an image
     * @param {Buffer} imageBuffer - Image buffer
     * @returns {Promise<string>} Recognized text
     * @throws {Error} If image is invalid
     */
    async recognize(imageBuffer) {
        try {
            if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
                throw new Error('Image must be provided as a Buffer');
            }

            logger.info('Processing image buffer');
            logger.debug(`Image buffer length: ${imageBuffer.length}`);

            // Validate the image buffer
            this._validateImageBuffer(imageBuffer);

            await this.resetSchedulerIfNeeded(1);

            logger.info('Starting OCR recognition');
            const { data: { text } } = await this.scheduler.addJob('recognize', imageBuffer);

            if (!text) {
                throw new Error('OCR recognition failed: No text extracted');
            }

            logger.info('OCR recognition completed');
            logger.debug(`Recognized text: ${text}`);

            return text;
        } catch (error) {
            logger.error(`Error during OCR recognition: ${error.message}`);
            if (error.message.includes('Error attempting to read image')) {
                throw new Error('Failed to process image: File may be corrupted or in an unsupported format');
            }
            throw error;
        }
    }

    /**
     * Recognize text from multiple images in parallel
     * @param {Array<string>} images - Array of image file paths
     * @returns {Promise<Array<string>>} Array of recognized texts
     * @throws {Error} If any image path is invalid or not a string
     */
    async recognizeMultiple(images) {
        try {
            if (!Array.isArray(images) || !images.every(img => typeof img === 'string')) {
                throw new Error('Images parameter must be an array of string paths to local image files');
            }

            await this.resetSchedulerIfNeeded(images.length);

            logger.info(`Starting OCR recognition for ${images.length} images`);

            const results = await Promise.all(
                images.map(image => this.scheduler.addJob('recognize', image))
            );

            logger.info('Multiple OCR recognition completed');
            return results.map(result => result.data.text);
        } catch (error) {
            logger.error(`Error during multiple OCR recognition: ${error}`);
            throw error;
        }
    }

    async terminate() {
        if (this.scheduler) {
            await this.scheduler.terminate();
        }
    }
}

// Create and export a singleton instance
module.exports = new TesseractService(); 