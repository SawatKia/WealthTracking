const express = require('express');
const swaggerUi = require('swagger-ui-express');
const fs = require("fs")
const YAML = require('yaml')
const appConfigs = require('./configs/AppConfigs');

const Utils = require('./utilities/Utils');
const mdw = require('./middlewares/Middlewares')
const UserController = require('./controllers/UserController');
const BankAccountController = require('./controllers/BankAccountController');
const ApiController = require('./controllers/ApiController');
const FinancialInstitutionController = require('./controllers/FinancialInstitutionController');

const NODE_ENV = appConfigs.environment;
const { Logger, formatResponse } = Utils;
const logger = Logger('Routes');
const router = express.Router();

// Instantiate controllers
const userController = new UserController();
const bankAccountController = new BankAccountController();
const apiController = new ApiController();
const fiController = new FinancialInstitutionController();

if (NODE_ENV != 'test') {
    const file = fs.readFileSync('./swagger.yaml', 'utf8');
    const swaggerDocument = YAML.parse(file)
    router.use('/docs', swaggerUi.serve);
    router.get('/docs', swaggerUi.setup(swaggerDocument));
}
const allowedMethods = {
    '/': ['GET'],
    '/users': ['POST'],
    '/users/check': ['POST'],
    '/users/:national_id': ['GET', 'PATCH', 'DELETE'],
    '/banks': ['POST', 'GET'],
    '/banks/:account_number/:fi_code': ['GET', 'PATCH', 'DELETE'],
    '/debts': ['GET', 'POST', 'PATCH', 'DELETE'],
    '/debts/:debtName': ['GET', 'PATCH', 'DELETE'],
    '/slip/quota': ['GET'],
    '/slip': ['POST'],
    // '/fi': ['GET'],
    '/fi/:fi_code': ['GET'],
    '/fis/operating-banks': ['GET'],
    '/slip/verify': ['POST', 'GET'],
}

if (NODE_ENV != 'production') {
    allowedMethods['/users/check'] = ['POST'];
    allowedMethods['/fis'] = ['GET'];
}

router.use((req, res, next) => {
    logger.info(`entering the routing for ${req.method} ${req.url}`);
    next();
})
//TODO - ensure the middlewares is finished before goto the routes
router.use(async (req, res, next) => {
    await mdw.methodValidator(allowedMethods)(req, res, next);
});
router.get('/', (req, res, next) => {
    req.formattedResponse = formatResponse(200, 'you are connected to the /api/v0.2/', null);
    next();
})
router.post('/users', userController.registerUser);
router.post('/users/check', userController.checkPassword);
//TODO - after this line every route should add middleware to verify token
router.post('/banks', mdw.authMiddleware, bankAccountController.createBankAccount);
router.get('/banks', mdw.authMiddleware, bankAccountController.getAllBankAccounts);
router.get('/banks/:account_number/:fi_code', mdw.authMiddleware, bankAccountController.getBankAccount);

router.get('/fis', mdw.authMiddleware, fiController.getAllFinancialInstitutions);
router.get('/fis/operating-banks', mdw.authMiddleware, fiController.getOperatingThaiCommercialBanks);
router.get('/fi/:fi_code', mdw.authMiddleware, fiController.getFinancialInstitutionByCode);

router.get('/slip/quota', mdw.authMiddleware, apiController.getQuotaInformation);
router.post('/slip', mdw.authMiddleware, apiController.extractSlipDataByBase64);
router.all('/slip/verify', mdw.authMiddleware, mdw.conditionalFileUpload, apiController.verifySlip);

router.use(mdw.responseHandler);
router.use(mdw.errorHandler);

module.exports = router;

