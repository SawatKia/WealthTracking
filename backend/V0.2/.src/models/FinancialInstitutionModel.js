const Joi = require("joi");
const path = require("path");
const fs = require("fs");
const { parse } = require("csv-parse");

const BaseModel = require("./BaseModel");
const Utils = require("../utilities/Utils");
const appConfigs = require("../configs/AppConfigs");
const pgClient = require("../services/PgClient");

const { Logger, formatResponse } = Utils;
const logger = Logger("FinancialInstitutionModel");

class FinancialInstitutionModel extends BaseModel {
  constructor() {
    const schema = Joi.object({
      fi_code: Joi.string().max(20).required(),
      name_th: Joi.string().max(255).required(),
      name_en: Joi.string().max(255).required(),
    });

    super("financial_institutions", schema);
  }

  async initializeData() {
    logger.info("Initializing FI data...");
    try {
      const isEmpty = await this._isTableEmpty();
      logger.debug(`Table is empty: ${isEmpty}`);
      if (isEmpty) {
        await this._importCSVData();
        logger.info("CSV import completed successfully.");
      } else {
        logger.info(
          "Financial institutions table is not empty. Skipping CSV import."
        );
      }
      return true;
    } catch (error) {
      logger.error(`Error initializing data: ${error.message}`);
      throw error;
    }
  }

  async _isTableEmpty() {
    logger.info("Checking if table is empty...");
    const result = await pgClient.query(
      `SELECT COUNT(*) FROM ${this.tableName}`
    );
    return parseInt(result.rows[0].count) === 0;
  }

  async _importCSVData() {
    logger.info("Importing CSV data...");
    // Define the CSV file path based on the environment whether it is test or in docker
    const csvFilePath = path.join(__dirname, "../../statics/FI_CODE.csv")
    // Check if the CSV file exists
    if (!fs.existsSync(csvFilePath)) {
      logger.error(`CSV file not found: ${csvFilePath}`);
      throw new Error("CSV path not found");
    }

    try {
      const results = [];
      // Read the CSV file into a stream
      const readStream = fs.createReadStream(csvFilePath).pipe(
        parse({
          delimiter: ",",
          from_line: 2, // Skip the header
        })
      );

      // Collect all rows from the stream
      for await (const row of readStream) {
        logger.silly(`CSV row: ${JSON.stringify(row)}`);
        // Assuming the row is an array, map it to an object for easier handling
        const data = {
          fi_code: row[0],
          name_th: row[1],
          name_en: row[2],
          OPEN_DATE: row[3], // If you want to use this later
        };
        results.push(data);
      }

      logger.info("CSV file read successfully");
      logger.debug(`Sample CSV read data: ${JSON.stringify(results.slice(0, 3), null, 2)}...(remain ${results.length - 3} objects)...`);

      // Now that we have all rows, validate and insert them
      for (const data of results) {
        // Validate and push data into the results array
        if (
          String(data.fi_code)?.trim() &&
          String(data.name_th)?.trim() &&
          String(data.name_en)?.trim()
        ) {
          logger.silly(`Valid data row added: ${JSON.stringify(data)}`);
        } else {
          logger.warn(`Invalid data row, skipped: ${JSON.stringify(data)}`);
          continue;
        }

        // Prepare sanitized data for database insertion
        const sanitizedData = {
          fi_code: data.fi_code,
          name_th: data.name_th,
          name_en: data.name_en,
        };

        logger.silly(
          `Attempting to insert CSV data to the Database: ${sanitizedData.fi_code}`
        );

        // Prepare the SQL query for inserting data
        const sql = `INSERT INTO ${this.tableName} (fi_code, name_th, name_en) VALUES ($1, $2, $3)`;

        try {
          // Execute the query with values from the CSV
          await pgClient.query(sql, [
            sanitizedData.fi_code,
            sanitizedData.name_th,
            sanitizedData.name_en,
          ], { silent: true });
        } catch (error) {
          if (error.code === "23505") {
            logger.warn(
              `Duplicate entry for fi_code: ${sanitizedData.fi_code}, skipping this row.`
            );
          } else {
            logger.error(`Error inserting data: ${error.message}`);
            throw error;
          }
        }
      }
      logger.info("Financial institutions imported successfully");
    } catch (error) {
      logger.error(`Error importing financial institutions: ${error.message}`);
      throw error;
    }
  }

  async findAll() {
    logger.info("Finding all FI data...");
    const result = await pgClient.query(`SELECT * FROM ${this.tableName}`);
    return result.rows;
  }
}

module.exports = FinancialInstitutionModel;
