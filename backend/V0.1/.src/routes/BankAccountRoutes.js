const express = require('express');
const router = express.Router();
require('dotenv').config();

const logging = require('../configs/logger');
const { errorHandler, methodValidator, responseHandler } = require('../middleware/Indexmiddleware');
const BankAccountController = require('../Controllers/BankAccountController');

const logger = new logging('BankAccountRoutes');
const BankAccountCont = new BankAccountController();

const allowedMethods = {
    // '/': ['GET', 'POST'],
    '/': ['GET'],
    '/:ObjectId': ['GET', 'POST', 'PATCH'],
    // '/:ObjectId': ['GET'],
    '/user/:ObjectId': ['GET'],
};
router.use(methodValidator(allowedMethods));
router.get('/', (req, res) => {
    logger.info('request to /api/v1/bank-account/ endpoint');
    res.status(200).json(formatResponse(200, 'you are connected to the BankAccountRoutes'));
});
router.post('/:userId', BankAccountCont.addBankAccount.bind(BankAccountCont));
router.get('/:accountId', BankAccountCont.getBankAccountById.bind(BankAccountCont));
router.get('/user/:userId', BankAccountCont.getBankAccountsByUserId.bind(BankAccountCont));
router.patch('/:accountId', BankAccountCont.updateBankAccount.bind(BankAccountCont));

router.use(responseHandler);
router.use(errorHandler);

module.exports = router;


