const BaseModel = require('./BaseModel');
const Joi = require('joi');
const { Logger } = require('../utilities/Utils');
const logger = Logger('SlipHistoryModel');

class SlipHistoryModel extends BaseModel {
    constructor() {
        const schema = Joi.object({
            id: Joi.number().integer(),
            payload: Joi.string().required(),
            trans_ref: Joi.string().required(),
            national_id: Joi.string().length(13).required(),
            created_at: Joi.date()
        });

        super('slip_history', schema);
    }

    async checkDuplicateSlip(payload) {
        try {
            logger.info('Checking for duplicate slip');
            logger.debug(`payload: ${payload}`);

            const result = await this.findOne({ payload });
            logger.debug(`duplicate check result: ${JSON.stringify(result)}`);

            return result !== null;
        } catch (error) {
            logger.error(`Error checking duplicate slip: ${error.message}`);
            throw error;
        }
    }

    async recordSlipUsage(payload, transRef, nationalId) {
        try {
            logger.info('Recording slip usage');
            logger.debug(`payload: ${payload}, transRef: ${transRef}, nationalId: ${nationalId}`);

            const result = await this.create({
                payload,
                trans_ref: transRef,
                national_id: nationalId
            });

            logger.debug(`slip usage recorded: ${JSON.stringify(result)}`);
            return result;
        } catch (error) {
            logger.error(`Error recording slip usage: ${error.message}`);
            throw error;
        }
    }
}

module.exports = SlipHistoryModel; 