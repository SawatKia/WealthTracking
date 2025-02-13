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
const DebtController = require('./controllers/DebtController');
const TransactionController = require('./controllers/TransactionController');
const BudgetController = require('./controllers/BudgetController');

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
const debtController = new DebtController();
const transactionController = new TransactionController();
const budgetController = new BudgetController();

if (NODE_ENV === 'development' || NODE_ENV === 'test') {
    logger.info('Starting Swagger documentation setup...');
    const swaggerPath = path.join(__dirname, './swagger.yaml');
    const swaggerFile = fs.readFileSync(swaggerPath, 'utf8');
    const swaggerDocument = YAML.parse(swaggerFile);
    const swaggerSetup = swaggerUi.setup(swaggerDocument, { explorer: true });
    router.use('/docs', swaggerUi.serve);
    router.get('/docs', swaggerSetup);
    logger.debug('Swagger documentation setup completed');
}

const allowedMethods = {
    '/': ['GET'],
    '/users': ['GET', 'POST', 'PATCH', 'DELETE'],
    '/banks': ['POST', 'GET'],
    '/banks/:account_number/:fi_code': ['GET', 'PATCH', 'DELETE'],
    '/debts': ['GET', 'POST', 'PATCH', 'DELETE'],
    '/debts/:debt_id': ['GET', 'PATCH', 'DELETE'],
    '/debts/:debt_id/payments': ['GET'],
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
    '/transactions': ['GET', 'POST'],
    '/transactions/list/types': ['GET'],
    '/transactions/summary/monthly': ['GET'],
    '/transactions/summary/month-expenses': ['GET'],
    '/transactions/account/:account_number/:fi_code': ['GET'],
    '/transactions/:transaction_id': ['GET', 'PATCH', 'DELETE'],
    '/budgets': ['GET', 'POST'],
    '/budgets/types': ['GET'],
    '/budgets/history': ['GET'],
    '/budgets/:expenseType': ['PATCH', 'DELETE'],
}

if (NODE_ENV != 'production') {
    allowedMethods['/fis'] = ['GET'];
    allowedMethods['/fi/:fi_code'] = ['GET'];
    allowedMethods['/fis/operating-banks'] = ['GET'];
    allowedMethods['/cache'] = ['GET', 'POST'];
    allowedMethods['/cache/:key'] = ['GET', 'DELETE'];
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
// all routes prefix with /api/v0.2
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
    '/debts',
    '/transactions',
    '/budgets'
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

// SECTION Protected routes definitions
router.get('/users', userController.getUser);
router.patch('/users', mdw.conditionalProfilePictureUpload, userController.updateUser);
router.delete('/users', userController.deleteUser);

router.post('/banks', bankAccountController.createBankAccount);
router.get('/banks', bankAccountController.getAllBankAccounts);
router.get('/banks/:account_number/:fi_code', bankAccountController.getBankAccount);
router.patch('/banks/:account_number/:fi_code', mdw.conditionalProfilePictureUpload, bankAccountController.updateBankAccount);
router.delete('/banks/:account_number/:fi_code', bankAccountController.deleteBankAccount);

router.get('/slip/quota', apiController.getSlipQuotaInformation);
router.post('/slip/verify', mdw.conditionalSlipUpload, apiController.verifySlip);

router.post('/debts', debtController.createDebt);
router.get('/debts', debtController.getAllDebts);
router.get('/debts/:debt_id', debtController.getDebt);
router.patch('/debts/:debt_id', debtController.updateDebt);
router.delete('/debts/:debt_id', debtController.deleteDebt);
router.get('/debts/:debt_id/payments', debtController.getAllDebtPayments);

// Cache routes
if (NODE_ENV !== 'production') {
    router.get('/fis', fiController.getAllFinancialInstitutions);
    router.get('/fis/operating-banks', fiController.getOperatingThaiCommercialBanks);
    router.get('/fi/:fi_code', fiController.getFinancialInstitutionByCode);

    router.post('/cache', cacheController.set);
    router.get('/cache', cacheController.getAll);
    router.get('/cache/:key', cacheController.get);
    router.delete('/cache/:key', cacheController.delete);
}

// Add login and logout routes
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

router.post('/transactions', transactionController.createTransaction);
router.get('/transactions', transactionController.getAllTransactions);
router.get('/transactions/list/types', transactionController.getAllTypes);
router.get('/transactions/summary/monthly', transactionController.getMonthlySummary);
router.get('/transactions/summary/month-expenses', transactionController.getSummaryExpenseOnSpecificMonthByType);
router.get('/transactions/account/:account_number/:fi_code', transactionController.getTransactionsByAccount);
router.get('/transactions/:transaction_id', transactionController.getOneTransaction);
router.patch('/transactions/:transaction_id', transactionController.updateTransaction);
router.delete('/transactions/:transaction_id', transactionController.deleteTransaction);

router.post('/budgets', budgetController.createBudget);
router.get('/budgets', budgetController.getAllBudgets);
router.get('/budget/types', budgetController.getBudget);
router.get('/budget/history', budgetController.getBudgetHistory);
router.patch('/budgets/:expenseType', budgetController.updateBudget);
router.delete('/budgets/:expenseType', budgetController.deleteBudget);


router.use(mdw.unknownRouteHandler);
router.use(mdw.errorHandler);
router.use(mdw.responseHandler);


module.exports = router;
