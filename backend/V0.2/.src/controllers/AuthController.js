const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const UsedRefreshTokenModel = require('../models/UsedRefreshTokenModel');
const UserModel = require('../models/UserModel');
const appConfigs = require('../configs/AppConfigs');
const Utils = require('../utilities/Utils');
const MyAppErrors = require('../utilities/MyAppErrors');

const { Logger, formatResponse } = Utils;
const logger = Logger('AuthController');

class AuthController {
    constructor() {
        this.userModel = new UserModel();
        this.usedRefreshTokenModel = new UsedRefreshTokenModel();
        this.algorithm = 'HS256';
        this.domain = appConfigs.app_domain;
        logger.info(`AuthController initialized with domain: ${this.domain}`);

        this.cookieOptions = {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            path: '/'
        };

        this.accessTokenCookieOptions = {
            ...this.cookieOptions,
            maxAge: 15 * 60 * 1000
        };

        this.refreshTokenCookieOptions = {
            ...this.cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000
        };

        this.authenticationError = {
            statusCode: 401,
            message: "Could not validate credentials",
            headers: {
                "WWW-Authenticate": 'Bearer'
            }
        };

        this.decodeToken = this.decodeToken.bind(this);
        this.login = this.login.bind(this);
        this.refresh = this.refresh.bind(this);
        this.logout = this.logout.bind(this);
    }

    /**
     * decodes the token without validation
     * 
     * @param {string} token - The token to be decoded.
     * @returns {object} The decoded token.
     */
    decodeToken(token) {
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
    verifyToken(token, secret) {
        logger.debug('Verifying token');
        try {
            return jwt.verify(token, secret, {
                algorithms: [this.algorithm],
                clockTolerance: 30,
                issuer: this.domain
            });
        } catch (error) {
            logger.error(`Error verifying token: ${error.message}`);
            throw error;
        }
    }

    createTokens(userId) {
        logger.debug(`Creating new token pair for user: ${userId}`);
        const now = Math.floor(Date.now() / 1000);
        const jti = uuidv4();

        const accessToken = jwt.sign({
            sub: userId,
            iat: now,
            nbf: now,
            exp: now + (15 * 60),
            iss: this.domain,
        }, appConfigs.accessTokenSecret, { algorithm: this.algorithm });
        logger.debug('Access token created');

        const refreshToken = jwt.sign({
            sub: userId,
            iat: now,
            nbf: appConfigs.environment != 'production' ? now : now + (10 * 60),
            exp: now + (7 * 24 * 60 * 60),
            jti: jti,
            iss: this.domain,
        }, appConfigs.refreshTokenSecret, { algorithm: this.algorithm });
        logger.debug('Refresh token created');

        return { accessToken, refreshToken };
    }

    async login(req, res, next) {
        logger.info('Logging in');
        const { email, password } = req.body;
        try {
            const { result, user } = await this.userModel.checkPassword(email, password);
            if (!result) {
                logger.error('Invalid credentials');
                throw MyAppErrors.unauthorized(this.authenticationError.message, null, this.authenticationError.headers);
            }

            logger.debug(`User ${user.national_id} authenticated successfully`);
            const { accessToken, refreshToken } = this.createTokens(user.national_id);

            logger.debug('Setting authentication cookies');
            res.cookie('access_token', accessToken, this.accessTokenCookieOptions);
            res.cookie('refresh_token', refreshToken, this.refreshTokenCookieOptions);

            logger.info(`User ${user.national_id} logged in successfully`);
            req.formattedResponse = formatResponse(200, 'Logged in successfully', user, this.authenticationError.headers);
            next();
        } catch (error) {
            logger.error(`Login error: ${error.message}`, { stack: error.stack });
            if (error instanceof MyAppErrors) {
                next(error);
            } else {
                next(MyAppErrors.internalServerError(error.message, null, this.authenticationError.headers));
            }
        }
    }

    async refresh(req, res, next) {
        logger.info('Token refresh requested');
        const refreshToken = req.cookies['refresh_token'];

        try {
            if (!refreshToken) {
                logger.warn('Refresh token missing from request');
                throw MyAppErrors.unauthorized(this.authenticationError.message, null, this.authenticationError.headers);
            }

            logger.debug('Verifying refresh token');
            let decoded = this.decodeToken(refreshToken);
            logger.debug(`Decoded token JTI: ${decoded.jti}`);

            const now = Math.floor(Date.now() / 1000);
            if (decoded.nbf > now) {
                const timeUntilValid = decoded.nbf - now;
                logger.warn(`Token not yet valid. NBF: ${decoded.nbf}, Current: ${now}. Will be valid in ${timeUntilValid} seconds`);
                throw MyAppErrors.unauthorized(this.authenticationError.message, null, this.authenticationError.headers);
            }
            decoded = this.verifyToken(refreshToken, appConfigs.refreshTokenSecret);

            // Check if token is used
            const isUsed = await this.usedRefreshTokenModel.has(decoded.jti);
            logger.debug(`Token used status: ${isUsed}`);

            if (isUsed) {
                logger.error(`Refresh token reuse detected for user: ${decoded.sub}, token: ${decoded.jti}`);
                res.clearCookie('access_token', this.cookieOptions);
                res.clearCookie('refresh_token', this.cookieOptions);
                throw MyAppErrors.unauthorized(this.authenticationError.message, null, this.authenticationError.headers);
            }

            logger.debug(`Adding refresh token ${decoded.jti} as used tokens`);
            await this.usedRefreshTokenModel.add(decoded.jti, new Date(decoded.exp * 1000));

            logger.debug(`Creating new token pair for user: ${decoded.sub}`);
            const { accessToken, refreshToken: newRefreshToken } = this.createTokens(decoded.sub);

            logger.debug('Setting new authentication cookies');
            res.cookie('access_token', accessToken, this.accessTokenCookieOptions);
            res.cookie('refresh_token', newRefreshToken, this.refreshTokenCookieOptions);

            logger.info(`Tokens refreshed successfully for user: ${decoded.sub}`);
            req.formattedResponse = formatResponse(200, 'Tokens refreshed successfully', null, this.authenticationError.headers);
            next();
        } catch (error) {
            if (!(error instanceof MyAppErrors)) {
                const errorTypes = [jwt.TokenExpiredError, jwt.JsonWebTokenError, jwt.NotBeforeError];
                const errorMessages = {
                    [jwt.TokenExpiredError.name]: 'Token is expired',
                    [jwt.JsonWebTokenError.name]: 'Invalid token',
                    [jwt.NotBeforeError.name]: 'Token is not yet valid',
                };

                if (errorTypes.includes(error.constructor)) {
                    logger.error(`Invalid token refresh: ${errorMessages[error.constructor.name]}, ${error.message}`, { stack: error.stack });
                    error = MyAppErrors.unauthorized(this.authenticationError.message, null, this.authenticationError.headers);
                } else {
                    logger.error(`Token refresh error: ${error.message}`, { stack: error.stack });
                    error = MyAppErrors.internalServerError(error.message, null, this.authenticationError.headers);
                }
            }
            next(error);
        }
    }

    async logout(req, res, next) {
        logger.info('Logout requested');
        const refreshToken = req.cookies['refresh_token'];

        try {
            if (refreshToken) {
                const decoded = this.decodeToken(refreshToken);
                if (decoded?.jti) {
                    logger.debug(`Adding refresh token ${decoded.jti} to used tokens`);
                    await this.usedRefreshTokenModel.add(decoded.jti, new Date(decoded.exp * 1000));
                }
            }

            logger.debug('Clearing authentication cookies');
            res.clearCookie('access_token', this.cookieOptions);
            res.clearCookie('refresh_token', this.cookieOptions);

            logger.info('User logged out successfully');
            req.formattedResponse = formatResponse(200, 'Logged out successfully', null, this.authenticationError.headers);
            next();
        } catch (error) {
            logger.error('Error during logout:', error);
            if (error instanceof MyAppErrors) {
                next(error);
            } else {
                next(MyAppErrors.internalServerError(error.message, null, this.authenticationError.headers));
            }
        }
    }
}

module.exports = AuthController;
