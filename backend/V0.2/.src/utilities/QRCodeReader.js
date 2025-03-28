const Jimp = require('jimp');
const jsQR = require('jsqr');
const crypto = require('crypto'); // Add crypto for hashing

const { Logger } = require('./Utils');
const appConfigs = require('../configs/AppConfigs');
const logger = Logger('QRCodeReader');

class QRCodeReader {
    /**
     * Extracts QR code data from an image buffer
     * @param {Buffer} imageBuffer - The image buffer to process
     * @returns {Promise<string|null>} The QR code data or a hash of the image buffer if QR code is not found
     */
    static async extractPayloadFromBuffer(imageBuffer) {
        try {
            logger.info('Extracting QR code from image buffer');

            // Validate buffer
            if (!Buffer.isBuffer(imageBuffer)) {
                logger.error('Invalid input: imageBuffer is not a Buffer');
                throw new Error('Invalid input: imageBuffer is not a Buffer');
            }

            // Create a buffer copy to ensure we have a proper Buffer instance
            const buffer = Buffer.from(imageBuffer);
            logger.info(`Buffer created with length: ${buffer.length}`);

            // Load the image with Jimp
            const image = await Jimp.read(buffer);
            logger.info('Image successfully loaded with Jimp');

            // Convert RGBA to grayscale for better QR detection
            image.grayscale();
            logger.info('Image converted to grayscale');

            // Get image data in the format jsQR expects
            const { width, height, data } = image.bitmap;
            logger.debug(`Image dimensions - Width: ${width}, Height: ${height}`);

            // Ensure we have valid image dimensions
            if (width <= 0 || height <= 0) {
                logger.error('Invalid image dimensions');
                throw new Error('Invalid image dimensions');
            }

            // Create Uint8ClampedArray from buffer
            const imageData = new Uint8ClampedArray(data.buffer);
            logger.debug(`Image data created with length: ${imageData.length}`);

            // Decode the QR code
            const decodedQR = jsQR(imageData, width, height);
            logger.debug(`QR code decoding result: ${decodedQR ? 'Success' : 'Failure'}`);

            if (!decodedQR) {
                logger.warn('No QR code found in image');
                // Hash the image buffer as a fallback
                const hash = crypto.createHash('sha256').update(imageBuffer).digest('hex');
                logger.debug(`Generated hash for image buffer: ${hash.substring(0, 100)}${hash.length > 100 ? "...[truncated]..." : ""}`);
                return hash;
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