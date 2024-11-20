const BaseModel = require("./BaseModel");
const { Logger } = require("../utilities/Utils");
const logger = Logger("DebtModel");

class DebtModel extends BaseModel {
    constructor() {
        super('debt');
    }
}

module.exports = DebtModel;