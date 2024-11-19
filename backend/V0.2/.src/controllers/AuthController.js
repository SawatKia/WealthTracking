const jwt = require('jsonwebtoken');
const { v4: uuidv4, validate: uuidValidate, version: uuidVersion } = require('uuid');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

const AuthUtils = require('../utilities/AuthUtils');
const UsedRefreshTokenModel = require('../models/UsedRefreshTokenModel');
const BaseController = require('./BaseController');
const UserModel = require('../models/UserModel');
const appConfigs = require('../configs/AppConfigs');
const Utils = require('../utilities/Utils');
const MyAppErrors = require('../utilities/MyAppErrors');

const { Logger, formatResponse } = Utils;
const { verifyToken, decodeToken, createTokens, uuidValidateV4, authenticationError } = AuthUtils;
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

        this.authenticationError = authenticationError;
        this.authorizationHeader = authenticationError.headers;

        this._getGoogleUser = this._getGoogleUser.bind(this);
        this.login = this.login.bind(this);
        this.refresh = this.refresh.bind(this);
        this.logout = this.logout.bind(this);
        this.googleLogin = this.googleLogin.bind(this);
        this.googleCallback = this.googleCallback.bind(this);

        this.pendingStates = new Map();
        this.stateTokenExpiry = 5 * 60 * 1000; // 5 minutes in milliseconds

        // Add platform check options
        this.platformTypes = {
            WEB: 'web',
            MOBILE: 'mobile'
        };
    }

    async login(req, res, next) {
        logger.info('Logging in');
        const platform = req.query.platform;
        const { email, password } = req.body;
        try {
            await super.verifyField(req.body, ['email', 'password']);
            const { result, user } = await this.userModel.checkPassword(email, password);
            if (!result) {
                logger.error('Invalid credentials');
                throw MyAppErrors.unauthorized(this.authenticationError.message, null, this.authorizationHeader);
            }
            if (!platform) {
                logger.warn('No platform specified, using default web platform');
                throw MyAppErrors.badRequest('No platform specified');
            }

            logger.debug(`User ${user.national_id} authenticated successfully`);
            const { accessToken, refreshToken } = createTokens(user.national_id);

            // Handle response based on platform
            if (platform === this.platformTypes.MOBILE) {
                logger.debug('Mobile platform detected, sending tokens in response body');
                req.formattedResponse = formatResponse(200, 'Logged in successfully, store the token in secure storage, send access_token along with requests in authorization header when need to access protected resources. use refresh_token to get a new access_token when the current one expired.', {
                    user,
                    tokens: {
                        access_token: accessToken,
                        refresh_token: refreshToken
                    }
                }, this.authorizationHeader);
            } else {
                logger.debug('Web platform detected, setting cookies');
                res.cookie('access_token', accessToken, this.accessTokenCookieOptions);
                res.cookie('refresh_token', refreshToken, this.refreshTokenCookieOptions);
                req.formattedResponse = formatResponse(200, 'Logged in successfully', user);
            }

            logger.info(`User ${user.national_id} logged in successfully`);
            next();
        } catch (error) {
            logger.error(`Login error: ${error.message}`, { stack: error.stack });
            if (error instanceof MyAppErrors) {
                next(error);
            } else if (error.message.includes('Missing required field: ')) {
                next(MyAppErrors.badRequest(error.message));
            } else {
                next(MyAppErrors.internalServerError(error.message, null, this.authorizationHeader));
            }
        }
    }

    async refresh(req, res, next) {
        logger.info('Token refresh requested');
        const platform = req.query.platform;
        const refreshToken = platform === this.platformTypes.MOBILE
            ? req.headers['x-refresh-token']
            : req.cookies['refresh_token'];

        try {
            if (!refreshToken) {
                logger.warn('Refresh token missing from request');
                throw MyAppErrors.unauthorized(this.authenticationError.message, null, this.authorizationHeader);
            }

            logger.debug('Verifying refresh token');
            let decoded = decodeToken(refreshToken);
            logger.debug(`Decoded token JTI: ${decoded.jti}`);

            const now = Math.floor(Date.now() / 1000);
            if (decoded.nbf > now) {
                const timeUntilValid = decoded.nbf - now;
                logger.warn(`Token not yet valid. NBF: ${decoded.nbf}, Current: ${now}. Will be valid in ${timeUntilValid} seconds`);
                throw MyAppErrors.unauthorized(this.authenticationError.message, null, this.authorizationHeader);
            }
            decoded = verifyToken(refreshToken, appConfigs.refreshTokenSecret);

            // Check if token is used
            const isUsed = await this.usedRefreshTokenModel.has(decoded.jti);
            logger.debug(`Token used status: ${isUsed}`);

            if (isUsed) {
                logger.error(`Refresh token reuse detected for user: ${decoded.sub}, token: ${decoded.jti}`);
                if (platform === this.platformTypes.WEB) {
                    logger.debug('Web platform detected, clearing cookies');
                    res.clearCookie('access_token', this.cookieOptions);
                    res.clearCookie('refresh_token', this.cookieOptions);
                }
                throw MyAppErrors.unauthorized(this.authenticationError.message, null, this.authorizationHeader);
            }

            logger.debug(`Adding refresh token ${decoded.jti} as used tokens`);
            await this.usedRefreshTokenModel.add(decoded.jti, new Date(decoded.exp * 1000));

            logger.debug(`Creating new token pair for user: ${decoded.sub}`);
            const { accessToken, refreshToken: newRefreshToken } = createTokens(decoded.sub);

            if (platform === this.platformTypes.MOBILE) {
                logger.debug('Mobile platform detected, sending tokens in response body');
                req.formattedResponse = formatResponse(200, 'Tokens refreshed successfully', {
                    tokens: {
                        access_token: accessToken,
                        refresh_token: newRefreshToken
                    }
                }, this.authorizationHeader);
            } else {
                logger.debug('Web platform detected, setting cookies');
                res.cookie('access_token', accessToken, this.accessTokenCookieOptions);
                res.cookie('refresh_token', newRefreshToken, this.refreshTokenCookieOptions);
                req.formattedResponse = formatResponse(200, 'Tokens refreshed successfully');
            }

            logger.info(`Tokens refreshed successfully for user: ${decoded.sub}`);
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
                    error = MyAppErrors.unauthorized(this.authenticationError.message, null, this.authorizationHeader);
                } else {
                    logger.error(`Token refresh error: ${error.message}`, { stack: error.stack });
                    error = MyAppErrors.internalServerError(error.message, null, this.authorizationHeader);
                }
            }
            next(error);
        }
    }

    async logout(req, res, next) {
        logger.info('Logout requested');
        const platform = req.query.platform;
        const refreshToken = platform === this.platformTypes.MOBILE
            ? req.headers.authorization?.split(' ')[1]
            : req.cookies['refresh_token'];

        try {
            if (refreshToken) {
                const decoded = decodeToken(refreshToken);
                if (decoded?.jti) {
                    logger.debug(`Adding refresh token ${decoded.jti} to used tokens`);
                    await this.usedRefreshTokenModel.add(decoded.jti, new Date(decoded.exp * 1000));
                }
            }

            let message = 'Logged out successfully';
            if (platform === this.platformTypes.WEB) {
                logger.debug('Web platform detected, clearing cookies');
                res.clearCookie('access_token', this.cookieOptions);
                res.clearCookie('refresh_token', this.cookieOptions);
            } else {
                logger.debug('Mobile platform detected, sending logout response');
                message = 'on mobile, just remove both refresh and access tokens from your storage';
            }

            logger.info(`User logged out successfully: ${message}`);
            req.formattedResponse = formatResponse(200, message);
            next();
        } catch (error) {
            logger.error('Error during logout:', error);
            if (error instanceof MyAppErrors) {
                next(error);
            } else {
                next(MyAppErrors.internalServerError(error.message, null, this.authorizationHeader));
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
     * @param {string} platform - The platform to be associated with the state token.
     * @returns {string} The created state token.
     */
    _createStateToken(action, platform = this.platformTypes.MOBILE) {
        logger.info('Creating state token');
        const stateToken = uuidv4();
        const expiryTime = Date.now() + this.stateTokenExpiry;

        this.pendingStates.set(stateToken, {
            action,
            expiryTime,
            platform
        });
        logger.debug(`this.pendingStates length: ${this.pendingStates.size}`);
        logger.debug(`this.pendingStates: ${JSON.stringify(Array.from(this.pendingStates.entries()))}`);

        // Cleanup expired tokens
        this._cleanupExpiredStates();

        return stateToken;
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

        if (!uuidValidateV4(stateToken)) {
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
        return { action: stateData.action, platform: stateData.platform };
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
            const { action, platform } = req.query;
            if (!action || !platform) {
                logger.warn('Missing action or platform parameter');
                throw MyAppErrors.badRequest('Missing action or platform parameter');
            }

            const stateToken = this._createStateToken(action, platform);
            logger.debug(`State token created for action: ${action} for ${platform} platform, State token Id: ${stateToken}`);

            //TODO - move to google service
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
            req.formattedResponse = formatResponse(200, `redirect to this URL to ${action} with Google.`, url);
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
            const { action, platform } = this._verifyStateToken(stateToken);
            if (!action) {
                logger.warn('Invalid or expired state token');
                throw MyAppErrors.unauthorized('Invalid or expired authentication request');
            }

            //TODO - move to google service
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

                const { accessToken, refreshToken } = createTokens(createdUser.national_id);

                if (platform === this.platformTypes.WEB) {
                    res.cookie('access_token', accessToken, this.accessTokenCookieOptions);
                    res.cookie('refresh_token', refreshToken, this.refreshTokenCookieOptions);
                    req.formattedResponse = formatResponse(201, 'User registered successfully with Google', createdUser);
                } else if (platform === this.platformTypes.MOBILE) {
                    logger.debug('Mobile platform detected, sending tokens in response body');
                    req.formattedResponse = formatResponse(201, 'User registered successfully with Google, please try to login. to get access_token and refresh_token', {
                        user: createdUser
                        // tokens: {
                        //     access_token: accessToken,
                        //     refresh_token: refreshToken
                        // }
                    });
                }
            } else if (action === 'login') {
                logger.info(`Logging in user with email: ${googleUser.email}`);
                if (!existingUser) {
                    logger.warn(`No user found with email ${googleUser.email} or national_id ${googleUser.sub}`);
                    throw MyAppErrors.unauthorized(this.authenticationError.message, null, this.authorizationHeader);
                }
                logger.debug(`User ${existingUser.national_id} found`);

                const { accessToken, refreshToken } = createTokens(existingUser.national_id);

                if (platform === this.platformTypes.WEB) {
                    logger.debug('Web platform detected, setting cookies');
                    res.cookie('access_token', accessToken, this.accessTokenCookieOptions);
                    res.cookie('refresh_token', refreshToken, this.refreshTokenCookieOptions);
                    req.formattedResponse = formatResponse(200, 'Logged in successfully with Google');
                } else if (platform === this.platformTypes.MOBILE) {
                    logger.debug('Mobile platform detected, sending tokens in response body');

                    req.formattedResponse = formatResponse(200, 'Logged in successfully with Google, store the token in secure storage, send access_token along with requests in authorization header when need to access protected resources. use refresh_token to get a new access_token when the current one expired.', {
                        user: existingUser,
                        tokens: {
                            access_token: accessToken,
                            refresh_token: refreshToken
                        }
                    }, this.authorizationHeader);
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
