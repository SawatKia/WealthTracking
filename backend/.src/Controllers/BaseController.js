const Logging = require("../configs/logger");
const { BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError } = require('../utils/error');

const logger = new Logging('BaseController');

class BaseController {
    constructor() {
        if (this.constructor === BaseController) {
            throw new Error("Abstract classes can't be instantiated.");
        }
    }

    isToken(request) {
        if (!request.cookies || !request.cookies.token) {
            throw new Error("Missing token in the request");
        }
        return true;
    }

    decodeToken(token) {
        //TODO - implement token decoding
        return token;
    }

    verifyParams(params, requiredFields) {
        logger.info('Verifying params');
        logger.debug(`Verifying params: ${JSON.stringify(params)}, required fields: ${requiredFields}`);
        try {
            if (Object.keys(params).length !== requiredFields.length) {
                logger.error('Invalid number of params');
                throw new BadRequestError('Invalid number of params');
            }
            for (const field of requiredFields) {
                if (!params.hasOwnProperty(field) || params[field] === null || params[field] === undefined || params[field] === '') {
                    logger.error(`${field} is required`);
                    throw new BadRequestError(`${field} is required`);
                }
            }
            logger.info('Params verified');
            return true;
        } catch (error) {
            throw error;
        }
    }

    async verifyRightToModify(request, entityId) {
        // This method should be implemented in child classes
        throw new Error("Method 'verifyRightToModify' must be implemented.");
    }

    async handleRequest(requestFunction) {
        try {
            const result = await requestFunction();
            return { status: 200, message: "Operation successful", data: result };
        } catch (error) {
            return { status: 500, message: "Operation failed", error: error.message };
        }
    }

    async getCurrentUser(request) {
        // const userId = this.decodeToken(request.cookies.token);
        // const user = await UserModel.getUserById(userId);
        // if (!user) {
        //     throw new Error('User not found');
        // }
        // return user;
    }
}

module.exports = BaseController;