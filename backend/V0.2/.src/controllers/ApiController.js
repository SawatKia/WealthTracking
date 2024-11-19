const sanitizeHtml = require('sanitize-html');
const validator = require('validator');
const path = require('path');

const EasySlipService = require("../services/EasySlip");
const APIRequestLimitModel = require("../models/APIRequestLimitModel");
const Utils = require("../utilities/Utils");
const MyAppErrors = require("../utilities/MyAppErrors");
const SlipHistoryModel = require('../models/SlipHistoryModel');
const QRCodeReader = require('../utilities/QRCodeReader');

const { Logger, formatResponse } = Utils;
const logger = Logger("ApiController");

class ApiController {
  constructor() {
    this.easySlipService = EasySlipService;
    this.apiRequestLimitModel = new APIRequestLimitModel();
    this.slipHistoryModel = new SlipHistoryModel();
    this.mockDataResponse = {
      payload: "00000000000000000000000000000000000000000000000000000000000",
      transRef: "68370160657749I376388B35",
      date: "2023-01-01T00:00:00+07:00",
      countryCode: "TH",
      amount: {
        amount: 1000,
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
            account: "1234xxxx5678",
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
    this.extractSlipDataByPayload = this.extractSlipDataByPayload.bind(this);
    this.extractSlipDataByFile = this.extractSlipDataByFile.bind(this);
    this.extractSlipDataByBase64 = this.extractSlipDataByBase64.bind(this);
  }

  _getCurrentDate() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
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
        logger.debug("returning true");
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
   * @param {string} req.query.payload - The QR code data (payload) from bank slip.
   * @param {Object} req.file - The image file from bank slip.
   * @param {string} req.body.base64Image - The base64 encoded image from bank slip.
   * @param {Object} res - The HTTP response object.
   * @param {function} next - The next middleware function.
   */
  async verifySlip(req, res, next) {
    logger.info("Processing unified slip verification request");
    try {
      let result;
      let payload;
      logger.debug(`req.query: ${JSON.stringify(req.query)}`);
      logger.debug(`req.file: ${JSON.stringify(req.file)}`);
      logger.debug(`req.body: ${JSON.stringify(req.body)}`);

      // Validate and sanitize query parameters
      const sanitizedQuery = this._sanitizeObject(req.query);
      logger.debug(`sanitizedQuery: ${JSON.stringify(sanitizedQuery)}`);

      if (sanitizedQuery.payload) {
        // For direct payload input
        payload = sanitizedQuery.payload;
        // Validate payload
        if (!this._isValidPayload(payload)) {
          throw MyAppErrors.badRequest("The provided payload format is invalid.");
        }
        logger.debug(`payload: ${payload.substring(0, 50)}...[truncated]`);

      } else if (req.file) {
        // For file upload
        if (!this._isValidFile(req.file)) {
          throw MyAppErrors.badRequest("The uploaded file is invalid or exceeds the size limit.");
        }
        logger.debug(`file: { filename: ${req.file.originalname}, size: ${req.file.size} }`);

        // Extract payload from QR in image using the new utility
        payload = await QRCodeReader.extractPayloadFromBuffer(req.file.buffer);
        if (!payload) {
          throw MyAppErrors.badRequest("Could not extract QR code from image");
        }
        logger.debug(`extracted payload from image: ${payload}`);

      } else if (req.body && req.body.base64Image) {
        // Validate base64 image
        if (!this._isValidBase64Image(req.body.base64Image)) {
          throw MyAppErrors.badRequest("The provided base64 image format is invalid.");
        }
        logger.debug(`base64Image: ${req.body.base64Image.substring(0, 50)}...[truncated]`);

        // Extract payload from base64 image using the new utility
        payload = await QRCodeReader.extractPayloadFromBase64(req.body.base64Image);
        if (!payload) {
          throw MyAppErrors.badRequest("Could not extract QR code from base64 image");
        }
        logger.debug(`extracted payload from base64: ${payload}`);

      } else {
        throw MyAppErrors.badRequest("At least one of the following is required: payload, file, or base64 image.");
      }

      // Check for duplicate slip using the extracted/provided payload
      const isDuplicate = await this.slipHistoryModel.checkDuplicateSlip(payload);
      if (isDuplicate) {
        throw MyAppErrors.badRequest("This slip has already been used");
      }
      logger.info("Slip is not duplicate, proceed to extract slip data");

      // Process the slip based on the original input method
      // This is to ensure that the slip data is extracted using the same method as the input
      // to prevent any data corruption during the extraction process
      if (sanitizedQuery.payload) {
        result = await this.extractSlipDataByPayload(payload);
      } else if (req.file) {
        result = await this.extractSlipDataByFile(req.file);
      } else {
        result = await this.extractSlipDataByBase64(req.body.base64Image);
      }

      if (!result) {
        throw MyAppErrors.badRequest(result.message || "Failed to verify slip");
      }

      // Record the slip usage after successful verification
      await this.slipHistoryModel.recordSlipUsage(
        payload,
        result.data.transRef,
        req.user.sub
      );
      logger.info("Slip usage recorded successfully");

      req.formattedResponse = formatResponse(200, result.message, result.data);
      next();
    } catch (error) {
      logger.error("Error processing unified slip verification:", error);
      next(error);
    }
  }

  /**
   * Verifies bank slip by payload (QR code).
   * @param {string} payload - The QR code payload. Data read from qr code
   * @returns {Promise<Object>} The verification result.
   */
  async extractSlipDataByPayload(payload) {
    logger.info("Processing slip data extraction by payload");
    if (!payload) {
      throw MyAppErrors.badRequest("No payload provided");
    }

    const isQuotaAvailable = await this._checkQuotaAvailability();
    if (!isQuotaAvailable) {
      logger.warn("EasySlip service is currently unavailable, mock data response is returned");
      return {
        message: "EasySlip service is currently unavailable, mock data response is returned",
        data: this.mockDataResponse
      };
    }

    const verificationResult = await this.easySlipService.verifySlipByPayload(payload);
    await this.apiRequestLimitModel.incrementRequestCount(
      "EasySlip",
      this._getCurrentDate()
    );

    return {
      message: "Slip verification success by payload",
      data: verificationResult.data
    };
  }



  /**
   * Verifies bank slip by image file upload.
   * @param {Object} file - The image file from multipart/form-data.
   * @returns {Promise<Object>} The verification result.
   */
  async extractSlipDataByFile(file) {
    logger.info("Processing slip data extraction by file");
    if (!file) {
      throw MyAppErrors.badRequest("No file provided");
    }
    logger.debug(`file: ${JSON.stringify(file, null, 2)}`);

    const isQuotaAvailable = await this._checkQuotaAvailability();
    if (!isQuotaAvailable) {
      logger.warn("EasySlip service is currently unavailable, mock data response is returned");
      return {
        message: "EasySlip service is currently unavailable, mock data response is returned",
        data: this.mockDataResponse
      };
    }

    const verificationResult = await this.easySlipService.verifySlipByImage(file);
    await this.apiRequestLimitModel.incrementRequestCount(
      "EasySlip",
      this._getCurrentDate()
    );

    return {
      message: "Slip verification success by file",
      data: verificationResult.data
    };
  }

  /**
   * Verifies bank slip by base64 encoded image.
   * @param {string} base64Image - The base64 encoded image.
   * @returns {Promise<Object>} The verification result.
   */
  async extractSlipDataByBase64(base64Image) {
    logger.info("Processing slip data extraction by base64");
    if (!base64Image || typeof base64Image !== "string") {
      throw MyAppErrors.badRequest("Invalid input");
    }
    const base64Regex = /^data:image\/(png|jpg|jpeg|gif);base64,/;
    const match = base64Image.match(base64Regex);
    if (!match) {
      throw MyAppErrors.badRequest("Invalid base64 image format provided");
    }

    const isQuotaAvailable = await this._checkQuotaAvailability();
    if (!isQuotaAvailable) {
      logger.warn("EasySlip service is currently unavailable, mock data response is returned");
      return {
        message: "EasySlip service is currently unavailable, mock data response is returned",
        data: this.mockDataResponse
      };
    }

    const verificationResult = await this.easySlipService.verifySlipByBase64(base64Image);
    await this.apiRequestLimitModel.incrementRequestCount(
      "EasySlip",
      this._getCurrentDate()
    );

    return {
      message: "Slip verification success by base64",
      data: verificationResult.data
    };
  }
}

module.exports = ApiController;
