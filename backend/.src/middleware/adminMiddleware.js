const { ForbiddenError, UnauthorizedError } = require('../utils/error');

const adminMiddleware = async (req, res, next) => {
    try {
        //TODO - wait for the implementation of getCurrentUser, then test this middleware
        const currentUser = await getCurrentUser(req);
        const users = await UserController.getAllUsers();
        if (users.length === 0) {
            // Allow creating an admin
            next();
        }
        if (currentUser.role !== 'admin') {
            throw new ForbiddenError('Access denied');
        }
        throw new UnauthorizedError('Unauthorized access');
    } catch (error) {
        next(error);
    }
};

module.exports = adminMiddleware;
