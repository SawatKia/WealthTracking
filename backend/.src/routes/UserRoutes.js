const express = require('express');
const router = express.Router();
require('dotenv').config();

const Logging = require('../configs/logger');
const { errorHandler, adminMiddleware, methodValidator, responseHandler } = require('../middleware/Indexmiddleware');
const UserController = require('../Controllers/UserControlller');

const UserCont = new UserController();
const isDev = process.env.NODE_ENV === 'development';
const allowedMethods = {
    '/': ['POST', isDev ? 'GET' : ''],
    '/:ObjectId': ['PATCH', 'DELETE'],
    '/Admins': ['POST']
};

if (isDev) {
    allowedMethods['/check'] = ['POST'];
    router.post('/check', UserCont.checkPassword.bind(UserCont), responseHandler);
    router.get('/', UserCont.getAllUsers.bind(UserCont), responseHandler);
}
router.use(methodValidator(allowedMethods));

router.post('/', UserCont.register.bind(UserCont), responseHandler);
router.patch('/:userId', UserCont.updateUser.bind(UserCont), responseHandler);
router.delete('/:userId', UserCont.deleteUser.bind(UserCont), responseHandler);
router.post('/Admins', adminMiddleware, UserCont.addAdmin.bind(UserCont), responseHandler);

// Error-handling middleware
router.use(errorHandler);

module.exports = router;