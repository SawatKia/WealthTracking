const Utils = require('../utilities/Utils');
const FinancialInstitutionModel = require('../models/FinancialInstitutionModel');
const BaseController = require('./BaseController');
const MyAppErrors = require('../utilities/MyAppErrors')

const { Logger, formatResponse } = Utils;
const logger = Logger('FinancialInstitutionController');

class FinancialInstitutionController extends BaseController {
    constructor() {
        super();
        this.model = new FinancialInstitutionModel();

        // Bind all methods to ensure correct 'this' context
        this.getAllFinancialInstitutions = this.getAllFinancialInstitutions.bind(this);
        this.getFinancialInstitutionByCode = this.getFinancialInstitutionByCode.bind(this);
    }

    async getAllFinancialInstitutions(req, res, next) {
        try {
            const institutions = await this.model.findAll();
            req.formattedResponse = Utils.formatResponse(200, 'Financial institutions fetched successfully', institutions);
            next();
        } catch (error) {
            logger.error(`Failed to fetch financial institutions: ${error.message}`);
            next(error);
        }
    }

    async getFinancialInstitutionByCode(req, res, next) {
        try {
            const { fi_code } = req.params;
            const institution = await this.model.findOne({ fi_code });
            if (institution) {
                req.formattedResponse = Utils.formatResponse(200, 'Financial institution fetched successfully', institution);
            } else {
                throw MyAppErrors.notFound('Financial institution not found');
            }
            next();
        } catch (error) {
            logger.error(`Failed to fetch financial institution: ${error.message}`);
            next(error)
        }
    }
}

module.exports = FinancialInstitutionController;