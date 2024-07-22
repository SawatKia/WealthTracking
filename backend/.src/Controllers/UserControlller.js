const UserModel = require("../Models/UserModel");
const BaseController = require("./BaseController");
const Logging = require("../configs/logger");
const { BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError } = require('../utils/error');
const formatResponse = require('../utils/responseFormatter');

const logger = new Logging('UserController');

class UserController extends BaseController {
    constructor() {
        super();
        this.UserModel = new UserModel();
    }

    async register(req, res, next) {
        try {
            logger.info('request to /create endpoint');
            logger.debug(`parse request body: ${JSON.stringify(req.body)}`);
            const newUserData = req.body;
            logger.debug(`newUserData: ${JSON.stringify(newUserData)}`);
            const requiredFields = ['username', 'email', 'password', 'confirmPassword'];
            await this.verifyParams(newUserData, requiredFields);
            logger.info('Creating user');
            const user = await this.UserModel.createUser(newUserData);
            res.status(201).json(formatResponse(201, 'User created successfully', { id: user._id }));
        } catch (error) {
            logger.error(`Error creating user: ${error.message}`);
            next(error);
        }
    }


    // async loginUser(request) {
    //     try {
    //         const requiredFields = ['email', 'hashedpassword'];
    //         await this.verifyParams(request.body, requiredFields);
    //         const user = await this.UserModel.loginUser(request.body);
    //         return user;
    //     } catch (error) {
    //         throw error;
    //     }
    // }

    // async getUser(request) {
    //     try {
    //         const user = await this.getCurrentUser(request);
    //         return user;
    //     } catch (error) {
    //         throw error;
    //     }
    // }

    // async updateUser(request) {
    //     try {
    //         const user = await this.getCurrentUser(request);
    //         const requiredFields = ['Username', 'email', 'hashedpassword'];
    //         await this.verifyParams(request.body, requiredFields);
    //         await this.verifyRightToModify(request, user._id);
    //         const updatedUser = await this.UserModel.updateUser(user._id, request.body);
    //         return updatedUser;
    //     } catch (error) {
    //         throw error;
    //     }
    // }

    // async deleteUser(request) {
    //     try {
    //         const user = await this.getCurrentUser(request);
    //         await this.verifyRightToModify(request, user._id);
    //         const deletedUser = await this.UserModel.deleteUser(user._id);
    //         return deletedUser;
    //     } catch (error) {
    //         throw error;
    //     }
    // }
}

module.exports = UserController;