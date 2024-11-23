const Jimp = require('jimp');
const jsQR = require('jsqr');
const { Logger } = require('./Utils');

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

            // Load the image with Jimp
            const image = await Jimp.read(imageBuffer);

            // Get the image data in the format jsQR expects
            const imageData = {
                data: new Uint8ClampedArray(image.bitmap.data),
                width: image.bitmap.width,
                height: image.bitmap.height,
            };

            // Decode the QR code
            const decodedQR = jsQR(imageData.data, imageData.width, imageData.height);

            if (!decodedQR) {
                logger.warn('No QR code found in image');
                return null;
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

            // Convert base64 to buffer
            const imageBuffer = Buffer.from(
                base64Image.replace(/^data:image\/[a-z]+;base64,/, ''),
                'base64'
            );

            return await this.extractPayloadFromBuffer(imageBuffer);
        } catch (error) {
            logger.error(`Error extracting QR code from base64: ${error.message}`);
            return null;
        }
    }
}

module.exports = QRCodeReader; 