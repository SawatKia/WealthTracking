const jwt = require('jsonwebtoken');
const { v4: uuidv4, validate: uuidValidate, version: uuidVersion } = require('uuid');
const appConfigs = require('../configs/AppConfigs');
const Utils = require('./Utils');

const { Logger } = Utils;
const logger = Logger('AuthUtils');

class AuthUtils {
    static algorithm = 'HS256';
    static domain = appConfigs.app_domain;

    static authenticationError = {
        statusCode: 401,
        message: "Could not validate credentials",
        headers: {
            "authorization": 'Bearer'
        }
    };

    /**
     * decodes the token without validation
     * 
     * @param {string} token - The token to be decoded.
     * @returns {object} The decoded token.
     */
    static decodeToken(token) {
        logger.debug('Decoding token');
        try {
            return jwt.decode(token);
        } catch (error) {
            logger.error(`Error decoding token: ${error.message}`);
            throw error;
        }
    }

    /**
     * Verifies a given token against a secret.
     * 
     * @param {string} token - The token to be verified.
     * @param {string} secret - The secret to verify the token against.
     * @returns {object} The verified token.
     */
    static verifyToken(token, secret) {
        logger.debug('Verifying token');
        try {
            return jwt.verify(token, secret, {
                algorithms: [AuthUtils.algorithm],
                clockTolerance: 30,
                issuer: AuthUtils.domain
            });
        } catch (error) {
            logger.error(`Error verifying token: ${error.message}`);
            throw error;
        }
    }

    /**
     * Creates a new token pair for a user.
     * 
     * @param {string} userId - The ID of the user to create tokens for.
     * @returns {object} An object containing the access token and refresh token.
     */
    static createTokens(userId) {
        logger.debug(`Creating new token pair for user: ${userId}`);
        try {
            const now = Math.floor(Date.now() / 1000);
            const jti = uuidv4();

            const accessToken = jwt.sign({
                sub: userId,
                iat: now,
                nbf: now,
                exp: now + (15 * 60),
                iss: AuthUtils.domain,
            }, appConfigs.accessTokenSecret, { algorithm: AuthUtils.algorithm });
            logger.debug('Access token created');

            const refreshToken = jwt.sign({
                sub: userId,
                iat: now,
                nbf: appConfigs.environment != 'production' ? now : now + (10 * 60),
                exp: now + (7 * 24 * 60 * 60),
                jti: jti,
                iss: AuthUtils.domain,
            }, appConfigs.refreshTokenSecret, { algorithm: AuthUtils.algorithm });
            logger.debug('Refresh token created');

            return { accessToken, refreshToken };
        } catch (error) {
            logger.error(`Error creating token pair: ${error.message}`);
            throw error;
        }
    }

    static uuidValidateV4(uuid) {
        logger.debug(`Validating UUID v4: ${uuid}`);
        return uuidValidate(uuid) && uuidVersion(uuid) === 4;
    }
}

module.exports = AuthUtils;
