const express = require('express');
const UserController = require('../Controllers/UserControlller');
const Logging = require('../configs/logger');
const { AppError } = require('../utils/error')

const router = express.Router();
const UserCont = new UserController();
const logger = new Logging('UserRoutes');

router.get('/', (req, res) => {
    logger.info('request to / endpoint');
    res.send('Hello World, from UserRoutes');
});
// Route to create a new user
//TODO - check incoming method if the method are allowed?
router.post('/register', UserCont.register.bind(UserCont));
router.post('/checkPassword', UserCont.checkPassword.bind(UserCont));


// Error-handling middleware
router.use((err, req, res, next) => {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            status_code: err.statusCode,
            message: err.message,
            data: err.data || null
        });
    } else {
        console.error(err); // Log the error for debugging purposes
        res.status(500).json({
            status_code: 500,
            message: 'Internal Server Error'
        });
    }
});

module.exports = router;