const express = require('express');
const router = express.Router();
require('dotenv').config();

const Logging = require('../configs/logger');
const { AppError, ForbiddenError, UnauthorizedError } = require('../utils/error');
const formatResponse = require('../utils/responseFormatter');
const MethodValidator = require('../utils/allowedMethod')
const UserController = require('../Controllers/UserControlller');

const UserCont = new UserController();
const logger = new Logging('UserRoutes');

const allowedMethods = {
    '/': ['GET', 'POST'],
    '/:ObjectId': ['PATCH', 'DELETE'],
    '/Admins': ['POST']
};

if (process.env.NODE_ENV === 'development') {
    allowedMethods['/check'] = ['POST'];
    allowedMethods['/list'] = ['GET'];
    router.post('/check', UserCont.checkPassword.bind(UserCont));
    router.get('/list', UserCont.getAllUsers.bind(UserCont));
}
router.use(MethodValidator(allowedMethods));

//NOTE - or remove this to have only one GET route
router.get('/', (req, res) => {
    logger.info('request to /api/v1/users/ endpoint');
    res.status(200).json(formatResponse(200, 'you are connected to the UserRoutes'));
});
router.post('/', UserCont.register.bind(UserCont));
router.patch('/:userId', UserCont.updateUser.bind(UserCont));
router.delete('/:userId', UserCont.deleteUser.bind(UserCont));
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
router.post('/Admins', adminMiddleware, UserCont.addAdmin.bind(UserCont));

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