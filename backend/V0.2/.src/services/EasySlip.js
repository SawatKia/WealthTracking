const axios = require("axios");
const Utils = require("../utilities/Utils");
const appConfigs = require("../configs/AppConfigs");

const { Logger, formatResponse } = Utils;
const logger = Logger("EasySlipService");

class EasySlipService {
  constructor() {
    this.apiKeyPattern =
      /^[a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12}$/;
    if (
      !appConfigs.easySlip.key ||
      !this.apiKeyPattern.test(appConfigs.easySlip.key) ||
      !appConfigs.easySlip.url
    ) {
      logger.warn(
        "EasySlip API key or URL is invalid. EasySlip API may not work properly."
      );
    } else {
      this.client = axios.create({
        baseURL: appConfigs.easySlip.url,
        headers: {
          Authorization: `Bearer ${appConfigs.easySlip.key}`,
        },
        timeout: 5000, // 5 seconds timeout
      });
    }
  }

  async init() {
    if (!this.client) {
      logger.error("Failed to initialize EasySlip API client");
      throw new Error("Failed to initialize EasySlip API client");
    }
    if (
      !appConfigs.easySlip.key ||
      !this.apiKeyPattern.test(appConfigs.easySlip.key)
    ) {
      logger.warn("EasySlip API key is invalid");
    }
    logger.info("EasySlip API client initialized successfully");
    return true;
  }

  async fetchQuotaInformation() {
    logger.info("Fetching quota information from EasySlip API");

    // Validate API key before making the request
    if (
      !appConfigs.easySlip.key ||
      !this.apiKeyPattern.test(appConfigs.easySlip.key)
    ) {
      logger.error("EasySlip API key is invalid");
      throw new Error("Invalid EasySlip API key provided");
    }

    try {
      const response = await this.client.get("/api/v1/me");
      logger.debug(`Raw quota response: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error) {
      logger.error(
        `Error fetching quota information from EasySlip API: ${error.message}`
      );
      // Throw a more descriptive error to provide context
      throw new Error("Failed to fetch quota information from EasySlip API");
    }
  }

  /**
   * Verifies slip by payload (QR code data).
   * @param {string} payload - QR code data.
   * @returns {Promise<Object>} The verification result.
   */
  async verifySlipByPayload(payload) {
    logger.info("Sending slip verification request by payload to EasySlip API");

    if (!appConfigs.easySlip.key || !this.apiKeyPattern.test(appConfigs.easySlip.key)) {
      logger.error("EasySlip API key is invalid");
      throw new Error("Invalid EasySlip API key provided");
    }
    if (!payload) {
      logger.error("No payload provided for slip verification");
      throw new Error("No payload provided for slip verification");
    }

    try {
      const response = await this.client.get("/api/v1/verify", {
        params: { payload },
      });
      logger.debug(`Raw verification response: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error) {
      logger.error(`Error verifying slip with EasySlip API by payload: ${error.message}`);
      throw new Error("Failed to verify slip by payload with EasySlip API");
    }
  }

  /**
   * Verifies slip by image file upload.
   * @param {Object} file - The image file.
   * @returns {Promise<Object>} The verification result.
   */
  async verifySlipByImage(file) {
    logger.info("Sending slip verification request by file to EasySlip API");

    if (!appConfigs.easySlip.key || !this.apiKeyPattern.test(appConfigs.easySlip.key)) {
      logger.error("EasySlip API key is invalid");
      throw new Error("Invalid EasySlip API key provided");
    }
    if (!file) {
      logger.error("No file provided for slip verification");
      throw new Error("No file provided for slip verification");
    }

    try {
      const formData = new FormData();
      formData.append("file", file.buffer, file.originalname);

      const response = await this.client.post("/api/v1/verify", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      logger.debug(`Raw verification response: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error) {
      logger.error(`Error verifying slip with EasySlip API by image: ${error.message}`);
      throw new Error("Failed to verify slip by image with EasySlip API");
    }
  }

  /**
   * Verifies slip by base64 encoded image.
   * @param {string} base64Image - The base64 encoded image.
   * @returns {Promise<Object>} The verification result.
   */
  async verifySlipByBase64(base64Image) {
    logger.info("Sending slip verification request by base64 to EasySlip API");

    if (!appConfigs.easySlip.key || !this.apiKeyPattern.test(appConfigs.easySlip.key)) {
      logger.error("EasySlip API key is invalid");
      throw new Error("Invalid EasySlip API key provided");
    }
    if (!base64Image) {
      logger.error("No image provided for slip verification");
      throw new Error("No image provided for slip verification");
    }

    try {
      const response = await this.client.post(
        "/api/v1/verify",
        { image: base64Image },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      logger.debug(`Raw verification response: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error) {
      logger.error(`Error verifying slip with EasySlip API by base64: ${error.message}`);
      throw new Error("Failed to verify slip by base64 with EasySlip API");
    }
  }
}

module.exports = new EasySlipService();
