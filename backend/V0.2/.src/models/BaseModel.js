const Joi = require("joi");
const pgClient = require("../services/PgClient");
const Utils = require("../utilities/Utils");
const { ValidationError } = require("../utilities/ValidationErrors");

const { Logger } = Utils;
const logger = Logger("BaseModel");

class BaseModel {
  constructor(tableName, schema) {
    this.tableName = `"${tableName}"`;
    this.schema = schema;
    this.pgClient = pgClient;
  }

  async validateSchema(data, operation = "create") {
    logger.info("Validating schema...");
    logger.debug("Data to be validated:", data);

    try {
      const validated = await this.schema.validateAsync(data, {
        context: { operation },
      });
      logger.debug("Validation passed for data:", validated);
      return validated;
    } catch (error) {
      logger.error("Validation error:", error.message);
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

  async create(data) {
    return this.executeWithTransaction(async () => {
      const validated = await this.validateSchema(data, "create");
      logger.debug("Validated data:", validated);

      const keys = Object.keys(validated);
      const values = Object.values(validated);
      const placeholders = keys.map((_, index) => `$${index + 1}`).join(",");

      const sql = `INSERT INTO ${this.tableName} (${keys.join(
        ","
      )}) VALUES (${placeholders}) RETURNING *`;
      logger.debug("Create SQL prepared query:", sql);
      const result = await this.pgClient.query(sql, values);
      logger.debug("Create result:", result);
      return result;
    });
  }

  async findAll(userEmail) {
    const sql = `SELECT * FROM ${this.tableName} WHERE userEmail = $1`;
    const result = await this.pgClient.query(sql, [userEmail]);
    return result.rows;
  }

  async findOne(primaryKeys) {
    if (typeof primaryKeys !== "object" || primaryKeys === null) {
      throw new Error("primaryKeys must be a non-null object");
    }

    logger.info("Finding one...");
    logger.debug("primaryKeys:", primaryKeys);

    const keys = Object.keys(primaryKeys);
    const values = Object.values(primaryKeys);
    const condition = keys
      .map((key, index) => `${key} = $${index + 1}`)
      .join(" AND ");

    const sql = `SELECT * FROM ${this.tableName} WHERE ${condition}`;
    const result = await this.pgClient.query(sql, values);
    logger.debug("findOne result:", result.rows[0]);
    return result.rows[0];
  }

  async update(primaryKeys, data) {
    return this.executeWithTransaction(async () => {
      const validated = await this.validateSchema(data, "update");
      logger.debug("Validated data:", validated);

      const keys = Object.keys(primaryKeys);
      const primaryValues = Object.values(primaryKeys);
      const updateKeys = Object.keys(validated);
      const updateValues = Object.values(validated);

      const updatePlaceholders = updateKeys
        .map((key, index) => `${key} = $${index + 1}`)
        .join(",");
      const conditionPlaceholders = keys
        .map((_, index) => `$${updateKeys.length + index + 1}`)
        .join(" AND ");

      const sql = `UPDATE ${
        this.tableName
      } SET ${updatePlaceholders} WHERE ${keys.join(
        " = "
      )} = ${conditionPlaceholders} RETURNING *`;
      const result = await this.pgClient.query(sql, [
        ...updateValues,
        ...primaryValues,
      ]);
      logger.debug("Update result:", result.rows[0]);
      return result.rows[0];
    });
  }

  async delete(primaryKeys) {
    return this.executeWithTransaction(async () => {
      const keys = Object.keys(primaryKeys);
      const values = Object.values(primaryKeys);
      const placeholders = keys
        .map((_, index) => `$${index + 1}`)
        .join(" AND ");

      const sql = `DELETE FROM ${this.tableName} WHERE ${keys.join(
        " = "
      )} = ${placeholders} RETURNING *`;
      const result = await this.pgClient.query(sql, values);
      logger.debug("Delete result:", result.rows[0]);
      return result.rows[0];
    });
  }
}

module.exports = BaseModel;
