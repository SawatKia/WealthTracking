const sanitizeHtml = require('sanitize-html');
const validator = require('validator');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const APIRequestLimitModel = require("../models/APIRequestLimitModel");
const SlipHistoryModel = require('../models/SlipHistoryModel');
const TransactionModel = require('../models/TransactionModel');
const BankAccountModel = require('../models/BankAccountModel');

const EasySlipService = require("../services/EasySlip");
const QRCodeReader = require('../utilities/QRCodeReader');
const LLMService = require('../services/LLMService');
const DocumentAiService = require('../services/DocumentAiService');
const OcrMappingService = require('../services/OcrMappingService');

const types = require('../../statics/types.json');
const appConfigs = require('../configs/AppConfigs');
const { Logger, formatResponse, formatBkkTime } = require("../utilities/Utils");
const MyAppErrors = require("../utilities/MyAppErrors");
const { BankAccountUtils } = require("../utilities/BankAccountUtils")


const logger = Logger("ApiController");

class ApiController {
  constructor() {
    this.easySlipService = EasySlipService;
    this.apiRequestLimitModel = new APIRequestLimitModel();
    this.slipHistoryModel = new SlipHistoryModel();
    this.transactionModel = new TransactionModel();
    this.bankAccountModel = new BankAccountModel();
    this.bankAccountUtils = new BankAccountUtils();

    // Bind methods to ensure correct 'this' context
    this._getCurrentDate = this._getCurrentDate.bind(this);
    this._checkQuotaAvailability = this._checkQuotaAvailability.bind(this);
    this.getSlipQuotaInformation = this.getSlipQuotaInformation.bind(this);
    this._handleSlipVerification = this._handleSlipVerification.bind(this);
    this.verifySlip = this.verifySlip.bind(this);
    this._extractTextFromImage = this._extractTextFromImage.bind(this);
    this._prepareTransactionData = this._prepareTransactionData.bind(this);
    this._checkGeminiRateLimit = this._checkGeminiRateLimit.bind(this);
  }

  /**
   * Check rate limits for a given Gemini model
   * @param {string} modelName The Gemini model to check
   * @param {number} estimatedTokens The estimated number of tokens to be used
   * @returns {Promise<{allowed: boolean, retryAfter?: number, message?: string, headers?: {Retry-After: number}}>
   *   allowed: true if the request is allowed, false otherwise
   *   retryAfter: number of seconds to wait before retrying (only if allowed is false)
   *   message: error message to return to the client (only if allowed is false)
   *   headers: headers to set in the response (only if allowed is false)
   */
  async _checkGeminiRateLimit(modelName, estimatedTokens) {
    logger.info('Checking Gemini rate limit');
    const now = new Date();

    // For current minute
    const currentMinute = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
    const minuteTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const minuteOffset = -currentMinute.getTimezoneOffset() / 60; // Negative because getTimezoneOffset returns opposite sign
    console.log(`Current minute: ${currentMinute.toISOString()}, timeZone: ${minuteTimeZone} (UTC${minuteOffset >= 0 ? '+' : ''}${minuteOffset})`);

    // For current date
    const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dateTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const dateOffset = -currentDate.getTimezoneOffset() / 60; // Negative because getTimezoneOffset returns opposite sign
    console.log(`Current date: ${currentDate.toISOString()}, timeZone: ${dateTimeZone} (UTC${dateOffset >= 0 ? '+' : ''}${dateOffset})`);

    // Get rate limits for the model
    const rateLimits = {
      'gemini-1.5-pro': { rpm: 2, rpd: 50, tpm: 32000 },
      'gemini-2.0-flash-exp': { rpm: 10, rpd: 1500, tpm: 4000000 },
      'gemini-1.5-flash-8b': { rpm: 15, rpd: 1500, tpm: 1000000 }
    };

    const limits = rateLimits[modelName];
    if (!limits) {
      throw new Error(`Unknown Gemini model: ${modelName}`);
    }

    // Check minute request limit
    logger.info("============verify RPM=============");
    const minuteUsage = await this.apiRequestLimitModel.getRequestLimit(modelName, currentMinute, 'minute');

    const minuteRequestCount = minuteUsage ? minuteUsage.request_count : 0;
    const minuteTokenCount = minuteUsage ? minuteUsage.token_count : 0;

    logger.warn(`Current minute usage for ${modelName}: ${minuteRequestCount}/${limits.rpm} requests, ${minuteTokenCount}/${limits.tpm} tokens`);

    if (minuteUsage && minuteUsage.request_count >= limits.rpm) {
      const retryAfter = 60 - now.getSeconds();
      logger.warn(`Minute rate limit exceeded for ${modelName}: ${minuteUsage.request_count}/${limits.rpm} requests`);
      return {
        allowed: false,
        retryAfter,
        message: `Rate limit exceeded for ${modelName}: ${limits.rpm} requests per minute`,
        headers: {
          'Retry-After': retryAfter
        }
      };
    }

    // Check daily request limit
    logger.info("============verify RPD=============");
    const dailyUsage = await this.apiRequestLimitModel.getRequestLimit(modelName, currentDate, 'daily');
    // Get daily usage counts
    const dailyRequestCount = dailyUsage ? dailyUsage.request_count : 0;
    const dailyTokenCount = dailyUsage ? dailyUsage.token_count : 0;

    logger.warn(`Current daily usage for ${modelName}: ${dailyRequestCount}/${limits.rpd} requests, ${dailyTokenCount}/${limits.tpm} tokens`); if (dailyUsage && dailyUsage.request_count >= limits.rpd) {
      const tomorrow = new Date(currentDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const retryAfter = Math.ceil((tomorrow - now) / 1000);
      return {
        allowed: false,
        retryAfter,
        message: `Daily limit exceeded for ${modelName}: ${limits.rpd} requests per day`,
        headers: {
          'Retry-After': retryAfter
        }
      };
    }

    // Check token per minute limit
    logger.info("============verify TPM=============");
    const currentTokenCount = await this.apiRequestLimitModel.getTokenCount(modelName, currentMinute, 'minute');
    logger.warn(`Current token minute usage for ${modelName}: ${currentTokenCount}/${limits.tpm} tokens`);

    if (currentTokenCount + estimatedTokens > limits.tpm) {
      const retryAfter = 60 - now.getSeconds();
      return {
        allowed: false,
        retryAfter,
        message: `Token limit exceeded for ${modelName}: ${limits.tpm} tokens per minute, examine the header 'Retry-After' to get precise delay time in seconds`,
        headers: {
          'Retry-After': retryAfter
        }
      };
    }

    logger.info("increasing the quota(request and token) usage base on each environment");
    if (appConfigs.environment === 'development') {
      logger.info("Development environment detected");
      logger.info("increment request count for current minute");// only in crement request count, to prevent rpm limit
      await this.apiRequestLimitModel.incrementRequestCount(modelName, currentMinute, estimatedTokens, 'minute');
      logger.info("increment request count for current date");// date need to, need to increment request count and store tokens usage, to prevent rpd limit
      await this.apiRequestLimitModel.incrementRequestCount(modelName, currentDate, estimatedTokens, 'daily');
    } else {
      await Promise.all([
        this.apiRequestLimitModel.incrementRequestCount(modelName, currentMinute, estimatedTokens, 'minute'),
        this.apiRequestLimitModel.incrementRequestCount(modelName, currentDate, estimatedTokens, 'daily')
      ]);
    }

    return { allowed: true };
  }

  _getCurrentDate() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  /**
   * Extracts text from an image buffer using DocumentAi
   * @param {Buffer} imageBuffer - The image buffer to extract text from.
   * @returns {Promise<string>} The extracted text.
   */
  async _extractTextFromImage(imageBuffer) {
    logger.info("Extracting text from image...");
    logger.debug(`imageBuffer: ${JSON.stringify(imageBuffer).substring(0, 100)}${JSON.stringify(imageBuffer).length > 100 ? "...[truncated]..." : ""}`);
    try {
      if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
        throw new Error('Invalid image buffer provided');
      }
      const result = await DocumentAiService.recognize(imageBuffer);

      // Validate result
      if (!result) {
        throw new Error('No result returned from DocumentAI service');
      }

      // Process result
      const processedResult = result.replace("โอนเงิน", "ทำรายการ");

      // Log the processed result
      logger.debug(`Processed โอนเงิน -> ทำรายการ OCR result: ${processedResult}`);
      logger.info('returning processed result');
      return processedResult;
    } catch (error) {
      logger.error(`Error extracting text from image: ${error.message}`);
      throw error;
    }
  }

  async _checkQuotaAvailability() {
    logger.info("Checking EasySlip quota availability");
    try {
      const currentDate = this._getCurrentDate();
      let requestLimit = await this.apiRequestLimitModel.getRequestLimit(
        "EasySlip",
        currentDate,
        'daily'
      );
      logger.debug(
        `requestLimit found: ${requestLimit ? JSON.stringify(requestLimit) : "empty"
        }`
      );
      // there is no today's request yet, create a new one with 0 request count
      if (!requestLimit) {
        logger.info(
          "there is no today's request to the api yet, create a new one"
        );
        requestLimit = await this.apiRequestLimitModel.createRequestLimit(
          "EasySlip",
          currentDate,
          'daily'
        );
        logger.debug(
          `created requestLimit: ${requestLimit ? JSON.stringify(requestLimit) : "empty"
          }`
        );
      } else if (requestLimit.request_count >= 7) {
        logger.warn("Daily EasySlip API request limit reached");
        logger.debug("returning false");
        return false;
      }

      // ensure that the quota is not low and has not expired
      const quotaInfo = await this.easySlipService.fetchQuotaInformation();
      logger.debug(`quotaInfo: ${JSON.stringify(quotaInfo)}`);
      const { remainingQuota, expiredAt } = quotaInfo.data;

      if (remainingQuota <= 5) {
        logger.warn("EasySlip API remaining quota is low");
        logger.debug("returning false");
        return false;
      }

      if (new Date(expiredAt) < new Date()) {
        logger.warn("EasySlip API quota has expired");
        logger.debug("returning false");
        return false;
      }

      logger.debug("returning true");
      return true;
    } catch (error) {
      logger.error(
        "Error checking EasySlip quota availability:",
        error.message
      );
      logger.debug("returning false");
      return false;
    }
  }

  _sanitizeObject(obj) {
    try {
      logger.info('Sanitizing object...');
      logger.debug(`obj: ${JSON.stringify(obj)}`);
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
          sanitized[key] = this._sanitizeObject(value); // Recursively sanitize nested objects
        } else if (Array.isArray(value)) {
          sanitized[key] = value.map(item => typeof item === 'string' ? sanitizeHtml(item) : item);
        } else {
          sanitized[key] = typeof value === 'string' ? sanitizeHtml(value) : value;
        }
        logger.debug(`sanitized[${key}]: ${JSON.stringify(sanitized[key])}`);
      }
      logger.debug(`sanitized result: ${JSON.stringify(sanitized)}`);
      return sanitized;
    } catch (error) {
      logger.error(`Error sanitizing object: ${error.message}`);
      throw error;
    }
  }

  _isValidPayload(payload) {
    try {
      logger.info('Validating payload...');
      // Implement specific validation logic for your payload format
      // This is a basic example; adjust based on your actual payload structure
      const result = /^[A-Za-z0-9]{30,100}$/.test(payload);
      logger.debug(`payload validation result: ${result}`);
      return result;
    } catch (error) {
      logger.error(`Error validating payload: ${error.message}`);
      return false;
    }
  }

  _isValidFile(file) {
    try {
      logger.info('Validating file...');
      const allowedExtensions = ['.jpg', '.jpeg', '.png'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      const fileExtension = path.extname(file.originalname).toLowerCase();

      logger.debug(`fileExtension: ${fileExtension}, fileSize: ${file.size}, maxSize: ${maxSize}`);
      const result = allowedExtensions.includes(fileExtension) && file.size <= maxSize;
      logger.debug(`file validation result: ${result}`);
      return result;
    } catch (error) {
      logger.error(`Error validating file: ${error.message}`);
      return false;
    }
  }

  _isValidBase64Image(base64String) {
    try {
      logger.info('Validating base64 image string...');
      logger.debug(`base64String: ${base64String.substring(0, 50)}...[truncated]`);

      // Ensure the string has both parts: data:image/jpeg;base64,...
      const parts = base64String.split(',');
      if (parts.length !== 2) {
        logger.warn('Invalid base64 format: missing parts');
        return false;
      }

      const mimeType = parts[0].split(';')[0].split(':')[1];
      const base64Data = parts[1];

      // Check if the data is valid base64
      if (!validator.isBase64(base64Data)) {
        logger.warn('Invalid base64 string');
        return false;
      }

      // Check if it has a valid image MIME type
      logger.debug(`mimeType: ${mimeType}`);
      const result = ['image/jpeg', 'image/png', 'image/gif'].includes(mimeType);
      logger.debug(`base64 image validation result: ${result}`);
      return result;
    } catch (error) {
      logger.error(`Error validating base64 image: ${error.message}`);
      return false;
    }
  }


  async getSlipQuotaInformation(req, res, next) {
    logger.info("Processing request for quota information");
    try {
      const quotaInfo = await this.easySlipService.fetchQuotaInformation();
      logger.debug(`received quota information: ${JSON.stringify(quotaInfo)}`);
      if (!quotaInfo) {
        throw new Error("Failed to fetch quota information from EasySlip API");
      }
      logger.debug(
        `formatted quota information: ${JSON.stringify(quotaInfo.data)}`
      );
      if (quotaInfo.status == 500) {
        throw MyAppErrors.serviceUnavailable(
          "EasySlip service is not available"
        );
      }
      if (quotaInfo.data.remainingQuota <= 5) {
        logger.warn("EasySlip API remaining quota is low");
      }
      req.formattedResponse = formatResponse(
        200,
        "get quota information success",
        quotaInfo.data
      );
      next();
    } catch (error) {
      logger.error(
        `Error processing quota information request: ${error.message}`
      );
      if (error.message == "Invalid EasySlip API key provided") {
        next(MyAppErrors.badRequest(error.message));
      }
      next(error);
    }
  }

  async _handleSlipVerification(req, ocrText, payload, imageBuffer) {
    logger.info('Using EasySlip API for verification');
    try {
      if (req.file) {
        result = await this.easySlipService.verifySlipByImage(req.file);
      } else {
        result = await this.easySlipService.verifySlipByBase64(req.body.image);
      }

      // Increment EasySlip API usage counter
      await this.apiRequestLimitModel.incrementRequestCount(
        "EasySlip",
        this._getCurrentDate(),
        'daily'
      );

      logger.debug(`EasySlip verification result: ${JSON.stringify(result)}`);
      return {
        message: "Slip verification successful by EasySlip Api",
        data: result
      };
    } catch (error) {
      logger.error(`EasySlip verification failed: ${error.message}`);
      logger.info('Falling back to OCR mapping');
      result = await OcrMappingService.mapToEasySlip(ocrText, payload, imageBuffer);
      logger.debug(`OCR mapping result: ${JSON.stringify(result)}`);
      return {
        message: "Slip verification successful by OCR text mapping",
        data: result
      };
    }
  }

  /**
   * Processes a unified request to verify a bank slip by QR code data (payload),
   * image file upload, or base64 encoded image.
   * @param {Object} req - The HTTP request object.
   * @param {Object} req.file - The image file from bank slip.
   * @param {Object} res - The HTTP response object.
   * @param {function} next - The next middleware function.
   */
  async verifySlip(req, res, next) {
    logger.info("Processing slip verification request");
    try {
      let imageBuffer;
      let payload;

      // Handle different input types
      if (req.file) {
        logger.info("Processing file upload input");
        if (!this._isValidFile(req.file)) {
          logger.error("Invalid file format or size");
          throw MyAppErrors.badRequest("Invalid file format or size limit exceeded");
        }
        imageBuffer = req.file.buffer;
        logger.debug(`File received: ${req.file.originalname}`);
      } else if (req.body.image) {
        logger.info("Processing base64 image input");
        if (!this._isValidBase64Image(req.body.image)) {
          logger.error("Invalid base64 image format");
          throw MyAppErrors.badRequest("Invalid base64 image format");
        }

        // Convert base64 to buffer
        const base64Data = req.body.image.split(',')[1];
        imageBuffer = Buffer.from(base64Data, 'base64');
        logger.debug("Base64 image converted to buffer successfully");
      } else {
        logger.error("No image input provided");
        throw MyAppErrors.badRequest("No image provided");
      }

      if (!imageBuffer) {
        logger.error("Invalid image buffer received");
        throw MyAppErrors.badRequest("Invalid image buffer received");
      }
      logger.debug(`Image buffer size: ${imageBuffer.byteLength} bytes`);
      logger.debug(`imageBuffer: ${JSON.stringify(imageBuffer).substring(0, 500)}${JSON.stringify(imageBuffer).length > 500 ? "...[truncated]..." : ""}`);

      // Ensure this call is awaited
      payload = await QRCodeReader.extractPayloadFromBuffer(imageBuffer);
      if (!payload) {
        logger.error("Invalid QR code payload extracted");
        throw MyAppErrors.badRequest("Cannot extract payload from QR code");
      }
      logger.info(`Extracted QR code payload: ${payload}`);

      // check for duplicate slip
      const isDuplicateSlip = await this.slipHistoryModel.checkDuplicateSlip(payload);
      logger.info(`isDuplicateSlip: ${isDuplicateSlip}`);
      if (isDuplicateSlip) {
        logger.info('Duplicate slip detected');
        throw MyAppErrors.badRequest("Duplicate slip detected");
      }

      // Check EasySlip availability
      const isQuotaAvailable = await this._checkQuotaAvailability();
      logger.info(`EasySlip quota available: ${isQuotaAvailable}`);

      // Extract text using OCR for type classification
      let ocrText = await this._extractTextFromImage(imageBuffer);
      logger.debug(`OCR text result: ${ocrText}`); // Add detailed logging
      if (!ocrText || typeof ocrText !== 'string' || ocrText.trim().length === 0) {
        logger.error("Invalid OCR result received");
        throw MyAppErrors.badRequest("Could not properly extract text from image");
      }
      logger.warn(`Sanitized OCR text: ${ocrText.trim()}`);

      // Check Gemini rate limit before making LLM call
      // const modelName = appConfigs.gemini.models.classification; // Default model for classification
      //NOTE - English 4 characters = 1 token, Thai 1-2 characters = 1 token
      //NOTE - get the precise token by sending asking to LLM(use countTokens method in GoogleGenerativeAI in LLMService.js)
      //NOTE - or after sending prompt to llm. since from these log messages:
      //2025-01-23 20:14:12 [LLMService.js/_generateContentWithMetrics():48] debug: llm[gemini-1.5-pro-002] response in 3078ms: {"category":"Expense","type":"Food","confidence":0.9,"reasoning":"The memo 'บะหมี่ไก่ทอด' (fried chicken noodles) clearly indicates a food purchase."}
      //2025-01-23 20:14:12 [LLMService.js/_generateContentWithMetrics():49] debug: Token usage: {"promptTokenCount":779,"candidatesTokenCount":64,"totalTokenCount":843}
      // const estimatedTokens = Math.ceil(ocrText.length / 4); // Rough estimate of tokens
      // logger.info("checking the request limit quota")
      // const rateLimitCheck = await this._checkGeminiRateLimit(modelName, estimatedTokens);
      // logger.warn(`rateLimitCheck: ${JSON.stringify(rateLimitCheck)}`);
      // if (!rateLimitCheck.allowed) {
      //   return res.status(429)
      //     .set(rateLimitCheck.headers)
      //     .json({
      //       status_code: 429,
      //       message: rateLimitCheck.message,
      //       retry_after: rateLimitCheck.retryAfter + " seconds"
      //     });
      // }

      // Get transaction type from LLM
      const { category: transactionCategory, type: transactionType, note: transactionNote } = await LLMService.classifyTransaction(ocrText);
      logger.debug(`Classified transaction type: ${transactionType}`);

      let result;
      // Extract data based on availability
      if (isQuotaAvailable) {
        logger.info('EasySlip available, verifying slip using EasySlip API...');
        result = await this._handleSlipVerification(req, ocrText, payload, imageBuffer);
      } else {
        logger.info('EasySlip unavailable, using OCR mapping');
        result = await OcrMappingService.mapToEasySlip(ocrText, payload, imageBuffer);
        result = {
          message: "Slip verification successful by OCR text mapping",
          data: result
        };
      }
      logger.debug(`Final slip verification result: ${JSON.stringify(result)}`);

      // Prepare and store transaction
      const transactionData = await this._prepareTransactionData(
        result.data,
        transactionCategory,
        transactionType,
        req,
        transactionNote
      );

      // Clean up unnecessary fields based on category
      if (transactionData.category === "Expense") {
        logger.info("Removing receiver field for Expense transaction");
        delete transactionData.receiver;
      } else if (transactionData.category === "Income") {
        logger.info("Removing sender field for Income transaction");
        delete transactionData.sender;
      }

      logger.debug(`Final transaction data: ${JSON.stringify(transactionData)}`);
      const transaction = await this.transactionModel.create(transactionData);
      logger.info(`Transaction created with ID: ${transaction.transaction_id}`);

      // Record slip usage
      if (result.data) {
        logger.info("Recording slip usage");
        const slipUsage = await this.slipHistoryModel.recordSlipUsage(
          result.data.payload,
          result.data.transRef,
          req.user?.sub
        );
        logger.debug(`Slip usage recorded: ${JSON.stringify(slipUsage)}`);
      }

      // Format final response
      result = {
        message: result.message + " and stored as a transaction",
        data: { transaction }
      };

      req.formattedResponse = formatResponse(201, result.message, result.data);
      next();
    } catch (error) {
      logger.error(`Error processing slip verification: ${error.message}`);
      if (error instanceof MyAppErrors) {
        next(error);
      } else if (error.message.includes("account not found in user's accounts")) {
        next(MyAppErrors.badRequest(error.message));
      } else if (error.message.includes("Insufficient balance")) {
        next(MyAppErrors.badRequest(error.message));
      } else if (error.message.includes("Resource exhausted") ||
        error.message.includes("Too many requests")) {
        const errorTime = new Date();
        const seconds = parseInt(error.response.headers['retry-after']) || 60;
        const retryAfter = formatBkkTime(errorTime.getTime() / 1000 + seconds);
        next(MyAppErrors.tooManyRequests(error.message, { retryAfter }, { retryAfter: seconds }));
      } else {
        next(MyAppErrors.internalServerError("Internal server error"));
      }
    }
  }
  //TODO - get slip image of specified transaction

  /**
   * Verify if a masked account number matches with a stored account number
   * @param {string} maskedAccount - Account number from slip with 'x' characters
   * @param {string} storedAccount - Full account number from database
   * @returns {boolean} True if account numbers match pattern
   */
  _verifyAccountNumber(maskedAccount, storedAccount) {

    logger.info("Verifying account numbers");
    logger.debug(`maskedAccount: ${maskedAccount}, storedAccount: ${storedAccount}`);
    if (!maskedAccount || !storedAccount) return false;
    // Convert both to strings and remove any spaces
    maskedAccount = maskedAccount.toString().replace(/\s/g, '');
    storedAccount = storedAccount.toString().replace(/\s/g, '');

    logger.debug(`Verifying account numbers - masked: ${maskedAccount}`);
    logger.debug(`verifying account numbers - stored: ${storedAccount}`)
    // If lengths don't match, return false
    if (maskedAccount.length !== storedAccount.length) return false;

    // Compare each character, allowing 'x' in masked account to match any digit
    for (let i = 0; i < maskedAccount.length; i++) {
      if (maskedAccount[i] !== 'x' && maskedAccount[i] !== 'X' && maskedAccount[i] !== storedAccount[i]) {
        logger.silly(`Character [${i}]: ${maskedAccount[i]}!=${storedAccount[i]}`);
        return false;
      }
      logger.silly(`Character [${i}]: ${maskedAccount[i]}==${storedAccount[i]}`);
    }
    logger.debug('Account numbers match');
    return true;
  }

  /**
   * Prepare transaction data from slip data and type
   * @param {Object} slipData - Data from EasySlip API response
   * @param {string} category - Transaction category from LLM
   * @param {string} type - Transaction type from LLM
   * @param {Object} req - Request object containing user information
   * @returns {Object} Formatted transaction data matching TransactionModel schema
   */
  async _prepareTransactionData(slipData, category, type = null, req, note) {
    logger.info('Preparing transaction data from the easySlipResponse');

    try {
      logger.debug(`category: ${category}, type: ${type}, note: ${note}`);

      // Get masked account numbers from slip
      logger.info("Get masked account numbers from slip");
      const maskedSenderAccount = slipData.sender?.account?.bank?.account ||
        slipData.sender?.account?.proxy?.account || '';
      const maskedReceiverAccount = slipData.receiver?.account?.bank?.account ||
        slipData.receiver?.account?.proxy?.account || '';

      // Get all user's bank accounts
      logger.info("Get all user's bank accounts");
      const userAccounts = await this.bankAccountModel.getAll(req.user?.sub);

      // Find matching accounts
      logger.info("Find matching accounts");
      let senderAccount = null;
      let receiverAccount = null;

      for (const account of userAccounts) {
        const normalizedAccountNumber = await this.bankAccountUtils.normalizeAccountNumber(account.account_number);
        logger.debug(`Normalized account number: ${normalizedAccountNumber}`);

        if (this._verifyAccountNumber(maskedSenderAccount.replace(/-/g, ''), normalizedAccountNumber)) {
          logger.debug(`Sender account found in slip: ${account.account_number}`);
          senderAccount = account;
        }
        if (this._verifyAccountNumber(maskedReceiverAccount.replace(/-/g, ''), normalizedAccountNumber)) {
          logger.debug(`Receiver account found in slip: ${account.account_number}`);
          receiverAccount = account;
        }
      }
      logger.debug(`Sender account: ${senderAccount ? senderAccount.account_number : 'not found'}`);
      logger.debug(`Receiver account: ${receiverAccount ? receiverAccount.account_number : 'not found'}`);

      // Verify the transaction matches user's accounts based on category
      logger.info("Applying found user bank account's based on category");
      if (category === 'Income' && !receiverAccount) {
        const errorMessage = "specified receiver account not found in user's accounts";
        logger.error(errorMessage);
        throw new Error(errorMessage);
      } else if (category === 'Expense' && !senderAccount) {
        const errorMessage = "specified sender account not found in user's accounts";
        logger.error(errorMessage);
        throw new Error(errorMessage);
      } else if (category === 'Transfer' && (!senderAccount || !receiverAccount)) {
        const errorMessage = "specified sender or receiver account not found in user's accounts";
        logger.error(errorMessage);
        throw new Error(errorMessage);
      }

      const transactionData = {
        transaction_id: uuidv4(),
        transaction_datetime: new Date(slipData.date),
        category: category,
        type: type || slipData.type || 'Other',
        amount: parseFloat(slipData.amount.amount),
        note: note || [slipData.ref1, slipData.ref2, slipData.ref3]
          .filter(ref => ref)
          .join(' ') || "No note provided",
        slip_uri: req.file.path,
        national_id: req.user?.sub,
        debt_id: null,
      };

      // Add verified account details based on category
      if (category === 'Income') {
        transactionData.receiver_account_number = await this.bankAccountUtils.normalizeAccountNumber(receiverAccount.account_number);
        transactionData.receiver_fi_code = receiverAccount.fi_code;
      } else if (category === 'Expense') {
        transactionData.sender_account_number = await this.bankAccountUtils.normalizeAccountNumber(senderAccount.account_number);
        transactionData.sender_fi_code = senderAccount.fi_code;
      } else if (category === 'Transfer') {
        transactionData.sender_account_number = await this.bankAccountUtils.normalizeAccountNumber(senderAccount.account_number);
        transactionData.sender_fi_code = senderAccount.fi_code;
        transactionData.receiver_account_number = await this.bankAccountUtils.normalizeAccountNumber(receiverAccount.account_number);
        transactionData.receiver_fi_code = receiverAccount.fi_code;
      }

      logger.debug(`Prepared transaction data: ${JSON.stringify(transactionData, null, 2)}`);
      return transactionData;
    } catch (error) {
      logger.error(`Error preparing transaction data: ${error.message}`);
      throw new Error(error.message);
    }
  }
}

module.exports = ApiController;
