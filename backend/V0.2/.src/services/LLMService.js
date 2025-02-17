const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Logger } = require('../utilities/Utils');
const transactionTypes = require('../../statics/types.json');
const logger = Logger('LLMService');
const appConfigs = require('../configs/AppConfigs');
const fs = require('fs');
const SystemPrompts = require('./SystemPrompts');

class LLMService {
    constructor() {
        logger.info('start LLMService');
        logger.debug(`appConfigs: ${JSON.stringify(appConfigs.gemini)}`);
        this.genAI = new GoogleGenerativeAI(appConfigs.gemini.key);

        // Initialize classification model with system instruction
        this.classificationModel = this.genAI.getGenerativeModel({
            model: appConfigs.gemini.models.classification,
            generation_config: { "response_mime_type": "application/json" },
            systemInstruction: SystemPrompts.classificationPrompt
        });

        // Initialize OCR mapping model with system instruction
        this.ocrMappingModel = this.genAI.getGenerativeModel({
            model: appConfigs.gemini.models.ocrMapping,
            generation_config: { "response_mime_type": "application/json" },
            systemInstruction: SystemPrompts.ocrMappingPrompt
        });

        this.commonModel = this.genAI.getGenerativeModel({
            model: appConfigs.gemini.models.common,
            generation_config: { "response_mime_type": "application/json" },
            systemInstruction: "you are conectivity testing model. answer in JSON format {status_code, message}"
        });
    }

    async _generateContentWithMetrics(model, prompt) {
        const startTime = Date.now();
        try {
            const response = await model.generateContent(prompt);
            const result = response.response;
            const jsonResponseText = result.candidates[0].content.parts[0].text
                .replace(/```json|```/g, '')
                .trim();

            const jsonResponse = JSON.parse(jsonResponseText);
            const duration = Date.now() - startTime;

            logger.debug(`llm result: ${JSON.stringify(response)}`);
            logger.debug(`llm[${result.modelVersion}] response in ${duration}ms: ${JSON.stringify(jsonResponse)}`);
            logger.debug(`Token usage: ${JSON.stringify(result.usageMetadata)}`);

            return {
                data: jsonResponse,
                duration,
                tokens: result.usageMetadata
            };
        } catch (error) {
            const duration = Date.now() - startTime;
            logger.error(`LLM request failed after ${duration}ms: ${error.message}`);
            throw new Error(`LLM request failed: ${error.message}`);
        }
    }

    async init() {
        try {
            logger.info('LLMService initializing...');
            const modelMapping = {
                classificationModel: this.classificationModel,
                ocrMappingModel: this.ocrMappingModel,
                commonModel: this.commonModel
            };

            const [classificationTokens, ocrMappingTokens, commonTokens] = await Promise.all([
                this.classificationModel.countTokens(SystemPrompts.classificationPrompt),
                this.ocrMappingModel.countTokens(SystemPrompts.ocrMappingPrompt),
                this.commonModel.countTokens(SystemPrompts.ocrMappingPrompt)
            ]);

            Object.entries(modelMapping).forEach(([modelName, modelRef]) => {
                const tokens = modelName === 'classificationModel' ? classificationTokens :
                    modelName === 'ocrMappingModel' ? ocrMappingTokens : commonTokens;
                logger.info(`[${modelName} (${modelRef.model})] systemInstruction tokens count: ${tokens.totalTokens}`);
            });
            const { data: jsonResponse } = await this._generateContentWithMetrics(this.commonModel, "test");

            if (jsonResponse.status_code != 200) {
                logger.error("LLM initialization failed: " + jsonResponse.message);
                throw new Error(jsonResponse.message);
            }

            logger.info('LLM service initialized');
            return true;
        } catch (error) {
            logger.error(`Error initializing LLMService: ${error.message}`);
            throw error;
        }
    }

    async classifyTransaction(text) {
        try {
            logger.info('Classifying transaction from text');
            const { data: jsonResponse } = await this._generateContentWithMetrics(this.classificationModel, text);
            // Validate and process response
            if (!jsonResponse.category || !jsonResponse.type || jsonResponse.confidence === undefined) {
                throw new Error('Invalid response format from LLM');
            }

            if (jsonResponse.category === 'Transfer') {
                jsonResponse.type = 'Transfer';
            }

            if (!transactionTypes[jsonResponse.category]?.includes(jsonResponse.type) ||
                jsonResponse.confidence < 0.6) {
                jsonResponse.type = 'Other';
            }
            logger.debug(`verified response: ${JSON.stringify(jsonResponse)}`);
            return jsonResponse;
        } catch (error) {
            logger.error(`Error classifying transaction: ${error.message}`);
            throw error;
        }
    }

    /**
     * Maps OCR text and an image to EasySlip format.
     * @param {string} ocrText - The OCR text extracted from an image.
     * @param {string} imageBuffer - File path to the image associated with the OCR text.
     * @returns {Promise<Object>} Mapped response in EasySlip format.
     * @throws {Error} If mapping fails or an invalid response is received.
     */
    async mapOcrToEasySlip(ocrText, imageBuffer) {
        try {
            logger.info('Mapping OCR text and image to EasySlip format');

            const imagePart = {
                inlineData: {
                    data: imageBuffer.toString('base64'),
                    mimeType: 'image/jpeg'
                }
            };
            logger.debug(`imagePart: ${JSON.stringify(imagePart).substring(0, 50)}...[truncated]`);

            const { data: jsonResponse } = await this._generateContentWithMetrics(
                this.ocrMappingModel,
                [ocrText, imagePart]
            );

            logger.debug(`mapped EasySlip response: ${JSON.stringify(jsonResponse)}`);
            return jsonResponse.data;
        } catch (error) {
            logger.error(`Error mapping OCR text and image: ${error.message}`);
            throw error;
        }
    }
}

// Create and export a singleton instance
module.exports = new LLMService();
