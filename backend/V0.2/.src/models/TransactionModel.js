const Joi = require("joi");
const pgClient = require("../services/PgClient");
const redis = require("redis");

const BaseModel = require("./BaseModel");
const Utils = require("../utilities/Utils");
const appConfigs = require("../configs/AppConfigs");

const { Logger, formatResponse } = Utils;
const logger = Logger("TransactionModel");

class TransactionModel extends BaseModel {
  constructor() {
    const transactionSchema = Joi.object({
      transaction_id: Joi.number()
        .integer()
        .positive()
        .when(Joi.ref("$operation"), {
          is: "update",
          then: Joi.required(),
          otherwise: Joi.forbidden(),
        })
        .messages({
          "number.base": "Transaction ID must be a number.",
          "number.integer": "Transaction ID must be an integer.",
          "number.positive": "Transaction ID must be a positive number.",
          "any.required":
            "Transaction ID is required when updating a transaction.",
          "any.forbidden":
            "Transaction ID should not be provided for this operation.",
        }),

      transaction_datetime: Joi.date()
        .when(Joi.ref("$operation"), {
          is: "create",
          then: Joi.required(),
          otherwise: Joi.optional(),
        })
        .messages({
          "date.base": "Transaction datetime must be a valid date.",
          "any.required":
            "Transaction datetime is required when creating a transaction.",
        }),

      category: Joi.string()
        .valid("income", "expense")
        .when(Joi.ref("$operation"), {
          is: "create",
          then: Joi.required(),
          otherwise: Joi.optional(),
        })
        .messages({
          "string.valid": 'Category must be either "income" or "expense".',
          "any.required": "Category is required when creating a transaction.",
        }),

      type: Joi.string()
        .max(20)
        .when(Joi.ref("$operation"), {
          is: "create",
          then: Joi.required(),
          otherwise: Joi.optional(),
        })
        .messages({
          "string.max": "Type must not exceed 20 characters.",
          "any.required": "Type is required when creating a transaction.",
        }),

      amount: Joi.number()
        .precision(2)
        .when(Joi.ref("$operation"), {
          is: "create",
          then: Joi.required(),
          otherwise: Joi.optional(),
        })
        .messages({
          "number.base": "Amount must be a number.",
          "number.precision": "Amount must have at most 2 decimal places.",
          "any.required": "Amount is required when creating a transaction.",
        }),

      note: Joi.string().allow(null, "").optional().messages({
        "string.base": "Note must be a string.",
      }),

      national_id: Joi.string()
        .length(13)
        .pattern(/^[0-9]*$/, "numeric characters only")
        .when(Joi.ref("$operation"), {
          is: Joi.valid("create", "update", "delete"),
          then: Joi.required(),
          otherwise: Joi.optional(),
        })
        .messages({
          "string.length": "National ID must be 13 characters long.",
          "string.pattern.name":
            "National ID must contain only numeric characters.",
          "any.required": "National ID is required for this operation.",
        }),

      debt_number: Joi.string().max(50).allow(null, "").optional().messages({
        "string.max": "Debt number must not exceed 50 characters.",
      }),

      fi_code: Joi.string().max(20).allow(null, "").optional().messages({
        "string.max":
          "Financial institution code must not exceed 20 characters.",
      }),
    });
    super("transactions", transactionSchema);
    this.redisClient = redis.createClient();
    this.redisClient.on("error", (err) => {
      logger.error(err);
    });
    this.redisClient.on("ready", () => {
      logger.info("Redis client connected to Redis server.");
    });
  }
}
