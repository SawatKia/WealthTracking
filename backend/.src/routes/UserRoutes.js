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
}

router.use(methodValidator(allowedMethods));

router.post('/', UserCont.register.bind(UserCont));
router.post('/check', UserCont.checkPassword.bind(UserCont));
router.get('/', UserCont.getAllUsers.bind(UserCont));
router.patch('/:userId', UserCont.updateUser.bind(UserCont));
router.delete('/:userId', UserCont.deleteUser.bind(UserCont));
router.post('/Admins', adminMiddleware, UserCont.addAdmin.bind(UserCont));

router.use(responseHandler);
router.use(errorHandler);

module.exports = router;