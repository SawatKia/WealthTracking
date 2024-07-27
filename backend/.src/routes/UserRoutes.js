const express = require('express');
const router = express.Router();
require('dotenv').config();

const UserController = require('../Controllers/UserControlller');
const Logging = require('../configs/logger');
const { AppError, ForbiddenError, UnauthorizedError } = require('../utils/error');
const formatResponse = require('../utils/responseFormatter');
const MethodValidator = require('../utils/allowedMethod')

const UserCont = new UserController();
const logger = new Logging('UserRoutes');

router.get('/', (req, res) => {
    logger.info('request to /api/v1/user endpoint');
    res.send('Hello World, from UserRoutes');
});
const allowedMethods = {
    '/register': ['POST'],
    '/updateUser': ['PATCH'],
    '/deleteUser': ['DELETE'],
    '/getAllUsers': ['POST'],
};

if (process.env.NODE_ENV === 'development') {
    allowedMethods['/checkPassword'] = ['POST'];
    allowedMethods['/getAllUsers'] = ['POST'];
    router.post('/checkPassword', UserCont.checkPassword.bind(UserCont));
    router.post('/getAllUsers', UserCont.getAllUsers.bind(UserCont));
}
router.use(MethodValidator(allowedMethods));
router.post('/register', UserCont.register.bind(UserCont));
router.patch('/updateUser', UserCont.updateUser.bind(UserCont));
router.delete('/deleteUser', UserCont.deleteUser.bind(UserCont));
const adminMiddleware = async (req, res, next) => {
    try {
        //TODO - wait for the implementation of getCurrentUser, then test this middleware
        const currentUser = await getCurrentUser(req);
        const users = await UserCont.getAllUsers();
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
router.post('/addAdmin', adminMiddleware, UserCont.addAdmin.bind(UserCont));

// Error-handling middleware
router.use((err, req, res, next) => {
    if (err instanceof AppError) {
        res.status(err.statusCode).json(formatResponse(err.statusCode, err.message));
    } else {
        logger.error(err);
        res.status(500).json(formatResponse(500, 'Internal Server Error'));
    }
});

module.exports = router;