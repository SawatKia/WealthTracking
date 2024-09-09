require('dotenv').config();
const Utils = require('../utilities/Utils');
const User = require('../models/UserModel');

const logger = Utils.Logger('BaseController');

class BaseController {

    verifyField(body, requiredFields) {
        logger.info('verifyField')
        logger.debug(`requiredFields: ${requiredFields}`);
        if (requiredFields.length > 0) {
            logger.debug(`body: ${body ? JSON.stringify(body) : 'empty'}`);
            for (let i = 0; i < requiredFields.length; i++) {
                if (!body[requiredFields[i]]) {
                    logger.error(`Missing required field: ${requiredFields[i]}`);
                    throw new Error(`Missing required field: ${requiredFields[i]}`);
                }
            }
            return true;
        }
    }

    async getCurrentUser(req) {
        req.user = {
            id: 1,
            email: 'V2yF3@example.com',
            password: 'password',
            role: 'user',
            memberSince: '2021-05-06T14:39:54.981Z'
        }
        if (!req.user) {
            throw new Error('User not found');
        }
        return req.user;
    }

    verifyOwnership(user, resource) {
        if (!user || !resource.length > 0) {
            throw new Error('User or resource are empty');
        }
        resource.map((i) => {
            if (i.email !== user.email) {
                return false;
            }
        })
        return true;
    }
}
module.exports = BaseController;