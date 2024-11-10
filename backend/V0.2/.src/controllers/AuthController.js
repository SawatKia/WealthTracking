const jwt = require('jsonwebtoken');
const { v4: uuidv4, validate: uuidValidate, version: uuidVersion } = require('uuid');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

const UsedRefreshTokenModel = require('../models/UsedRefreshTokenModel');
const BaseController = require('./BaseController');
const UserModel = require('../models/UserModel');
const appConfigs = require('../configs/AppConfigs');
const Utils = require('../utilities/Utils');
const MyAppErrors = require('../utilities/MyAppErrors');

const { Logger, formatResponse } = Utils;
const logger = Logger('AuthController');

class AuthController extends BaseController {
    constructor() {
        super();
        this.userModel = new UserModel();
        this.usedRefreshTokenModel = new UsedRefreshTokenModel();
        this.algorithm = 'HS256';
        this.domain = appConfigs.app_domain;
        logger.info(`AuthController initialized with domain: ${this.domain} which use for JWT issuer`);

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

        this._decodeToken = this._decodeToken.bind(this);
        this.login = this.login.bind(this);
        this.refresh = this.refresh.bind(this);
        this.logout = this.logout.bind(this);
        this.googleLogin = this.googleLogin.bind(this);
        this.googleCallback = this.googleCallback.bind(this);
        this._getGoogleUser = this._getGoogleUser.bind(this);

        this.pendingStates = new Map();
        this.stateTokenExpiry = 5 * 60 * 1000; // 5 minutes in milliseconds
    }

    /**
     * decodes the token without validation
     * 
     * @param {string} token - The token to be decoded.
     * @returns {object} The decoded token.
     */
    _decodeToken(token) {
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
    _verifyToken(token, secret) {
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

    /**
     * Creates a new token pair for a user.
     * 
     * @param {string} userId - The ID of the user to create tokens for.
     * @returns {object} An object containing the access token and refresh token.
     */
    _createTokens(userId) {
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
        super.verifyField(req.body, ['email', 'password']);
        try {
            const { result, user } = await this.userModel.checkPassword(email, password);
            if (!result) {
                logger.error('Invalid credentials');
                throw MyAppErrors.unauthorized(this.authenticationError.message, null, this.authenticationError.headers);
            }

            logger.debug(`User ${user.national_id} authenticated successfully`);
            const { accessToken, refreshToken } = this._createTokens(user.national_id);

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
            let decoded = this._decodeToken(refreshToken);
            logger.debug(`Decoded token JTI: ${decoded.jti}`);

            const now = Math.floor(Date.now() / 1000);
            if (decoded.nbf > now) {
                const timeUntilValid = decoded.nbf - now;
                logger.warn(`Token not yet valid. NBF: ${decoded.nbf}, Current: ${now}. Will be valid in ${timeUntilValid} seconds`);
                throw MyAppErrors.unauthorized(this.authenticationError.message, null, this.authenticationError.headers);
            }
            decoded = this._verifyToken(refreshToken, appConfigs.refreshTokenSecret);

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
            const { accessToken, refreshToken: newRefreshToken } = this._createTokens(decoded.sub);

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
                const decoded = this._decodeToken(refreshToken);
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

    async _getGoogleUser(access_token) {
        try {
            logger.info('Getting Google user');
            const response = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`);
            return response.data;
        } catch (error) {
            logger.error(`Error getting Google user: ${error.message}`);
            throw error;
        }
    }

    /**
     * Creates a state token with uuidv4, expires after 5 minutes, and associates it with the given action.
     * 
     * @param {string} action - The action to be associated with the state token.
     * @returns {string} The created state token.
     */
    _createStateToken(action) {
        logger.info('Creating state token');
        const stateToken = uuidv4();
        const expiryTime = Date.now() + this.stateTokenExpiry;

        this.pendingStates.set(stateToken, {
            action,
            expiryTime
        });
        logger.debug(`this.pendingStates length: ${this.pendingStates.size}`);
        logger.debug(`this.pendingStates: ${JSON.stringify(Array.from(this.pendingStates.entries()))}`);

        // Cleanup expired tokens
        this._cleanupExpiredStates();

        return stateToken;
    }

    _uuidValidateV4(uuid) {
        logger.info('Validating UUID v4');
        logger.debug(`Validating UUID: ${uuid}`);
        return uuidValidate(uuid) && uuidVersion(uuid) === 4;
    }

    /**
     * Verifies a state token and returns the associated action if valid.
     * 
     * @param {string} stateToken - The state token to be verified.
     * @returns {string|null} The associated action if the token is valid, otherwise null.
     */
    _verifyStateToken(stateToken) {
        logger.info('Verifying state token');
        logger.debug(`Verifying state token: ${stateToken}`);
        const stateData = this.pendingStates.get(stateToken);
        logger.debug(`Extracted state data: ${JSON.stringify(stateData, null, 2)}`);

        if (!stateData) {
            logger.warn('State token not found');
            return null;
        }

        if (!this._uuidValidateV4(stateToken)) {
            logger.warn('Invalid state token');
            return null;
        }
        logger.info(`State token ${stateToken} is valid`);

        if (Date.now() > stateData.expiryTime) {
            logger.warn('State token expired');
            this.pendingStates.delete(stateToken);
            return null;
        }
        logger.info(`State token ${stateToken} is not expired`);

        // Remove the used token
        this.pendingStates.delete(stateToken);
        logger.info(`State token ${stateToken} removed`);
        return stateData.action;
    }

    _cleanupExpiredStates() {
        logger.info('Cleaning up expired state tokens');
        const now = Date.now();
        for (const [token, data] of this.pendingStates.entries()) {
            if (now > data.expiryTime) {
                logger.debug(`Deleting expired state token: ${token}`);
                this.pendingStates.delete(token);
            }
        }
    }

    async googleLogin(req, res, next) {
        try {
            logger.info('Google login requested');
            const action = req.query.action;
            if (!action) {
                logger.warn('Missing action parameter');
                throw MyAppErrors.badRequest('Missing action parameter');
            }

            const stateToken = this._createStateToken(action);
            logger.debug(`State token created for action: ${action}, State token: ${stateToken}`);

            const oAuth2Client = new OAuth2Client(
                appConfigs.google.clientId,
                appConfigs.google.clientSecret,
                appConfigs.google.redirectUri
            );

            const url = oAuth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid',
                state: stateToken
            });

            logger.debug(`Google auth URL generated with state token: ${stateToken}`);
            res.setHeader("Referrer-Policy", "no-referrer-when-downgrade");
            if (appConfigs.environment != 'production') {
                req.formattedResponse = formatResponse(200, `redirect to this URL to login with Google. in production, will redirect to the url automatically`, url);
            } else {
                res.redirect(url);
            }
            next();
        } catch (error) {
            logger.error(`Error during Google login: ${error.message}`);
            if (error instanceof MyAppErrors) {
                next(error);
            } else {
                logger.error(`Error during Google login: ${error.message}`);
                next(MyAppErrors.internalServerError(error.message));
            }
        }
    }

    async googleCallback(req, res, next) {
        try {
            logger.info('Google callback requested');
            const { code, state: stateToken } = req.query;

            if (!code || !stateToken) {
                logger.warn('Missing code or state parameter');
                throw MyAppErrors.badRequest('Invalid callback parameters');
            }

            // Verify state token and get action
            const action = this._verifyStateToken(stateToken);
            if (!action) {
                logger.warn('Invalid or expired state token');
                throw MyAppErrors.unauthorized('Invalid or expired authentication request');
            }

            const oAuth2Client = new OAuth2Client(
                appConfigs.google.clientId,
                appConfigs.google.clientSecret,
                appConfigs.google.redirectUri
            );

            const { tokens } = await oAuth2Client.getToken(code);
            await oAuth2Client.setCredentials(tokens);

            const googleUser = await this._getGoogleUser(tokens.access_token);
            logger.debug('Google User data:', JSON.stringify(googleUser, null, 2));

            // Check if user exists in our database
            const existingUser = await this.userModel.findOne({ email: googleUser.email }) || await this.userModel.findOne({ national_id: googleUser.sub });

            if (action === 'register') {
                logger.info(`Registering user with email: ${googleUser.email}`);
                if (existingUser) {
                    logger.warn(`User with email ${googleUser.email} already exists`);
                    throw MyAppErrors.badRequest('User already exists. Please login instead.');
                }

                const userData = {
                    national_id: googleUser.sub,
                    email: googleUser.email,
                    username: googleUser.name,
                    profile_picture_uri: googleUser.picture
                };

                const createdUser = await this.userModel.createGoogleUser(userData);
                if (!createdUser) {
                    throw MyAppErrors.internalServerError('Failed to create user');
                }

                const { accessToken, refreshToken } = this._createTokens(createdUser.national_id);

                res.cookie('access_token', accessToken, this.accessTokenCookieOptions);
                res.cookie('refresh_token', refreshToken, this.refreshTokenCookieOptions);
                if (appConfigs.environment != 'production') {
                    req.formattedResponse = formatResponse(201, 'User registered successfully with Google. in production, will redirect to "/home"', createdUser);
                } else {
                    res.redirect('/home');
                }
            } else if (action === 'login') {
                logger.info(`Logging in user with email: ${googleUser.email}`);
                if (!existingUser) {
                    logger.warn(`No user found with email ${googleUser.email} or national_id ${googleUser.sub}`);
                    throw MyAppErrors.unauthorized(this.authenticationError.message, null, this.authenticationError.headers);
                }
                logger.debug(`User ${existingUser.national_id} found`);

                const { accessToken, refreshToken } = this._createTokens(existingUser.national_id);

                res.cookie('access_token', accessToken, this.accessTokenCookieOptions);
                res.cookie('refresh_token', refreshToken, this.refreshTokenCookieOptions);

                if (appConfigs.environment != 'production') {
                    req.formattedResponse = formatResponse(200, 'Logged in successfully with Google. in production, will redirect to "/home"');
                } else {
                    res.redirect('/home');
                }
            }

            next();
        } catch (error) {
            logger.error(`Error during Google callback: ${error.message}`);
            if (error instanceof MyAppErrors) {
                next(error);
            } else {
                logger.error(`Error during Google login: ${error.message}`);
                next(MyAppErrors.internalServerError(error.message));
            }
        }
    }
}

module.exports = AuthController;
