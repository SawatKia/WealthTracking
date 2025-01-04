const { DocumentProcessorServiceClient } = require('@google-cloud/documentai').v1;
const { Logger } = require('../utilities/Utils');
const appConfigs = require('../configs/AppConfigs');
const logger = Logger('DocumentAiService');
const fs = require('fs');

class DocumentAiService {
    constructor() {
        logger.info('Initializing DocumentAiService');
        logger.debug(`appConfigs.documentAi: ${JSON.stringify(appConfigs.documentAi, null, 2)}`);
        logger.debug(`appConfigs.gcp: ${JSON.stringify(appConfigs.gcp, null, 2)}`)

        // Initialize configuration from appConfigs
        this.projectName = appConfigs.gcp.projectName;
        this.projectNumber = appConfigs.gcp.projectNumber;
        this.location = appConfigs.documentAi.location;
        this.processorId = appConfigs.documentAi.processorId;
        this.connected = false;
        if (!fs.existsSync(appConfigs.documentAi.pathToServiceAccount)) {
            logger.warn("service account not found, cannot initiate Document Ai service")
        }
        logger.debug("service account found")
        // Initialize the client
        this.documentAiClient = new DocumentProcessorServiceClient({
            apiEndpoint: `${this.location}-documentai.googleapis.com`
        });

        this.processorName = `projects/${this.projectNumber}/locations/${this.location}/processors/${this.processorId}`;
        logger.debug(`Processor name: ${this.processorName}`);
        this.recognize = this.recognize.bind(this);
    }

    /**
     * Initializes the DocumentAiService and verifies the connection by getting a list of processors.
     * @throws {Error} If the connection cannot be verified.
     */
    async init() {
        try {
            logger.info('Initializing DocumentAiService and verifying connection');
            const request = {
                parent: `projects/${this.projectNumber}/locations/${this.location}`,
            };
            const iterable = this.documentAiClient.listProcessorsAsync(request);
            for await (const response of iterable) {
                if (!response) {
                    throw new Error('Failed to verify connection: no processors found');
                }
                logger.debug(`connect to Document Ai processor's name: ${response.displayName}`);
            }
            this.connected = true;
            logger.info('Connection verified successfully');
        } catch (error) {
            logger.error(`Failed to verify connection: ${error.message}`);
            throw new Error(`Failed to verify connection: ${error.message}`);
        }
    }

    /**
     * Extract text from the document using text anchors
     * @private
     * @param {Object} document - The processed document
     * @param {Object} textAnchor - The text anchor containing segments
     * @returns {string} Extracted text
     */
    _extractText(document, textAnchor) {
        logger.info('Extracting text from document');
        if (!textAnchor.textSegments || textAnchor.textSegments.length === 0) {
            logger.debug('No text segments found');
            return '';
        }

        const startIndex = textAnchor.textSegments[0].startIndex || 0;
        const endIndex = textAnchor.textSegments[0].endIndex;
        logger.debug(`startIndex: ${startIndex}, endIndex: ${endIndex}`);
        return document.text.substring(startIndex, endIndex);
    }

    /**
     * Recognize text from an image buffer
     * @param {Buffer} imageBuffer - Image buffer to process
     * @returns {Promise<string>} Recognized text
     * @throws {Error} If processing fails
     */
    async recognize(imageBuffer) {
        try {
            logger.info('Processing image with Document AI');
            if (!Buffer.isBuffer(imageBuffer)) {
                throw new Error('Image must be provided as a Buffer');
            }

            logger.debug(`Image buffer length: ${imageBuffer.length}`);

            const request = {
                name: this.processorName,
                rawDocument: {
                    content: imageBuffer.toString('base64'),
                    mimeType: 'image/jpeg', // Adjust based on input image type
                },
            };

            // Process the document
            const [result] = await this.documentAiClient.processDocument(request);
            logger.debug(`documentAi RAW result: ${JSON.stringify(result).substring(1, 1000)}${result.length > 1000 ? " ...[truncated]..." : ""}`);
            const { document } = result;


            if (!document || !document.text) {
                logger.error('No text was extracted from the image');
                throw new Error('No text was extracted from the image');
            }
            logger.debug(`document.text: ${document.text.substring(0, 1000)}${document.text.length > 1000 ? " ...[truncated]..." : ""}`);

            // Extract text from all paragraphs
            const extractedText = document.pages
                .flatMap(page => page.paragraphs)
                .map(paragraph => this._extractText(document, paragraph.layout.textAnchor))
                .join('')
                .trim();

            logger.info('Document AI processing completed');
            logger.debug(`Recognized text: ${extractedText}`);

            return extractedText;
        } catch (error) {
            logger.error(`Error during Document AI processing: ${error.message}`);
            throw new Error(`Failed to process image: ${error.message}`);
        }
    }

    /**
     * Recognize text from multiple images in parallel
     * @param {Array<Buffer>} imageBuffers - Array of image buffers
     * @returns {Promise<Array<string>>} Array of recognized texts
     */
    async recognizeMultiple(imageBuffers) {
        try {
            if (!Array.isArray(imageBuffers) || !imageBuffers.every(buf => Buffer.isBuffer(buf))) {
                throw new Error('Images must be provided as an array of Buffers');
            }

            logger.info(`Starting Document AI processing for ${imageBuffers.length} images`);

            const results = await Promise.all(
                imageBuffers.map(buffer => this.recognize(buffer))
            );

            logger.info('Multiple Document AI processing completed');
            return results;
        } catch (error) {
            logger.error(`Error during multiple Document AI processing: ${error.message}`);
            throw error;
        }
    }
}

// Create and export a singleton instance
module.exports = new DocumentAiService(); 