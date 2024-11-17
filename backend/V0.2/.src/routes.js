const express = require('express');
const swaggerUi = require('swagger-ui-express');
const fs = require("fs")
const YAML = require('yaml')
const path = require('path');

const appConfigs = require('./configs/AppConfigs');
const Utils = require('./utilities/Utils');
const mdw = require('./middlewares/Middlewares')
const UserController = require('./controllers/UserController');
const BankAccountController = require('./controllers/BankAccountController');
const ApiController = require('./controllers/ApiController');
const FinancialInstitutionController = require('./controllers/FinancialInstitutionController');
const cacheController = require('./controllers/CacheController');
const AuthController = require('./controllers/AuthController');

const NODE_ENV = appConfigs.environment;
const { Logger, formatResponse } = Utils;
const logger = Logger('Routes');
const router = express.Router();

// Instantiate controllers
const userController = new UserController();
const bankAccountController = new BankAccountController();
const apiController = new ApiController();
const fiController = new FinancialInstitutionController();
const authController = new AuthController();

if (NODE_ENV == 'development') {
    logger.info('Generating swagger documentation');
    const file = fs.readFileSync(path.join(__dirname, './swagger.yaml'), 'utf8');
    // const file = fs.readFileSync('./swagger.yaml', 'utf8');
    const swaggerDocument = YAML.parse(file)
    logger.debug(`loaded swagger document: ${JSON.stringify(swaggerDocument, null, 2).substring(0, 50)}...`);
    router.use('/docs', swaggerUi.serve);
    router.get('/docs', swaggerUi.setup(swaggerDocument));
}
const allowedMethods = {
    '/': ['GET'],
    '/users': ['GET', 'POST', 'PATCH', 'DELETE'],
    '/banks': ['POST', 'GET'],
    '/banks/:account_number/:fi_code': ['GET', 'PATCH', 'DELETE'],
    '/debts': ['GET', 'POST', 'PATCH', 'DELETE'],
    '/debts/:debtName': ['GET', 'PATCH', 'DELETE'],
    '/slip/quota': ['GET'],
    '/slip': ['POST'],
    // '/fi': ['GET'],
    // '/fi/:fi_code': ['GET'],
    // '/fis/operating-banks': ['GET'],
    '/slip/verify': ['POST', 'GET'],
    '/cache': ['POST'],
    '/cache/:key': ['GET', 'DELETE'],
    '/login': ['POST'],
    '/refresh': ['POST'],
    '/logout': ['POST'],
    '/google/login': ['POST'],
    '/google/callback': ['GET'],
}

if (NODE_ENV != 'production') {
    allowedMethods['/users/check'] = ['POST'];
    allowedMethods['/fis'] = ['GET'];
    allowedMethods['/fi/:fi_code'] = ['GET'];
    allowedMethods['/fis/operating-banks'] = ['GET'];
}

router.use((req, res, next) => {
    logger.info(`entering the routing for ${req.method} ${req.url}`);
    next();
})
// Global middleware setup
router.use(async (req, res, next) => {
    try {
        // First validate the method
        await mdw.methodValidator(allowedMethods)(req, res, next);
    } catch (error) {
        next(error);
    }
});
router.get('/', (req, res, next) => {
    req.formattedResponse = formatResponse(200, 'you are connected to the /api/v0.2/', null);
    next();
})

// Public routes (no auth required)
router.post('/login', authController.login);
router.post('/users', userController.registerUser);  // Registration should be public
router.post('/google/login', authController.googleLogin);
router.get('/google/callback', authController.googleCallback);

// Protected routes (auth required)
router.use([
    '/banks',
    '/users',  // Only protect user operations AFTER registration
    '/slip',
    '/fis',
    '/debts'
], async (req, res, next) => {
    try {
        if (req.formattedResponse) {
            next();
        } else {
            await mdw.authMiddleware(req, res, next);
        }
    } catch (error) {
        next(error);
    }
});

// Protected routes definitions
router.get('/users', userController.getUser);
router.patch('/users', userController.updateUser);
router.delete('/users', userController.deleteUser);

router.post('/banks', bankAccountController.createBankAccount);
router.get('/banks', bankAccountController.getAllBankAccounts);
router.get('/banks/:account_number/:fi_code', bankAccountController.getBankAccount);

router.get('/fis', fiController.getAllFinancialInstitutions);
router.get('/fis/operating-banks', fiController.getOperatingThaiCommercialBanks);
router.get('/fi/:fi_code', fiController.getFinancialInstitutionByCode);

router.get('/slip/quota', apiController.getQuotaInformation);
router.post('/slip/verify', mdw.conditionalSlipUpload, apiController.verifySlip);

// Cache routes
router.post('/cache', cacheController.set);
router.get('/cache/:key', cacheController.get);
router.delete('/cache/:key', cacheController.delete);

// Add login and logout routes
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

router.use(mdw.responseHandler);
router.use(mdw.errorHandler);

module.exports = router;
