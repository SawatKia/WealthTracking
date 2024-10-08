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
        this.getOperatingThaiCommercialBanks = this.getOperatingThaiCommercialBanks.bind(this);
    }

    async getAllFinancialInstitutions(req, res, next) {
        logger.info(`getAllFinancialInstitutions`);
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
        logger.info(`getFinancialInstitutionByCode: ${req.params}`);
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

    async getOperatingThaiCommercialBanks(req, res, next) {
        logger.info(`getOperatingThaiCommercialBanks`);
        try {
            const operatingThaiCommercialBankCodes = [
                '002', '004', '006', '009', '011', '014', '017', '018', '020', '022',
                '024', '025', '030', '031', '033', '034', '039', '045', '052', '066',
                '067', '069', '070', '071', '073', '098'
            ];
            const institutions = await Promise.all(operatingThaiCommercialBankCodes.map(code =>
                this.model.findOne({ fi_code: code })
            ));
            logger.debug('Operating commercial banks:', JSON.stringify(institutions, null, 2));

            if (institutions.length > 0) {
                req.formattedResponse = Utils.formatResponse(200, 'Operating Thai commercial banks fetched successfully', institutions);
            } else {
                throw MyAppErrors.notFound('No operating Thai commercial banks found');
            }
            next();
        } catch (error) {
            logger.error(`Failed to fetch operating Thai commercial banks: ${error.message}`);
            next(error);
        }
    }
}

module.exports = FinancialInstitutionController;