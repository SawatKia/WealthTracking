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
     * @returns {Object} - Validation result with isValid, error, and formattedNumber
     */
    async validateAccountNumber(accountNumber, bankCode) {
        try {
            logger.info(`Validating account number: ${accountNumber} for bank code: ${bankCode}`);

            const cleanedNumber = await this.normalizeAccountNumber(accountNumber);
            const formattedNumber = await this.formatAccountNumber(cleanedNumber, bankCode);

            if (!formattedNumber) {
                const bank = await this._getBankFormat(bankCode);
                logger.warn(`Invalid account number for ${bank.displayName} expected format: ${bank.example} received: ${accountNumber}, returning original number`);
                return {
                    isValid: false,
                    error: `Invalid account number format. Expected format: ${bank.example}`,
                    formattedNumber: null
                };
            }

            return {
                isValid: true,
                error: null,
                formattedNumber
            };
        } catch (error) {
            logger.error(`Error validating account number: ${error.message}`);
            return {
                isValid: false,
                error: error.message,
                formattedNumber: null
            };
        }
    }

    /**
     * Normalizes the account number by removing dashes if the input contains only digits and dashes.
     * Throws an error for inputs containing other characters.
     * @param {string} accountNumber - Raw input account number
     * @returns {string} - Cleaned account number with only digits
     * @throws {Error} If the input contains characters other than digits or dashes
     */
    async normalizeAccountNumber(accountNumber) {
        try {
            logger.info(`Normalizing account number: ${accountNumber}`);
            if (/^[\d-]+$/.test(accountNumber)) {
                const normalizedNumber = accountNumber.replace(/-/g, '');
                logger.debug(`Normalized account number: ${normalizedNumber}`);
                return normalizedNumber;
            } else {
                logger.error(`Invalid account number format: ${accountNumber}, account number should contain only digits or digits with dashes`);
                throw new Error('Invalid account number, It should contain only digits or digits with dashes');
            }
        } catch (error) {
            logger.error(`Error in normalizeAccountNumber: ${error.message}`);
            throw new Error(`Normalization error: ${error.message}`);
        }
    }

    /**
     * Retrieves bank format metadata by bank code
     * @param {string} bankCode - Bank's code
     * @returns {Object|null} - Bank format or null if not found
     */
    async _getBankFormat(bankCode) {
        try {
            return this.bankFormats[Object.keys(this.bankFormats).find(bank =>
                this.bankFormats[bank].code === bankCode
            )] || null;
        } catch (error) {
            logger.error(`Error getting bank format: ${error.message}`);
            throw new Error(`Bank format retrieval error: ${error.message}`);
        }
    }

    /**
     * Standard validation result object
     * @param {boolean} isValid - Validation status
     * @param {string|null} error - Error message if any
     * @param {string|null} formattedNumber - Formatted account number if valid
     * @returns {Object} - Validation result object with isValid, error, and formattedNumber
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
        try {
            const bank = this._getBankFormat(bankCode);

            if (!bank) {
                logger.error(`Bank code ${bankCode} not found for Joi schema`);
                return Joi.string().custom(() => { throw new Error('Invalid bank code'); });
            }

            return Joi.string().pattern(bank.format).messages({
                'string.pattern.base': `Account number format should match ${bank.displayName}: ${bank.example}`
            });
        } catch (error) {
            logger.error(`Error creating validation schema: ${error.message}`);
            throw new Error(`Validation schema error: ${error.message}`);
        }
    }

    /**
     * Formats the account number based on the bank's code
     * @param {string} accountNumber - Raw input account number
     * @param {string} fiCode - Bank's code
     * @returns {string} - Formatted account number
     */
    async formatAccountNumber(accountNumber, fiCode) {
        try {
            const bank = await this._getBankFormat(fiCode);
            logger.debug(`bank: ${JSON.stringify(bank, null, 2)}`);

            if (!bank || !bank.format) {
                logger.warn(`Unknown bank code or format missing: ${fiCode}`);
                return accountNumber;
            }

            const cleanedNumber = await this.normalizeAccountNumber(accountNumber);

            // Get the example format and split it by "-" to determine positions of separators
            const formatExample = bank.example;
            const exampleParts = formatExample.split('-');

            let formattedNumber = '';
            let currentIndex = 0;
            // Check if the cleaned number matches the bank's format
            const expectedLength = bank.example.replace(/-/g, '').length;
            if (cleanedNumber.length !== expectedLength) {
                logger.warn(`Account number ${cleanedNumber} does not have the expected length (${expectedLength} digits) for bank ${fiCode}`);
                return accountNumber; // Return original if length doesn't match
            }

            // Format the cleaned number by matching the example structure
            exampleParts.forEach(part => {
                const partLength = part.length;
                formattedNumber += cleanedNumber.slice(currentIndex, currentIndex + partLength);
                currentIndex += partLength;
                // Add separator after each part except the last one
                if (currentIndex < cleanedNumber.length) {
                    formattedNumber += '-';
                }
            });

            logger.debug(`Formatting result: ${JSON.stringify({
                originalNumber: accountNumber,
                cleanedNumber,
                formattedNumber,
                bankFormat: bank.format
            }, null, 2)}`);

            return formattedNumber;
        } catch (error) {
            logger.error(`Error formatting account number: ${error.message}`);
            return accountNumber;
        }
    }

}

module.exports = {
    BankAccountUtils,
    BANK_FORMATS
};