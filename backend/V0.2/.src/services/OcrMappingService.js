const { Logger } = require('../utilities/Utils');
const logger = Logger('OcrMappingService');
const FinancialInstitutionModel = require('../models/FinancialInstitutionModel');
const LLMService = require('./LLMService');


class OcrMappingService {

    /**
     * Constructs an instance of OcrMappingService.
     * Initializes the FinancialInstitutionModel and binds service methods.
     * Sets up the OpenAI client property.
     */
    constructor() {
        logger.info('Initializing OcrMappingService');
        this.FiModel = new FinancialInstitutionModel();

        this.mapToEasySlip = this.mapToEasySlip.bind(this);
        this._extractFieldsWithRegex = this._extractFieldsWithRegex.bind(this);
        this._parseDate = this._parseDate.bind(this);
        this.openaiClient = null;
    }

    /**
     * Initializes the OcrMappingService.
     * Currently, it only logs a message to indicate that the service is initialized.
     * @throws {Error} If initialization fails.
     */
    async init() {
        try {
            logger.info('OcrMappingService initialized');
        } catch (error) {
            logger.error(`Error initializing OcrMappingService: ${error.message}`);
            throw error;
        }
    }

    /**
     * Maps OCR text to EasySlip response format using LLM
     * @param {string} ocrText - OCR text from bank slip
     * @param {string} imageBuffer - Path to the image of the bank slip
     * @returns {Promise<Object>} Response in EasySlip format
     */
    async mapToEasySlip(ocrText, payload, imageBuffer) {
        try {
            logger.info('Mapping OCR text and image to EasySlip format');

            // Extract structured data using LLM with both text and image
            const extractedData = await LLMService.mapOcrToEasySlip(ocrText, imageBuffer);
            if (!extractedData) {
                logger.error('cannot mapping ocr text to EasySlip format');
                throw new Error('cannot mapping ocr text to EasySlip format');
            }
            logger.debug(`extractedData: ${JSON.stringify(extractedData, null, 2)}`);

            // Get bank IDs
            logger.info('Getting bank IDs');
            const senderBankCode = await this.FiModel.getFiCodeByName(extractedData.sender.bank.name);
            const receiverBankCode = await this.FiModel.getFiCodeByName(extractedData.receiver.bank.name);
            logger.debug(`senderBankCode: ${senderBankCode}, receiverBankCode: ${receiverBankCode}`);

            // Build response
            const response = {
                status: 200,
                data: {
                    payload: payload,
                    transRef: extractedData.transRef || '',
                    date: extractedData.date || new Date().toISOString(),
                    countryCode: 'TH',
                    amount: {
                        amount: extractedData.amount.amount || 0,
                        local: {
                            amount: extractedData.amount.local.amount || 0,
                            currency: extractedData.amount.local.currency || 'THB'
                        }
                    },
                    fee: extractedData.fee || 0,
                    ref1: extractedData.ref1 || '',
                    ref2: extractedData.ref2 || '',
                    ref3: extractedData.ref3 || '',
                    sender: {
                        bank: {
                            id: senderBankCode || '001',
                            name: extractedData.sender.bank.name || 'Unknown Bank',
                            short: extractedData.sender.bank.short || 'UNK'
                        },
                        account: {
                            name: {
                                th: extractedData.sender.account.name.th || 'ไม่สามารถระยุได้',
                                en: extractedData.sender.account.name.en || 'Unknown Sender'
                            },
                            bank: {
                                type: 'BANKAC',
                                account: extractedData.sender.account.bank.account || ''
                            },
                        }
                    },
                    receiver: {
                        bank: {
                            id: receiverBankCode || '001',
                            name: extractedData.receiver.bank.name || 'Unknown Bank',
                            short: extractedData.receiver.bank.short || 'UNK'
                        },
                        account: {
                            name: {
                                th: extractedData.receiver.account.name.th || 'ไม่สามารถระยุได้',
                                en: extractedData.receiver.account.name.en || 'Unknown Receiver'
                            },
                            bank: {
                                type: 'BANKAC',
                                account: extractedData.receiver.account.bank.account || ''
                            }
                        }
                    }
                }
            };
            return response.data;
        } catch (error) {
            logger.error(`Error mapping OCR to EasySlip format: ${error.message}`);
            throw error;
        }
    }

    /**
     * Fallback method for field extraction using regex
     * @private
     * @param {string} ocrText - Raw OCR text
     * @returns {Object} Extracted fields
     */
    _extractFieldsWithRegex(ocrText) {
        logger.info('Using regex for OCR text extraction');
        const lines = ocrText.split('\n');

        // Extract date (Thai or English format)
        const dateMatch = lines.find(line => line.match(/\d{1,2} [ก-๙]{3} \d{2}/) || line.match(/\d{4}-\d{2}-\d{2}/));

        // Extract names (Thai or English)
        const nameMatches = lines.filter(line =>
            line.match(/นาย|นาง|น\.ส\.|Mr\.|Mrs\.|Ms\./) ||
            line.match(/[ก-๙]{2,}/) // Thai name pattern
        );

        // Extract amounts
        const amountMatch = lines.find(line => line.match(/\d+\.\d+ บาท|\d+\.\d+ THB/));

        return {
            date: dateMatch ? this._parseDate(dateMatch) : new Date().toISOString(),
            senderName: nameMatches[0] || 'Unknown Sender',
            receiverName: nameMatches[1] || 'Unknown Receiver',
            amount: amountMatch ? parseFloat(amountMatch.match(/\d+\.\d+/)[0]) : 0,
            senderBank: 'ค่าเริ่มต้น',//'กสิกรไทย',  Default to KBANK
            receiverBank: 'ค่าเริ่มต้น',//'กสิกรไทย',  Default to KBANK
            senderBankShort: 'Default',//'KBANK',
            receiverBankShort: 'Default'// 'KBANK'
        };
    }

    /**
     * Parses date from Thai or ISO format
     * @private
     * @param {string} dateStr - Date string
     * @returns {string} ISO format date string
     */
    _parseDate(dateStr) {
        if (dateStr.match(/\d{4}-\d{2}-\d{2}/)) {
            return `${dateStr}T00:00:00+07:00`;
        }

        const thaiMonths = {
            'ม.ค.': '01', 'ก.พ.': '02', 'มี.ค.': '03',
            'เม.ย.': '04', 'พ.ค.': '05', 'มิ.ย.': '06',
            'ก.ค.': '07', 'ส.ค.': '08', 'ก.ย.': '09',
            'ต.ค.': '10', 'พ.ย.': '11', 'ธ.ค.': '12'
        };

        const [day, month, year, time] = dateStr.split(' ');
        const isoDate = `20${year}-${thaiMonths[month]}-${day.padStart(2, '0')}T${time || '00:00'}:00+07:00`;
        return isoDate;
    }
}

module.exports = new OcrMappingService();
