const FiModel = require("./models/FinancialInstitutionModel");
const UserModel = require("./models/UserModel");
const BankAccountModel = require("./models/BankAccountModel");
const DebtModel = require("./models/DebtModel");
const TransactionModel = require("./models/TransactionModel");

const tesseractService = require("./services/Tesseract");
const pgClient = require("./services/PgClient");
const easySlip = require("./services/EasySlip");
const ollama = require("./services/OllamaService");

const Utils = require("./utilities/Utils");
const appConfigs = require("./configs/AppConfigs");
const { v4: uuidv4 } = require('uuid');

const app = require("./app");
const types = require("./../statics/types.json")

const NODE_ENV = appConfigs.environment;
const { Logger, formatResponse } = Utils;
const logger = Logger("Index");
const PORT = appConfigs.appPort || 3000;
/**
 * Load mock data for development environment
 */
const loadMockData = async () => {
  logger.info('Loading mock data for development environment...');

  try {
    // Initialize models
    const userModel = new UserModel();
    const bankAccountModel = new BankAccountModel();
    const debtModel = new DebtModel();
    const transactionModel = new TransactionModel();

    // Mock Users
    logger.info('Creating mock users...');
    const users = [
      {
        national_id: "1234567890123",
        email: "johndoe@example.com",
        username: "johndoe",
        password: "securePassword123",
        date_of_birth: "1990-01-01"
      },
      {
        national_id: '2345678901234',
        email: 'jane@example.com',
        username: 'jane_smith',
        password: 'Password123!',
        date_of_birth: '1992-05-15'
      }
    ];

    for (const user of users) {
      await userModel.createUser(user, { silent: true });
    }
    logger.info('✓ Successfully created mock users');

    // Mock Bank Accounts
    logger.info('Creating mock bank accounts...');
    const bankAccounts = [
      {
        account_number: '1234567890',
        fi_code: '004',
        national_id: '1234567890123',
        display_name: 'Primary',
        account_name: 'John Savings',
        balance: 7125000.00
      },
      {
        account_number: '1234567890',
        fi_code: '014',
        national_id: '1234567890123',
        display_name: 'Secondary',
        account_name: 'John Checking',
        balance: 2315000.00
      },
      {
        account_number: '2345678901',
        fi_code: '004',
        national_id: '2345678901234',
        display_name: 'Primary',
        account_name: 'Jane Savings',
        balance: 435000.00
      },
      {
        account_number: '3456789012',
        fi_code: '025',
        national_id: '2345678901234',
        display_name: 'Business',
        account_name: 'Jane Business',
        balance: 575000.00
      }
    ];

    for (const account of bankAccounts) {
      await bankAccountModel.create(account, { silent: true });
    }
    logger.info('✓ Successfully created mock bank accounts');

    // Mock Debts
    logger.info('Creating mock debts...');
    const debts = [
      {
        debt_id: uuidv4(),
        fi_code: '004',
        national_id: '1234567890123',
        debt_name: 'Home Loan',
        start_date: '2023-01-01',
        current_installment: 6,
        total_installments: 60,
        loan_principle: 1000000.00,
        loan_balance: 900000.00
      },
      {
        debt_id: uuidv4(),
        fi_code: '014',
        national_id: '2345678901234',
        debt_name: 'Car Loan',
        start_date: '2023-03-01',
        current_installment: 4,
        total_installments: 48,
        loan_principle: 500000.00,
        loan_balance: 450000.00
      }
    ];

    for (const debt of debts) {
      await debtModel.create(debt, { silent: true });
    }
    logger.info('✓ Successfully created mock debts');

    // Mock Transactions
    logger.info('Creating mock transactions...');
    let transactions = [];

    const createRandomTransactions = async (user, accounts, count = 100) => {
      for (let i = 0; i < count; i++) {
        const isDebtTransaction = Math.random() < 0.3; // 30% chance of being a debt transaction

        let category, type;
        if (isDebtTransaction) {
          category = 'Expense';
          type = 'Debt Payment';
        } else {
          logger.debug(`loaded types: ${JSON.stringify(types)}`);
          const categories = Object.keys(types);
          category = categories[Math.floor(Math.random() * categories.length)];
          const typeArray = types[category];
          type = typeArray[Math.floor(Math.random() * typeArray.length)];
        }
        logger.debug(`category: ${category}, type: ${type}`);

        // Calculate maximum amount based on transaction type
        let maxAmount;
        if (category === 'Expense' || category === 'Transfer') {
          // For expenses and transfers, use 20% of account balance as maximum
          maxAmount = Math.min(accounts[0].balance * 0.2, 10000);
        } else {
          // For income, use a reasonable fixed maximum
          maxAmount = 10000;
        }

        // Ensure minimum amount is 100 but not more than maxAmount
        const amount = parseFloat((Math.random() * (maxAmount - 100) + 100).toFixed(2));

        const transaction = {
          transaction_id: uuidv4(),
          transaction_datetime: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
          category,
          type,
          amount,
          note: isDebtTransaction ? 'Mock debt payment' : 'Mock transaction',
          national_id: user.national_id,
          ...(isDebtTransaction && { debt_id: debts[Math.floor(Math.random() * debts.length)].debt_id })
        };

        if (category === 'Transfer' || category === 'Expense') {
          transaction.sender_account_number = accounts[0].account_number;
          transaction.sender_fi_code = accounts[0].fi_code;
        }

        if (category === 'Transfer' || category === 'Income') {
          transaction.receiver_account_number = accounts[accounts.length - 1].account_number;
          transaction.receiver_fi_code = accounts[accounts.length - 1].fi_code;
        }

        // Update account balance for expenses and transfers
        if (category === 'Expense' || category === 'Transfer') {
          accounts[0].balance -= amount;
        }
        if (category === 'Income') {
          accounts[accounts.length - 1].balance += amount;
        }
        if (category === 'Transfer') {
          accounts[accounts.length - 1].balance += amount;
        }

        transactions.push(transaction);

        await transactionModel.create(transaction, { silent: true });
      }
    };

    // Create transactions for each user
    const userAccounts = {
      '1234567890123': bankAccounts.slice(0, 2),
      '2345678901234': bankAccounts.slice(2)
    };

    for (const user of users) {
      await createRandomTransactions(user, userAccounts[user.national_id]);
    }

    logger.info('✓ Successfully created mock transactions');
    const logDataCreation = async () => {
      try {
        const logs = [
          { type: 'users', count: users.length },
          { type: 'bank_accounts', count: bankAccounts.length },
          { type: 'transactions', count: transactions.length },
          { type: 'debts', count: debts.length }
        ];

        for (const log of logs) {
          logger.info(`✓ ${log.count} ${log.type} created`);
        }
      } catch (error) {
        logger.error('Failed to log data creation:', error.message);
      }
    };

    await logDataCreation();
  } catch (error) {
    logger.error('Failed to load mock data:', error.message);
    throw error;
  }
};

/**
 * Initialize all required services
 */
const initializeServices = async () => {
  logger.info("Initializing services...");

  if (!pgClient.isConnected()) {
    logger.info("Connecting to database...");
    await pgClient.init();
    logger.info("Database connected");
  }

  await easySlip.init();
  await ollama.init();

  const fi = new FiModel();
  await fi.initializeData();

  await tesseractService.initializeScheduler();
};

/**
 * Start the Express server
 */
const startExpressServer = () => {
  return new Promise((resolve, reject) => {
    const server = app.app.listen(PORT, () => {
      const endTime = Date.now();
      const timeTaken = endTime - app.startTime;

      logger.debug('┌──────────────────────────────────────────┐');
      logger.debug('│       Server started successfully        │');
      logger.debug('├──────────────────────────────────────────┤');
      logger.debug(`│ Environment: ${NODE_ENV.padEnd(28)}│`);
      logger.debug(`│ App is listening on port ${PORT.toString().padEnd(16)}│`);
      logger.debug(`│ Server startup time: ${timeTaken.toLocaleString('en-US')} ms`.padEnd(43) + '│');
      logger.debug('└──────────────────────────────────────────┘');
      logger.info(`try sending a request to localhost:${PORT}/health to verify server is running`);
      resolve(server);
    });

    server.on('error', (error) => {
      logger.error('Server error:', error);
      reject(error);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });
  });
};

/**
 * Function to start the server
 */
const startServer = async () => {
  logger.info("=".repeat(20) + " Starting server " + "=".repeat(20));

  try {
    await initializeServices();

    if (NODE_ENV === 'development' && String(appConfigs.loadMockData).toLowerCase() === 'true') {
      try {
        await pgClient.truncateTables();
        await loadMockData();

      } catch (error) {
        logger.warn('Mock data loading process failed: ' + error.message);
        // Continue server startup even if mock data fails
      }
    }

    await startExpressServer();
  } catch (error) {
    logger.error("Failed to start the server:", error.message);
    process.exit(1);
  }
};

// Initialize server
startServer();
