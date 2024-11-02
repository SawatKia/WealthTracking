const jwt = require('jsonwebtoken');
const UserModel = require('../models/UserModel');
const appConfigs = require('../configs/AppConfigs');
const Utils = require('../utilities/Utils');

const { Logger } = Utils;
const logger = Logger('AuthController');

class AuthController {
    constructor() {
        this.userModel = new UserModel();
    }

    async login(req, res, next) {
        const { email, password } = req.body;
        try {
            const { result, user } = await this.userModel.checkPassword(email, password);
            if (!result) {
                return next(MyAppErrors.unauthorized('Invalid credentials'));
            }

            const accessToken = jwt.sign({ id: user.id }, appConfigs.accessTokenSecret, { expiresIn: '15m' });
            const refreshToken = jwt.sign({ id: user.id }, appConfigs.refreshTokenSecret, { expiresIn: '7d' });

            // Set cookies with security options
            res.cookie('access_token', accessToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'Strict',
                maxAge: 15 * 60 * 1000 // 15 minutes
            });
            res.cookie('refresh_token', refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'Strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            logger.info('User logged in successfully');
            res.status(200).json({ message: 'Logged in successfully' });
        } catch (error) {
            logger.error(`Login error: ${error.message}`);
            next(error);
        }
    }

    logout(req, res) {
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
        logger.info('User logged out successfully');
        res.status(200).json({ message: 'Logged out successfully' });
    }
}

module.exports = new AuthController();
