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
const TesseractService = require('../services/Tesseract');
const OllamaService = require('../services/OllamaService');
const DocumentAiService = require('../services/DocumentAiService');
const appConfigs = require('../configs/AppConfigs');
const types = require('../../statics/types.json');

const { Logger, formatResponse } = require("../utilities/Utils");
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
    this.mockDataResponse = {
      payload: "00000000000000000000000000000000000000000000000000000000000",
      transRef: "68370160657749I376388B35",
      date: "2023-01-01T00:00:00+07:00",
      countryCode: "TH",
      amount: {
        amount: 120,
        local: {
          amount: 0,
          currency: "",
        },
      },
      fee: 0,
      ref1: "",
      ref2: "",
      ref3: "",
      sender: {
        bank: {
          id: "001",
          name: "กสิกรไทย",
          short: "KBANK",
        },
        account: {
          name: {
            th: "นาย อีซี่ สลิป",
            en: "MR. EASY SLIP",
          },
          bank: {
            type: "BANKAC",
            account: "xxxxx6789x",
          },
        },
      },
      receiver: {
        bank: {
          id: "030",
          name: "ธนาคารออมสิน",
          short: "GSB",
        },
        account: {
          name: {
            th: "นาย อีซี่ สลิป",
          },
          bank: {
            type: "BANKAC",
            account: "12xxxx3456",
          },
          proxy: {
            type: "EWALLETID",
            account: "123xxxxxxxx4567",
          },
        },
      },
    };

    // Bind methods to ensure correct 'this' context
    this._getCurrentDate = this._getCurrentDate.bind(this);
    this._checkQuotaAvailability = this._checkQuotaAvailability.bind(this);
    this.getQuotaInformation = this.getQuotaInformation.bind(this);
    this.verifySlip = this.verifySlip.bind(this);
    this._extractTextFromImage = this._extractTextFromImage.bind(this);
    this._prepareTransactionData = this._prepareTransactionData.bind(this);
  }

  _getCurrentDate() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  /**
   * Extracts text from an image buffer using Tesseract.js.
   * @param {Buffer} imageBuffer - The image buffer to extract text from.
   * @returns {Promise<string>} The extracted text.
   */
  async _extractTextFromImage(imageBuffer) {
    logger.info("Extracting text from image...");
    logger.debug(`imageBuffer: ${JSON.stringify(imageBuffer).substring(0, 100)}${JSON.stringify(imageBuffer).length > 100 ? "...[truncated]..." : ""}`);
    try {
      // If imagePath is already a buffer (from req.file.buffer), use it directly
      const imageData = Buffer.isBuffer(imageBuffer) ? imageBuffer : fs.readFileSync(imageBuffer);
      logger.debug(`typeof\n\tDocumentAiService: ${typeof DocumentAiService}\n\tDocumentAiService.recognize: ${typeof DocumentAiService.recognize}`);
      // const result = await TesseractService.recognize(imageData);
      // logger.debug(`TesseractService result: ${result}`);
      const result = await DocumentAiService.recognize(imageData);
      logger.debug(`DocumentAiService result: ${result}`);
      return result;
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
        currentDate
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
          currentDate
        );
        logger.debug(
          `create requestLimit: ${requestLimit ? JSON.stringify(requestLimit) : "empty"
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
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
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


  async getQuotaInformation(req, res, next) {
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
      // Validate file input
      if (!req.file) {
        logger.error("No image file provided.");
        throw MyAppErrors.badRequest("No image file provided.");
      }

      if (!this._isValidFile(req.file)) {
        logger.error("Invalid file format or size.");
        throw MyAppErrors.badRequest("Invalid file format or size.");
      }

      const payload = QRCodeReader.extractPayloadFromBuffer(req.file.buffer);
      logger.info(`payload: ${payload}`);

      // Check EasySlip availability
      const isQuotaAvailable = await this._checkQuotaAvailability();
      logger.info(`EasySlip quota available: ${isQuotaAvailable}`);

      // check for duplicate slip
      const isDuplicateSlip = await this.slipHistoryModel.checkDuplicateSlip(payload);
      logger.info(`isDuplicateSlip: ${isDuplicateSlip}`);

      if (isDuplicateSlip) {
        logger.info('Duplicate slip detected');
        throw MyAppErrors.badRequest("Duplicate slip detected");
      }

      // Extract text using OCR for type classification
      const ocrText = await this._extractTextFromImage(req.file.buffer);
      if (!ocrText) {
        logger.error("Could not extract text from image.");
        throw MyAppErrors.badRequest("Could not extract text from image.");
      }
      logger.debug(`classification type: ${await OllamaService.classifyTransaction(ocrText)}`);

      let result;
      // Extract data based on availability
      if (isQuotaAvailable) {
        logger.info('using EasySlip API...');
        // Use EasySlip API
        const easySlipResponse = await this.easySlipService.verifySlipByImage(req.file);

        // Check EasySlip response status
        if (!easySlipResponse) {
          logger.error("EasySlip verification failed");
          throw MyAppErrors.serviceUnavailable("EasySlip verification failed");
        }

        result = {
          message: "Slip verification successful by EasySlip Api",
          data: easySlipResponse
        };

        // Increment EasySlip API usage counter
        await this.apiRequestLimitModel.incrementRequestCount(
          "EasySlip",
          this._getCurrentDate()
        );

        await this.slipHistoryModel.recordSlipUsage(easySlipResponse.payload, easySlipResponse.transRef, req.user?.sub);

        // Get transaction type from LLM
        const transactionType = await OllamaService.classifyTransaction(ocrText);
        logger.debug(`Classified transaction type: ${transactionType}`);

        // Prepare transaction data
        const transactionData = await this._prepareTransactionData(result.data, transactionType, req);
        logger.debug(`transaction to be create: ${JSON.stringify(transactionData)}`);
        const transaction = await this.transactionModel.create(transactionData);
        logger.debug(`transaction created: ${JSON.stringify(transaction)}`);

        // Add transaction to response
        result = {
          message: result.message + " and stored as a transaction",
          data: {
            transaction
          }
        }
      } else {
        // logger.info('EasySlip quota is not available, using mock data for development, or try use Recognized text and LLM in production');
        logger.info('EasySlip quota is not available, using mock data for development, or throw error in production');
        // Use mock data in development, or try OCR+LLM in production
        if (appConfigs.environment === 'development') {
          logger.info('using mock data...');
          // Store mock transaction
          const transactionData = await this._prepareTransactionData(this.mockDataResponse, 'Food', req);

          logger.debug(`transaction to be create: ${JSON.stringify(transactionData)} `);
          const transaction = await this.transactionModel.create(transactionData);
          logger.debug(`transaction created: ${JSON.stringify(transaction)} `);

          result = {
            message: 'The EasySlip not avaliable, in development mode using mock data to store as a transaction. for production mode, it return \"EasySlip is not available\"',
            data: {
              transaction
            }
          };
        } else {
          // production mode
          // logger.info('classifying transaction type...');
          // const transactionType = await OllamaService.classifyTransaction(ocrText);

          // const transactionData = await this._prepareTransactionData(
          //   { ...this.mockDataResponse, type: transactionType },
          //   transactionType,
          //   req
          // );

          // logger.debug(`transaction to be create: ${JSON.stringify(transactionData)} `);
          // const transaction = await this.transactionModel.create(transactionData);
          // logger.debug(`transaction created: ${JSON.stringify(transaction)} `);

          // result = {
          //   message: "Data extracted using OCR, LLM and stored as a transaction",
          //   data: {
          //     transaction
          //   }
          // };
          throw MyAppErrors.serviceUnavailable("EasySlip is not available");
        }
      }

      req.formattedResponse = formatResponse(200, result.message, result.data);
      next();
    } catch (error) {
      logger.error(`Error processing slip verification: ${error.message}`);
      if (error instanceof MyAppErrors) {
        next(error);
      } else {
        next(MyAppErrors.internalServerError("Internal server error"));
      }
    }
  }

  /**
   * Verify if a masked account number matches with a stored account number
   * @param {string} maskedAccount - Account number from slip with 'x' characters
   * @param {string} storedAccount - Full account number from database
   * @returns {boolean} True if account numbers match pattern
   */
  _verifyAccountNumber(maskedAccount, storedAccount) {
    logger.debug(`Verifying account numbers - masked: ${maskedAccount}, stored: ${storedAccount}`);

    if (!maskedAccount || !storedAccount) return false;

    // Convert both to strings and remove any spaces
    maskedAccount = maskedAccount.toString().replace(/\s/g, '');
    storedAccount = storedAccount.toString().replace(/\s/g, '');

    // If lengths don't match, return false
    if (maskedAccount.length !== storedAccount.length) return false;

    // Compare each character, allowing 'x' in masked account to match any digit
    for (let i = 0; i < maskedAccount.length; i++) {
      if (maskedAccount[i] !== 'x' && maskedAccount[i] !== storedAccount[i]) {
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
   * @param {string} type - Transaction type from LLM
   * @param {Object} req - Request object containing user information
   * @returns {Object} Formatted transaction data matching TransactionModel schema
   */
  async _prepareTransactionData(slipData, type, req) {
    logger.debug(`Preparing transaction data from slip: ${JSON.stringify(slipData)}`);

    try {
      // Determine category based on type
      let category;
      if (types.Income.includes(type)) {
        category = 'Income';
      } else if (types.Transfer.includes(type)) {
        category = 'Transfer';
      } else {
        category = 'Expense';
      }

      // Get masked account numbers from slip
      const maskedSenderAccount = slipData.sender?.account?.bank?.account ||
        slipData.sender?.account?.proxy?.account || '';
      const maskedReceiverAccount = slipData.receiver?.account?.bank?.account ||
        slipData.receiver?.account?.proxy?.account || '';

      // Get all user's bank accounts
      const userAccounts = await this.bankAccountModel.getAll(req.user?.sub);

      // Find matching accounts
      let senderAccount = null;
      let receiverAccount = null;

      for (const account of userAccounts) {
        const normalizedAccountNumber = await this.bankAccountUtils.normalizeAccountNumber(account.account_number);
        if (this._verifyAccountNumber(maskedSenderAccount, normalizedAccountNumber)) {
          logger.debug(`Sender account found: ${account.account_number}`);
          senderAccount = account;
        }
        if (this._verifyAccountNumber(maskedReceiverAccount, normalizedAccountNumber)) {
          logger.debug(`Receiver account found: ${account.account_number}`);
          receiverAccount = account;
        }
      }

      // Verify the transaction matches user's accounts based on category
      if (category === 'Income' && !receiverAccount) {
        logger.error('Receiver account not found in user\'s accounts');
        throw new Error('Receiver account not found in user\'s accounts');
      } else if (category === 'Expense' && !senderAccount) {
        logger.error('Sender account not found in user\'s accounts');
        throw new Error('Sender account not found in user\'s accounts');
      } else if (category === 'Transfer' && (!senderAccount || !receiverAccount)) {
        logger.error('Both sender and receiver accounts must be found for transfers');
        throw new Error('Both sender and receiver accounts must be found for transfers');
      }

      const transactionData = {
        transaction_id: uuidv4(),
        transaction_datetime: new Date(slipData.date),
        category: category,
        type: type || slipData.type || 'Other',
        amount: parseFloat(slipData.amount.amount),
        note: [slipData.ref1, slipData.ref2, slipData.ref3]
          .filter(ref => ref)
          .join(' ') || '',
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

      logger.debug(`Prepared transaction data: ${JSON.stringify(transactionData)}`);
      return transactionData;
    } catch (error) {
      logger.error(`Error preparing transaction data: ${error.message}`);
      throw new Error(`Failed to prepare transaction data: ${error.message}`);
    }
  }
}

module.exports = ApiController;
