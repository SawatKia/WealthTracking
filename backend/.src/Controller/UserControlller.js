const UserModel = require("../Model/UserModel")
const BaseController = require("./BaseController")
const logger = require("../logger")

class UserController extends BaseController {
    constructor() {
        super();
        this.UserModel = new UserModel();
    }

    async createUser(newUserData) {
        try {
            logger.info('[UserController] - Creating user');
            logger.debug(`[UserController] - newUserData: ${JSON.stringify(newUserData)}`);
            const requiredFields = ['username', 'email', 'password'];
            await this.verifyParams(newUserData, requiredFields);
            const user = await this.UserModel.createUser(newUserData);
            return user;
        } catch (error) {
            logger.error(`[UserController] - Error creating user: ${error.message}`);
            throw error;
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