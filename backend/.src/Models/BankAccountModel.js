const mongoose = require('mongoose');


const Logging = require('../configs/logger');
require('dotenv').config();
const BaseModel = require('./BaseModel');
const MongoObject = require('./MongoObject');

const logger = new Logging('BankAccountModel');
const bankAccountSchema = new mongoose.Schema({
    accountNumber: { type: String, required: true, unique: true },
    accountDisplayName: { type: String, required: true },
    accountName: { type: String, required: true },
    bankName: { type: String, required: true },
    balance: { type: Number, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

class BankAccountModel extends BaseModel {
    constructor() {
        super('BankAccount', bankAccountSchema);
    }

    async updateAccountBalance(accountNumber, newBalance) {
        try {
            logger.info(`Updating account balance`);
            logger.debug(`Account number: ${accountNumber} New balance: ${newBalance}`);
            const result = await this.model.findOneAndUpdate({ accountNumber }, { balance: newBalance }, { new: true });
            return MongoObject.toObject(result);
        } catch (error) {
            logger.error(`Error updating account balance: ${error.message}`);
            throw error;
        }
    }
}
module.exports = BankAccountModel;