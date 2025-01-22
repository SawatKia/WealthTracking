const fs = require('fs');
const path = require('path');
const { Logger } = require('../utilities/Utils');

const logger = Logger('token-helper');
const tokenPath = path.join(__dirname, 'test-token.json');

function getTestAccessToken() {
    logger.info('============ getTestAccessToken Loading ===========');
    try {
        if (fs.existsSync(tokenPath)) {
            const tokenData = JSON.parse(fs.readFileSync(tokenPath));
            logger.debug(`Token data: ${JSON.stringify(tokenData, null, 2)}`);
            return tokenData.access_token;
        }
        logger.warn('Token file not found, returning null');
        return null;
    } catch (error) {
        logger.error(`Error reading token file: ${error.message}`);
        return null;
    }
}

module.exports = {
    getTestAccessToken
};
