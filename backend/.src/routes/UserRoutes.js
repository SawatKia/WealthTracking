const express = require('express');
const router = express.Router();
require('dotenv').config();

const UserController = require('../Controllers/UserControlller');
const Logging = require('../configs/logger');
const { AppError } = require('../utils/error');
const formatResponse = require('../utils/responseFormatter');
const MethodValidator = require('../utils/allowedMethod')

const UserCont = new UserController();
const logger = new Logging('UserRoutes');

router.get('/', (req, res) => {
    logger.info('request to / endpoint');
    res.send('Hello World, from UserRoutes');
});
const allowedMethods = {
    '/register': ['POST'],
    '/updateUser': ['PATCH'],
    '/deleteUser': ['DELETE'],
};

if (process.env.NODE_ENV === 'development') {
    allowedMethods['/checkPassword'] = ['POST'];
    router.post('/checkPassword', UserCont.checkPassword.bind(UserCont));
}
router.use(MethodValidator(allowedMethods));
router.post('/register', UserCont.register.bind(UserCont));
router.patch('/updateUser', UserCont.updateUser.bind(UserCont));
router.delete('/deleteUser', UserCont.deleteUser.bind(UserCont));


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