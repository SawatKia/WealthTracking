const express = require('express');
const UserController = require('../Controllers/UserControlller');
const Logging = require('../configs/logger');
const { AppError, methodNotAllowedError, BadRequestError } = require('../utils/error');
const formatResponse = require('../utils/responseFormatter');

const router = express.Router();
const UserCont = new UserController();
const logger = new Logging('UserRoutes');

router.get('/', (req, res) => {
    logger.info('request to / endpoint');
    res.send('Hello World, from UserRoutes');
});
router.use((req, res, next) => {
    const { method, path } = req;
    const allowedMethods = {
        '/register': ['POST'],
        '/checkPassword': ['POST'],
        '/updateUser': ['PATCH']
    };
    if (!allowedMethods[path]) {
        return next(new BadRequestError(`${path} not available`));
    }
    if (!allowedMethods[path].includes(method)) {
        return next(new methodNotAllowedError(`${method} method not allowed in ${path}`));
    }
    next();
});
router.post('/register', UserCont.register.bind(UserCont));
router.post('/checkPassword', UserCont.checkPassword.bind(UserCont));
router.patch('/updateUser', UserCont.updateUser.bind(UserCont));


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