const Joi = require('joi');
const Utils = require('./Utils');

const { Logger } = Utils;
const logger = Logger('BankAccountUtils');

// Bank-specific formats and metadata
const BANK_FORMATS = {
    KASIKORN: {
        code: '004',
        format: /^\d{3}-\d-\d{5}-\d$/,
        example: '123-4-56789-0',
        displayName: 'Kasikorn Bank'
    },
    KRUNGSRI: {
        code: '025',
        format: /^\d{3}-\d-\d{5}-\d$/,
        example: '123-4-56789-0',
        displayName: 'Bank of Ayudhya (Krungsri)'
    },
    KRUNGTHAI: {
        code: '006',
        format: /^\d{3}-\d-\d{5}-\d$/,
        example: '123-4-56789-0',
        displayName: 'Krungthai Bank'
    },
    LH: {
        code: '007',
        format: /^\d{3}-\d-\d{5}-\d$/,
        example: '123-4-56789-0',
        displayName: 'Land and Houses Bank'
    },
    TTB: {
        code: '065',
        format: /^\d{3}-\d-\d{5}-\d$/,
        example: '123-4-56789-0',
        displayName: 'TMBThanachart Bank'
    },
    SCB: {
        code: '014',
        format: /^\d{3}-\d{6}-\d$/,
        example: '123-456789-0',
        displayName: 'Siam Commercial Bank'
    },
    KKP: {
        code: '011',
        format: /^\d{3}-\d{6}-\d$/,
        example: '123-456789-0',
        displayName: 'Kiatnakin Bank'
    },
    GSB: {
        code: '030',
        format: /^\d-\d{5}-\d{3}-\d{3}$/,
        example: '1-23456-789-012',
        displayName: 'Government Savings Bank'
    },
    BANGKOK: {
        code: '002',
        format: /^\d{3}-\d-\d{6}$/,
        example: '123-4-567890',
        displayName: 'Bangkok Bank'
    }
};

// Utility class for bank account validation and formatting
class BankAccountUtils {
    constructor() {
        this.bankFormats = BANK_FORMATS;
    }

    /**
     * Validates a bank account number based on the bank's code
     * @param {string} accountNumber - Raw input bank account number
     * @param {string} bankCode - Bank's code
     * @returns {Object} - Validation result
     */
    validateAccountNumber(accountNumber, bankCode) {
        logger.info(`Validating account number: ${accountNumber} for bank code: ${bankCode}`);

        const cleanedNumber = this.normalizeAccountNumber(accountNumber);
        const bank = this._getBankFormat(bankCode);

        if (!bank) {
            logger.error(`Unknown bank code: ${bankCode}`);
            return this._validationResult(false, `Unknown bank code: ${bankCode}`);
        }

        const formattedNumber = this.formatAccountNumber(cleanedNumber, bank.format);

        if (!formattedNumber) {
            logger.error(`Invalid account number for ${bank.displayName}`);
            return this._validationResult(false, `Invalid format for ${bank.displayName}. Expected format: ${bank.example}`);
        }

        return this._validationResult(true, null, formattedNumber);
    }

    /**
     * Formats a string of digits according to the bank's format
     * @param {string} digits - String of digits
     * @param {RegExp} format - Regular expression for the bank's format
     * @returns {string|null} - Formatted account number or null if invalid
     */
    formatAccountNumber(digits, format) {
        const matchedFormat = digits.match(format);
        return matchedFormat ? matchedFormat[0] : null;
    }

    /**
     * Normalizes the account number by removing non-digit characters
     * @param {string} accountNumber - Raw input account number
     * @returns {string} - Cleaned account number with only digits
     */
    normalizeAccountNumber(accountNumber) {
        return accountNumber.replace(/\D/g, '');
    }

    /**
     * Retrieves bank format metadata by bank code
     * @param {string} bankCode - Bank's code
     * @returns {Object|null} - Bank format or null if not found
     */
    _getBankFormat(bankCode) {
        return Object.values(this.bankFormats).find(bank => bank.code === bankCode);
    }

    /**
     * Standard validation result object
     * @param {boolean} isValid - Validation status
     * @param {string|null} error - Error message if any
     * @param {string|null} formattedNumber - Formatted account number if valid
     * @returns {Object} - Validation result object
     */
    _validationResult(isValid, error = null, formattedNumber = null) {
        return { isValid, error, formattedNumber };
    }

    /**
     * Creates Joi validation schema for a bank account number based on the bank's code
     * @param {string} bankCode - Bank's code
     * @returns {Object} - Joi validation schema
     */
    getValidationSchema(bankCode) {
        const bank = this._getBankFormat(bankCode);

        if (!bank) {
            logger.error(`Bank code ${bankCode} not found for Joi schema`);
            return Joi.string().custom(() => { throw new Error('Invalid bank code'); });
        }

        return Joi.string().pattern(bank.format).messages({
            'string.pattern.base': `Account number format should match ${bank.displayName}: ${bank.example}`
        });
    }
}

module.exports = {
    BankAccountUtils,
    BANK_FORMATS
};
