const FiModel = require("./models/FinancialInstitutionModel");
const UserModel = require("./models/UserModel");
const BankAccountModel = require("./models/BankAccountModel");
const DebtModel = require("./models/DebtModel");
const TransactionModel = require("./models/TransactionModel");

const documentAiService = require("./services/DocumentAiService");
const OcrMappingService = require("./services/OcrMappingService");
const pgClient = require("./services/PgClient");
const easySlip = require("./services/EasySlip");
const LLMService = require("./services/LLMService");
const GoogleSheetService = require("./services/GoogleSheetService.js");
const app = require("./app");

const types = require("./../statics/types.json");
const serverTime = require('./utilities/StartTime');
const Utils = require("./utilities/Utils");
const appConfigs = require("./configs/AppConfigs");

const { v4: uuidv4 } = require('uuid');
const NODE_ENV = appConfigs.environment;
const { Logger, formatResponse } = Utils;
const logger = Logger("Index");
const PORT = appConfigs.appPort || 3000;

// Shuffle array using Fisher-Yates algorithm
function shuffle(array) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
}

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
    logger.info('Successfully created mock users');

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
    logger.info('Successfully created mock bank accounts');

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
    logger.info('Successfully created mock debts');

    // Mock Transactions
    logger.info('Creating mock transactions...');
    let transactions = [];
    let incomeCount = 0;
    let expenseCount = 0;
    let transferCount = 0;

    const getRandomDateInLastNYears = (numberOfYears = 1) => {
      const now = new Date();
      const latestYear = now.getFullYear();
      const oldestYear = latestYear - numberOfYears;

      // Create date range
      const startDate = new Date(oldestYear, 0, 1).getTime();
      const endDate = now.getTime();

      // Generate random timestamp between start and end dates
      const randomTimestamp = startDate + Math.random() * (endDate - startDate);
      return new Date(randomTimestamp);
    };

    const createRandomTransactions = async (user, accounts, count = 100, ratios = {
      Income: 0.6,
      Expense: 0.3,
      Transfer: 0.1
    }, yearOfHistory = 5) => {

      // Validate ratios
      const totalRatio = Object.values(ratios).reduce((sum, ratio) => sum + ratio, 0);
      if (Math.abs(totalRatio - 1) > 0.0001) {
        throw new Error('Transaction category ratios must sum to 1');
      }

      for (let i = 0; i < count; i++) {
        const isDebtTransaction = Math.random() < 0.2; // 20% chance of being a debt transaction

        let category, type;
        if (isDebtTransaction) {
          category = 'Expense';
          type = 'Debt Payment';
        } else {
          // Select category based on user-defined ratios
          const rand = Math.random();
          let cumulative = 0;
          for (const [cat, ratio] of Object.entries(ratios)) {
            cumulative += ratio;
            if (rand < cumulative) {
              category = cat;
              break;
            }
          }

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
          transaction_datetime: getRandomDateInLastNYears(yearOfHistory),
          category,
          type,
          amount,
          note: isDebtTransaction ? 'Mock debt payment' : 'Mock transaction',
          national_id: user.national_id,
          ...(isDebtTransaction && { debt_id: debts[Math.floor(Math.random() * debts.length)].debt_id })
        };

        if (category == 'Transfer' || category == 'Expense') {
          logger.debug('add sender account')
          transaction.sender_account_number = accounts[0].account_number;
          transaction.sender_fi_code = accounts[0].fi_code;
        }

        if (category == 'Transfer' || category == 'Income') {
          logger.debug('add receiver account')
          transaction.receiver_account_number = accounts[accounts.length - 1].account_number;
          transaction.receiver_fi_code = accounts[accounts.length - 1].fi_code;
        }

        // Update account balance and counters
        if (category == 'Expense' || category == 'Transfer') {
          accounts[0].balance -= amount;
        }
        if (category == 'Income') {
          accounts[accounts.length - 1].balance += amount;
          incomeCount++;
        } else if (category == 'Expense') {
          expenseCount++;
        }
        if (category == 'Transfer') {
          accounts[accounts.length - 1].balance += amount;
          transferCount++;
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

    logger.info('Successfully created mock transactions');
    const logDataCreation = async () => {
      try {
        const logs = [
          { type: 'users', count: users.length },
          { type: 'bank_accounts', count: bankAccounts.length },
          { type: 'transactions', count: transactions.length },
          { type: 'income transactions', count: incomeCount },
          { type: 'expense transactions', count: expenseCount },
          { type: 'transfer transactions', count: transferCount },
          { type: 'debts', count: debts.length }
        ];

        for (const log of logs) {
          logger.info(`✓ ${log.count} ${log.type} created`);
        }
      } catch (error) {
        logger.error(`Failed to log data creation: ${error.message}`);
      }
    };

    await logDataCreation();
  } catch (error) {
    logger.error(`Failed to load mock data: ${error.message}`);
    throw error;
  }
};

/**
 * Initialize all required services
 */
const initializeServices = async () => {
  try {
    logger.info("Initializing services...");

    // Initialize the PgClient (Required)
    await pgClient.init();
    if (!await pgClient.isConnected()) {
      logger.error("Failed to connect to the database.");
      throw new Error("Database connection failed.");
    }
    logger.info("Database connection successful");

    // Initialize Financial Institutions data (Required)
    const fi = new FiModel();
    await fi.initializeData();
    logger.info("✓ Financial institutions data initialized");

    // Initialize optional external services with fallbacks
    const services = [
      { name: 'EasySlip', init: easySlip.init.bind(easySlip) },
      { name: 'DocumentAI', init: documentAiService.init.bind(documentAiService) },
      { name: 'LLM', init: LLMService.init.bind(LLMService) },
      { name: 'OCRMapping', init: OcrMappingService.init.bind(OcrMappingService) },
      { name: 'GoogleSheet', init: GoogleSheetService.init.bind(GoogleSheetService) }
    ];

    // Initialize each service with error handling
    for (const service of services) {
      try {
        await service.init();
        logger.info(`✓ ${service.name} service initialized`);
      } catch (error) {
        logger.warn(`⚠️ ${service.name} service initialization failed: ${error.message}`);
        logger.warn(`The application will continue without ${service.name} functionality`);
      }
    }

  } catch (error) {
    logger.error(`Error initializing core services: ${error.message}`);
    throw error;
  }
};

const verifyEnvVars = (variables) => {
  try {
    logger.info("Verifying environment variables...");

    // Check if variables object exists and is not empty
    if (!variables || typeof variables !== 'object' || Object.keys(variables).length === 0) {
      throw new Error("No environment variables found");
    }

    // Recursively check all nested objects
    const checkNestedObject = (obj, parentKey = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = parentKey ? `${parentKey}.${key}` : key;

        if (typeof value === 'object' && value !== null) {
          checkNestedObject(value, fullKey);
        } else if (
          value === undefined ||
          value === null ||
          value === '' ||
          value === 'undefined' ||
          value === 'null' ||
          (typeof value === 'string' && value.trim().length === 0)
        ) {
          logger.warn(`⚠️ ${fullKey} is not properly set. Please check your .env file.`);
          logger.warn(`📝 For configuration details, visit: \x1b[38;5;51mhttps://github.com/SawatKia/WealthTracking/blob/main/.env.example\x1b[0m`);
        }
      }
    };

    checkNestedObject(variables);
    logger.info("✅ Environment variables verification completed");
  } catch (error) {
    logger.error(`Error verifying environment variables: ${error.message}`);
    throw error;
  }
};

/**
 * Function to display the WealthTrack app symbol in ASCII art
 */
const showAppSymbol = () => {
  const coins = ["💰 💰 💰", "💰 💰", "💰"];
  const banknotes = ["💵💵💵💵", "💵💵💵", "💵💵"];
  const transactions = ["📊 +5000 THB", "📊 -1200 THB", "📊 +7000 THB"];
  const income = ["➕ 1200 THB", "➕ 8000 THB", "➕ 500 THB"];
  const expense = ["➖ 1500 THB", "➖ 3000 THB", "➖ 2200 THB"];

  console.log(`
    ██╗    ██╗███████╗ █████╗ ██╗    ████████╗██╗  ██╗████████╗██████╗  █████╗  ██████╗██╗  ██╗
    ██║    ██║██╔════╝██╔══██╗██║    ╚══██╔══╝██║  ██║╚══██╔══╝██╔══██╗██╔══██╗██╔════╝██║ ██╔╝
    ██║ █╗ ██║█████╗  ███████║██║       ██║   ███████║   ██║   ██████╔╝███████║██║     █████╔╝ 
    ██║███╗██║██╔══╝  ██╔══██║██║       ██║   ██╔══██║   ██║   ██╔══██╗██╔══██║██║     ██╔═██╗ 
    ╚███╔███╔╝███████╗██║  ██║███████╗  ██║   ██║  ██║   ██║   ██║  ██║██║  ██║╚██████╗██║  ██╗
     ╚══╝╚══╝ ╚══════╝╚═╝  ╚═╝╚══════╝  ╚═╝   ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
    -----------------------------------------------------------------------------------
    💰 Coins         💵 Banknotes         📊 Transactions          ➕ Income   ➖ Expense
    -----------------------------------------------------------------------------------
  `);

  for (let i = 0; i < coins.length; i++) {
    console.log(
      `\t${coins[i].padEnd(18)}${banknotes[i].padEnd(18)}${transactions[i].padEnd(22)}${income[i].padEnd(18)}${expense[i]}`
    );
  }

  console.log(`
    -----------------------------------------------------------------------------------
    📢 WealthTrack server started... Track your finances wisely! 🚀
  `);
};


/**
 * Start the Express server
 */
const startExpressServer = () => {
  return new Promise((resolve, reject) => {
    const server = app.listen(PORT, () => {
      const timeTaken = serverTime.getUptime();
      logger.info("start express server...");

      showAppSymbol();


      logger.info('┌──────────────────────────────────────────┐');
      logger.info('│       Server started successfully        │');
      logger.info('├──────────────────────────────────────────┤');
      logger.info(`│ Environment: ${NODE_ENV.padEnd(28)}│`);
      logger.info(`│ App is listening on port ${PORT.toString().padEnd(16)}│`);
      logger.info(`│ Server startup time: ${timeTaken.toLocaleString('en-US')} ms`.padEnd(43) + '│');
      logger.info('└──────────────────────────────────────────┘');
      logger.info(`try sending a request to 🔗  \x1b[38;5;51mhttp://localhost:${PORT}/health\x1b[0m to verify server is running`);
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
    // Validate environment
    verifyEnvVars(appConfigs);

    // Initialize services
    await initializeServices();

    if (String(appConfigs.loadMockData).toLowerCase() === 'true') {
      try {
        logger.info('Loading mock data...');
        await pgClient.truncateTables();
        await loadMockData();

      } catch (error) {
        logger.warn('Mock data loading process failed: ' + error.message);
        // Continue server startup even if mock data fails
      }
    }


    await startExpressServer();
  } catch (error) {
    logger.error(`Failed to start the server: ${error.message}`);
    process.exit(1);
  }
};

// Initialize server
startServer();
