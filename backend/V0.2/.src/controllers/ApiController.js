const EasySlipService = require("../services/EasySlip");
const APIRequestLimitModel = require("../models/APIRequestLimitModel");
const Utils = require("../utilities/Utils");
const MyAppErrors = require("../utilities/MyAppErrors");

const { Logger, formatResponse } = Utils;
const logger = Logger("ApiController");

class ApiController {
  constructor() {
    this.easySlipService = EasySlipService;
    this.apiRequestLimitModel = new APIRequestLimitModel();
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
          "there is no todal's request to the api yet, create a new one"
        );
        requestLimit = await this.apiRequestLimitModel.createRequestLimit(
          "EasySlip",
          currentDate
        );
        logger.debug(
          `create requestLimit: ${requestLimit ? JSON.stringify(requestLimit) : "empty"
          }`
        );
        return true;
      } else if (requestLimit.request_count >= 7) {
        logger.warn("Daily EasySlip API request limit reached");
        return false;
      }

      // ensure that the quota is not low and has not expired
      const quotaInfo = await this.easySlipService.fetchQuotaInformation();
      logger.debug(`quotaInfo: ${JSON.stringify(quotaInfo)}`);
      const { remainingQuota, expiredAt } = quotaInfo.data;

      if (remainingQuota <= 5) {
        logger.warn("EasySlip API remaining quota is low");
        return false;
      }

      if (new Date(expiredAt) < new Date()) {
        logger.warn("EasySlip API quota has expired");
        return false;
      }

      return true;
    } catch (error) {
      logger.error(
        "Error checking EasySlip quota availability:",
        error.message
      );
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
   * Verifies bank slip by payload (QR code).
   * @param {Object} req - The HTTP request object.
   * @param {string} req.query.payload - The QR code payload. Data read from qr code
   * @param {Object} res - The HTTP response object.
   * @param {function} next - The next middleware function.
   */
  async extractSlipDataByPayload(req, res, next) {
    logger.info("Processing slip data extraction by payload request");
    try {
      const { payload } = req.query;
      if (!payload) {
        throw MyAppErrors.badRequest("No payload provided");
      }

      const isQuotaAvailable = await this._checkQuotaAvailability();
      if (!isQuotaAvailable) {
        req.formattedResponse = formatResponse(
          200,
          "EasySlip service is currently unavailable, mock data response is returned",
          this.mockDataResponse
        );
        next();
      }

      const verificationResult = await this.easySlipService.verifySlipByPayload(payload);
      await this.apiRequestLimitModel.incrementRequestCount(
        "EasySlip",
        this._getCurrentDate()
      );

      req.formattedResponse = formatResponse(
        200,
        "Slip verification success by payload",
        verificationResult.data
      );
      next();
    } catch (error) {
      logger.error("Error processing slip data extraction by payload:", error.message);
      next(error);
    }
  }

  /**
   * Verifies bank slip by image file upload.
   * @param {Object} req - The HTTP request object.
   * @param {Object} req.file - The image file from multipart/form-data.
   * @param {Object} res - The HTTP response object.
   * @param {function} next - The next middleware function.
   */
  async extractSlipDataByFile(req, res, next) {
    logger.info("Processing slip data extraction by file request");
    try {
      const file = req.file; // Assuming file is uploaded using multer or similar middleware
      if (!file) {
        throw MyAppErrors.badRequest("No file provided");
      }

      const isQuotaAvailable = await this._checkQuotaAvailability();
      if (!isQuotaAvailable) {
        req.formattedResponse = formatResponse(
          200,
          "EasySlip service is currently unavailable, mock data response is returned",
          this.mockDataResponse
        );
        next();
      }

      const verificationResult = await this.easySlipService.verifySlipByImage(file);
      await this.apiRequestLimitModel.incrementRequestCount(
        "EasySlip",
        this._getCurrentDate()
      );

      req.formattedResponse = formatResponse(
        200,
        "Slip verification success by file",
        verificationResult.data
      );
      next();
    } catch (error) {
      logger.error("Error processing slip data extraction by file:", error.message);
      next(error);
    }
  }

  /**
   * Verifies bank slip by base64 encoded image.
   * @param {Object} req - The HTTP request object.
   * @param {string} req.body.image - The base64 encoded image.
   * @param {Object} res - The HTTP response object.
   * @param {function} next - The next middleware function.
   */
  async extractSlipDataByBase64(req, res, next) {
    logger.info("Processing slip data extraction request");
    try {
      const { base64Image } = req.body;
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
        req.formattedResponse = formatResponse(
          200,
          "EasySlip service is currently unavailable, mock data response is return",
          this.mockDataResponse
        );
        next();
      }

      const verificationResult = await this.easySlipService.verifySlipByBase64(
        base64Image
      );
      await this.apiRequestLimitModel.incrementRequestCount(
        "EasySlip",
        this._getCurrentDate()
      );

      req.formattedResponse = formatResponse(
        200,
        "Slip verification success",
        verificationResult.data
      );
      next();
    } catch (error) {
      logger.error("Error processing slip data extraction:", error.message);
      if (error.message == "EasySlip API key is invalid") {
        next(MyAppErrors.badRequest(error.message));
      }
      next(error);
    }
  }
}

module.exports = ApiController;
