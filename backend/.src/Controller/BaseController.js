class BaseController {
    //FIXME - make all method protected like in ../../../Backend_firebase/functions/src/controllers/BaseController
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

    //FIXME - this method will pass if required parameter wasn't attached at first
    verifyParams(params) {
        for (const [key, value] of Object.entries(params)) {
            if (value === null || value === undefined || value === '') {
                throw new Error(`${key} is required`);
            }
        }
        return true;
    }

    //FIXME - make this method is abstract method. so it'll must be implement in child class
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