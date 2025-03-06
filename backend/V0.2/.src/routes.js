const express = require('express');

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

router.use((req, res, next) => {
    logger.info(`entering the routing for ${req.method} ${req.url}`);
    next();
})


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
router.use(async (req, res, next) => {
    try {
        if (req.formattedResponse) {
            return next();
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

router.get('/fis', fiController.getAllFinancialInstitutions);
router.get('/fis/operating-banks', fiController.getOperatingThaiCommercialBanks);
router.get('/fi/:fi_code', fiController.getFinancialInstitutionByCode);
// Cache routes
if (NODE_ENV !== 'production') {

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




module.exports = router;
