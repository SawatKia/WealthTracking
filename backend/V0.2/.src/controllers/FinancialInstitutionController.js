const { Logger, formatResponse } = require('../utilities/Utils');
const FinancialInstitutionModel = require('../models/FinancialInstitutionModel');
const BaseController = require('./BaseController');
const MyAppErrors = require('../utilities/MyAppErrors');
const appConfigs = require('../configs/AppConfigs');

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
            if (appConfigs.environment === 'production') {
                throw MyAppErrors.forbidden('This endpoint is not available in production');
            }

            const institutions = await this.model.list();
            req.formattedResponse = formatResponse(200,
                '[DEV ONLY] Financial institutions fetched successfully', {
                warning: '⚠️ This endpoint is for development purposes only. Do not use in production.',
                data: institutions
            }
            );
            next();
        } catch (error) {
            logger.error(`Failed to fetch financial institutions: ${error.message}`);
            next(error);
        }
    }

    async getFinancialInstitutionByCode(req, res, next) {
        logger.info(`getFinancialInstitutionByCode: ${req.params}`);
        try {
            if (appConfigs.environment === 'production') {
                throw MyAppErrors.forbidden('This endpoint is not available in production');
            }

            const { fi_code } = req.params;
            const institution = await this.model.findOne({ fi_code });
            if (institution) {
                req.formattedResponse = formatResponse(200,
                    '[DEV ONLY] Financial institution fetched successfully', {
                    warning: '⚠️ This endpoint is for development purposes only. Do not use in production.',
                    data: institution
                }
                );
            } else {
                throw MyAppErrors.notFound('Financial institution not found');
            }
            next();
        } catch (error) {
            logger.error(`Failed to fetch financial institution: ${error.message}`);
            next(error);
        }
    }

    async getOperatingThaiCommercialBanks(req, res, next) {
        logger.info(`getOperatingThaiCommercialBanks`);
        try {
            if (appConfigs.environment === 'production') {
                throw MyAppErrors.forbidden('This endpoint is not available in production');
            }

            const operatingThaiCommercialBankCodes = [
                '002', '004', '006', '011', '014', '017', '018', '020', '022',
                '024', '025', '029', '030', '031', '032', '033', '034', '039',
                '045', '052', '066', '067', '069', '070', '071', '073', '098'
            ];
            const institutions = await Promise.all(operatingThaiCommercialBankCodes.map(code =>
                this.model.findOne({ fi_code: code })
            ));

            if (institutions.length > 0) {
                const referenceLink = 'https://apiportal.kasikornbank.com/bucket/SiteCollectionDocuments/assets/page/apiproducts/corporate-fund-transfer/BankCode-CorpAPI.pdf';
                req.formattedResponse = formatResponse(200,
                    '[DEV ONLY] Operating Thai commercial banks fetched successfully', {
                    warning: '⚠️ This endpoint is for development purposes only. Do not use in production.',
                    reference: referenceLink,
                    data: institutions
                }
                );
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