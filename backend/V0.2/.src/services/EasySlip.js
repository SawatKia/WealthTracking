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
        "EasySlip API key is invalid or URL is not set in environment variables. EasySlip API may not work properly."
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

  async fetchQuotaInformation() {
    logger.info("Fetching quota information from EasySlip API");
    if (
      !appConfigs.easySlip.key ||
      !this.apiKeyPattern.test(appConfigs.easySlip.key)
    ) {
      throw new Error(
        "EasySlip API key is missing. Cannot fetch quota information."
      );
    }
    try {
      const response = await this.client.get("/api/v1/me");
      logger.debug(`Raw quota response: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error) {
      logger.error(
        "Error fetching quota information from EasySlip API:",
        error.message
      );
      throw new Error("Failed to fetch quota information from EasySlip API");
    }
  }

  async verifySlip(base64Image) {
    logger.info("Sending slip verification request to EasySlip API");

    if (
      !appConfigs.easySlip.key ||
      !this.apiKeyPattern.test(appConfigs.easySlip.key)
    ) {
      throw new Error(
        "EasySlip API key is missing. Cannot verify slip information."
      );
    }
    if (!base64Image) {
      throw new Error("No image provided for slip verification");
    }

    try {
      const response = await this.client.post(
        "/api/v1/verify",
        {
          image: base64Image,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      logger.debug(
        `Raw verification response: ${JSON.stringify(response.data)}`
      );
      return response.data;
    } catch (error) {
      logger.error("Error verifying slip with EasySlip API:", error.message);
      throw new Error("Failed to verify slip with EasySlip API");
    }
  }
}

module.exports = new EasySlipService();
