const Joi = require("joi");
const pgClient = require("../services/PgClient");
const { Logger } = require("../utilities/Utils");
const { ValidationError } = require("../utilities/ValidationErrors");

const logger = Logger("BaseModel");

class BaseModel {
  constructor(tableName, schema) {
    this.tableName = tableName;
    this.schema = schema;
    this.pgClient = pgClient;
  }

  async validateSchema(data, operation = "create") {
    logger.info("Validating schema...");

    try {
      if (!data || typeof data !== 'object') {
        logger.error("Data is empty or not an object");
        throw new ValidationError("Data is empty or not an object");
      }
      if (!this.schema) {
        logger.error("Schema is not defined for this model.");
        throw new ValidationError("Schema is not defined for this model.");
      }
      logger.info("Validating data against schema for operation:", operation);
      const validated = await this.schema.validateAsync(data, {
        context: { operation },
      });
      logger.debug("Validation passed for data:", validated);
      return validated;
    } catch (error) {
      logger.error("Validation error: ", error.message);
      throw new ValidationError(error.message);
    }
  }

  async executeWithTransaction(operation) {
    try {
      await this.pgClient.beginTransaction();
      const result = await operation();
      await this.pgClient.commit();
      return result;
    } catch (error) {
      await this.pgClient.rollback();
      throw error;
    }
  }

  /**
   * Executes a SQL query with the given parameters in a transaction.
   * If the execution succeeds, the transaction is commited and the result is returned.
   * If the execution fails, the transaction is rolled back and the error is re-thrown.
   * @param {string} sql - SQL query to execute
   * @param {any[]} params - Parameters to be passed to the query
   * @param {Object} options - Options object with silent property
   * @param {boolean} options.silent - If true, the query will not be logged
   * @returns {Promise<pg.QueryResult>} - Result of the query
   */
  async executeQuery(sql, params, options = { silent: false }) {
    try {
      return await this.executeWithTransaction(async () => {
        const result = await this.pgClient.query(sql, params, options);
        return result;
      });
    } catch (error) {
      logger.error("Error executing query: %s", error);
      throw error;
    }
  }

  /**
   * Creates a new record in the table with the given data.
   * The data is validated against the schema before creating the record.
   * If the validation fails, a ValidationError is thrown.
   * If the creation fails, the error is re-thrown.
   * @param {Object} data - Data to be inserted
   * @param {Object} options - Options object with silent property
   * @param {boolean} options.silent - If true, the query will not be logged
   * @returns {Promise<pg.QueryResult>} - Result of the query
   */
  async create(data, options = { silent: false }) {
    try {
      if (!data || typeof data !== 'object') {
        logger.error("Data is empty or not an object");
        throw new ValidationError("Data is empty or not an object");
      }
      return await this.executeWithTransaction(async () => {
        const validated = await this.validateSchema(data, "create");
        logger.debug("Validated data: " + JSON.stringify(validated));

        const keys = Object.keys(validated);
        const values = Object.values(validated);
        const placeholders = keys.map((_, index) => `$${index + 1}`).join(",");

        const sql = `INSERT INTO ${this.tableName} (${keys.join(
          ","
        )}) VALUES (${placeholders}) RETURNING *`;
        logger.debug("Create SQL prepared query: %s", sql);
        const result = await this.pgClient.query(sql, values, options);
        logger.silly("Create SQL result: " + JSON.stringify(result));
        logger.debug("Create result: " + JSON.stringify(result.rows[0]));
        return result.rows[0];
      });
    } catch (error) {
      logger.error("Error creating record: ", error);
      throw error;
    }
  }

  /**
   * Finds all records in the table that belong to the given user email.
   * @param {string} nationalId - National ID of the user to find records for
   * @returns {Promise<Array<Object>>} - Array of records found
   */
  async list(nationalId) {
    try {
      logger.info(`Listing records from ${this.tableName}`);
      if (this.tableName === 'financial_institutions') {
        logger.debug(`Listing financial institutions data`);
        const result = await this.pgClient.query(`SELECT * FROM ${this.tableName}`);
        logger.debug(`Listing financial institutions data result: ${JSON.stringify(result.rows)}`);
        return result.rows;
      } else if (!nationalId || typeof nationalId !== 'string') { // For other tables
        logger.error("National ID is empty or not a string");
        throw new ValidationError("National ID is empty or not a string");
      }
      const sql = `SELECT * FROM ${this.tableName} WHERE national_id = $1`;
      const result = await this.pgClient.query(sql, [nationalId]);
      return result.rows;
    } catch (error) {
      logger.error("Error listing records: %s", error);
      throw error;
    }
  }

  /**
   * Finds one record in the table that matches the given primary keys.
   * If no record is found, null is returned.
   * @param {Object} primaryKeys - Object with primary key names as keys and values as values
   * @returns {Promise<Object | null>} - Found record or null
   */
  async findOne(primaryKeys) {
    try {
      if (typeof primaryKeys !== "object" || primaryKeys === null) {
        logger.error("primaryKeys must be a non-null object");
        throw new ValidationError("primaryKeys must be a non-null object");
      }

      logger.info("Finding one...");
      logger.debug("primaryKeys: %s", JSON.stringify(primaryKeys));

      const keys = Object.keys(primaryKeys);
      const values = Object.values(primaryKeys);
      const condition = keys
        .map((key, index) => `"${key}" = $${index + 1}`)
        .join(" AND ");

      const sql = `SELECT * FROM ${this.tableName} WHERE ${condition}`;
      const result = await this.pgClient.query(sql, values);
      logger.debug("findOne result: " + JSON.stringify(result.rows[0]));
      return result.rows[0];
    } catch (error) {
      logger.error("Error finding one record: %s", error);
      throw error;
    }
  }

  /**
   * Updates one record in the table that matches the given primary keys.
   * The method takes a second argument which is an object containing the
   * fields to be updated and their respective values.
   * The method returns the updated record.
   * If no record is found, null is returned.
   * @param {Object} primaryKeys - Object with primary key names as keys and values as values
   * @param {Object} data - Object with fields to be updated and their respective values
   * @returns {Promise<Object | null>} - Updated record or null
   */
  async update(primaryKeys, data) {
    try {
      logger.info("Updating record...");
      logger.debug(`primaryKeys: ${JSON.stringify(primaryKeys)}`);
      logger.debug(`data to update: ${JSON.stringify(data)}`);
      const dataToUpdate = { ...primaryKeys, ...data };

      return await this.executeWithTransaction(async () => {
        const validated = await this.validateSchema(dataToUpdate, "update");
        logger.debug(`Validated data: ${JSON.stringify(validated)}`);
        if (typeof primaryKeys !== "object" || primaryKeys === null) {
          logger.error("primaryKeys must be a non-null object");
          throw new ValidationError("primaryKeys must be a non-null object");
        }
        if (typeof data !== "object" || data === null) {
          logger.error("data must be a non-null object");
          throw new ValidationError("data must be a non-null object");
        }

        const keys = Object.keys(primaryKeys);
        const primaryValues = Object.values(primaryKeys);
        const updateKeys = Object.keys(data);
        const updateValues = Object.values(data);

        const updatePlaceholders = updateKeys
          .map((key, index) => {
            if (key === 'date_of_birth') {
              return `"${key}" = $${index + 1}::DATE`;
            }
            return `"${key}" = $${index + 1}`;
          })
          .join(", ");

        const conditionPlaceholders = keys
          .map((key, index) => `"${key}" = $${updateKeys.length + index + 1}`)
          .join(" AND ");

        const sql = `UPDATE ${this.tableName} 
          SET ${updatePlaceholders} 
          WHERE ${conditionPlaceholders} 
          RETURNING *`; //  RETURNING ${updateKeys.join(", ")} to return only the updated fields

        logger.debug(`Update SQL: ${sql}`);
        logger.debug(`Update params: ${JSON.stringify(updateValues.concat(primaryValues))}`);

        const result = await this.pgClient.query(sql, [
          ...updateValues,
          ...primaryValues,
        ]);
        logger.debug("Update result: " + JSON.stringify(result.rows[0]));

        return result.rows[0];
      });
    } catch (error) {
      logger.error("Error updating record: %s", error);
      throw error;
    }
  }

  /**
   * Deletes a record from the table that matches the given primary keys.
   * The method returns the deleted record or null if the record was not found.
   * @param {Object} primaryKeys - Object with primary key names as keys and values as values
   * @returns {Promise<Object | null>} - Deleted record or null
   */
  async delete(primaryKeys) {
    try {
      logger.info("Deleting record...");
      if (typeof primaryKeys !== "object" || primaryKeys === null) {
        logger.error("primaryKeys must be a non-null object");
        throw new ValidationError("primaryKeys must be a non-null object");
      }
      logger.debug("primaryKeys:", primaryKeys);

      return await this.executeWithTransaction(async () => {
        const keys = Object.keys(primaryKeys);
        const values = Object.values(primaryKeys);
        logger.debug("keys:", keys);
        logger.debug("values:", values);

        const conditions = keys
          .map((key, index) => `"${key}" = $${index + 1}`)
          .join(" AND ");

        const sql = `DELETE FROM ${this.tableName} WHERE ${conditions} RETURNING *`;
        logger.debug("Delete SQL:", sql);
        logger.debug("Delete params:", values);

        const result = await this.pgClient.query(sql, values);
        logger.debug("Delete result:", result.rows[0]);
        return result.rows[0];
      });
    } catch (error) {
      logger.error("Error deleting record:", error);
      throw error;
    }
  }
}

module.exports = BaseModel;