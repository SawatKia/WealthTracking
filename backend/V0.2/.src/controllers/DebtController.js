const BaseController = require("./BaseController");
const DebtModel = require("../models/DebtModel");
const MyAppErrors = require("../utilities/MyAppErrors");
const { ValidationError } = require("../utilities/ValidationErrors");
const { Logger, formatResponse } = require("../utilities/Utils");

const logger = Logger("DebtController");

class DebtController extends BaseController {
    constructor() {
        super();
        this.DebtModel = new DebtModel();
    }
}

module.exports = DebtController;