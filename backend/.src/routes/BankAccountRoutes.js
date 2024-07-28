const express = require('express');
const router = express.Router();
require('dotenv').config();

const logging = require('../configs/logger');
const { AppError } = require('../utils/error');
const formatResponse = require("../utils/responseFormatter");
const MethodValidator = require('../utils/allowedMethod');
const BankAccountController = require('../Controllers/BankAccountController');

const logger = new logging('BankAccountRoutes');
const BankAccountCont = new BankAccountController();

const allowedMethods = {
    // '/': ['GET', 'POST'],
    '/': ['GET'],
    '/:userId': ['POST'],
};
router.get('/', (req, res) => {
    logger.info('request to /api/v1/bank-account/ endpoint');
    res.status(200).json(formatResponse(200, 'you are connected to the BankAccountRoutes'));
});
router.use(MethodValidator(allowedMethods));
router.post('/:userId', BankAccountCont.createBankAccount.bind(BankAccountCont));

router.use((err, req, res, next) => {
    if (err instanceof AppError) {
        res.status(err.statusCode).json(formatResponse(err.statusCode, err.message));
    } else {
        res.status(500).json(formatResponse(500, 'Internal Server Error'));
    }
});

module.exports = router;


