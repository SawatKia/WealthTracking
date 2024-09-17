const BaseModel = require('./BaseModel');
const Joi = require('joi');

class APIRequestLimitModel extends BaseModel {
    constructor() {
        const schema = Joi.object({
            service_name: Joi.string().required(),
            request_date: Joi.date().required(),
            request_count: Joi.number().integer().min(0).required()
        });

        super('api_request_limits', schema);
    }

    async getRequestLimit(serviceName, date) {
        return this.findOne({ service_name: serviceName, request_date: date });
    }

    async createRequestLimit(serviceName, date) {
        return this.create({
            service_name: serviceName,
            request_date: date,
            request_count: 0  // Initialize request count to 0
        });
    }

    async incrementRequestCount(serviceName, date) {
        const currentLimit = await this.getRequestLimit(serviceName, date);
        if (!currentLimit) {
            return this.createRequestLimit(serviceName, date);
        }
        return this.update(
            { service_name: serviceName, request_date: date },
            { request_count: currentLimit.request_count + 1 }
        );
    }
}

module.exports = APIRequestLimitModel;