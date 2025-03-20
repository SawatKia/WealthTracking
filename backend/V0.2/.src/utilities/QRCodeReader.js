const Jimp = require('jimp');
const jsQR = require('jsqr');

const { Logger } = require('./Utils');
const appConfigs = require('../configs/AppConfigs');
const logger = Logger('QRCodeReader');

class QRCodeReader {
    /**
     * Extracts QR code data from an image buffer
     * @param {Buffer} imageBuffer - The image buffer to process
     * @returns {Promise<string|null>} The QR code data or null if not found
     */
    static async extractPayloadFromBuffer(imageBuffer) {
        try {
            logger.info('Extracting QR code from image buffer');

            // For testing environment, return mock payload
            // if (appConfigs.environment === 'test') {
            //     logger.info('Test environment detected, returning mock payload');
            //     return "00020101021229370016A000000677010111011300668960066896007802TH53037646304";
            // }

            // Validate buffer
            if (!Buffer.isBuffer(imageBuffer)) {
                logger.error('Invalid input: imageBuffer is not a Buffer');
                throw new Error('Invalid input: imageBuffer is not a Buffer');
            }


            // Create a buffer copy to ensure we have a proper Buffer instance
            const buffer = Buffer.from(imageBuffer);

            // Load the image with Jimp
            const image = await Jimp.read(buffer);

            // Convert RGBA to grayscale for better QR detection
            image.grayscale();

            // Get image data in the format jsQR expects
            const { width, height, data } = image.bitmap;

            // Ensure we have valid image dimensions
            if (width <= 0 || height <= 0) {
                logger.error('Invalid image dimensions');
                throw new Error('Invalid image dimensions');
            }

            // Create Uint8ClampedArray from buffer
            const imageData = new Uint8ClampedArray(data.buffer);

            // Decode the QR code
            const decodedQR = jsQR(imageData, width, height);

            if (!decodedQR) {
                logger.warn('No QR code found in image');
                throw new Error('No QR code found in image');
            }

            logger.debug(`QR code data extracted: ${decodedQR.data}`);
            return decodedQR.data;
        } catch (error) {
            logger.error(`Error extracting QR code from buffer: ${error.message}`);
            return null;
        }
    }

    /**
     * Extracts QR code data from a base64 encoded image
     * @param {string} base64Image - The base64 encoded image string
     * @returns {Promise<string|null>} The QR code data or null if not found
     */
    static async extractPayloadFromBase64(base64Image) {
        try {
            logger.info('Extracting QR code from base64 image');

            // For testing environment, return mock payload
            // if (appConfigs.environment === 'test') {
            //     logger.info('Test environment detected, returning mock payload');
            //     return "00020101021229370016A000000677010111011300668960066896007802TH53037646304";
            // }

            if (!base64Image || typeof base64Image !== 'string') {
                logger.error('Invalid base64 image string');
                throw new Error('Invalid base64 image string');
            }


            // Convert base64 to buffer
            const base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
            const imageBuffer = Buffer.from(base64Data, 'base64');

            return await this.extractPayloadFromBuffer(imageBuffer);
        } catch (error) {
            logger.error(`Error extracting QR code from base64: ${error.message}`);
            return null;
        }
    }
}

module.exports = QRCodeReader; 