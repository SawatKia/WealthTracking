const request = require("supertest");
const app = require("../app");
const pgClient = require("../services/PgClient");
const { test: testConfig } = require("../configs/dbConfigs");
const Utils = require("../utilities/Utils");
const PgClient = require("../services/PgClient");
const { Logger, formatResponse } = Utils;
const logger = Logger("users.test");

const newBankAccount = [
    //* success
    {
        testName: "success",
        body: {
            account_number: "12345678901234567890",
            fi_code: "004",
            national_id: "0000000000001",
            display_name: "Test Bank Account",
            account_name: "Test Bank Account Name",
            balance: 1000.00
        },
        expected: {
            status: 201,
            message: "Bank account created successfully",
            data: {
                account_number: "12345678901234567890",
                fi_code: "004",
                national_id: "0000000000001",
                display_name: "Test Bank Account",
                account_name: "Test Bank Account Name",
                balance: 1000.00
            }
        }
    },
    //* missing and empty account_number
    {
        testName: "missing account_number",
        body: {
            fi_code: "004",
            national_id: "0000000000001",
            display_name: "Test Bank Account",
            account_name: "Test Bank Account Name",
            balance: 1000.00
        },
        expected: {
            status: 400,
            message: "Missing required field: account_number"
        }
    },
    {
        testName: "empty account_number",
        body: {
            account_number: "",
            fi_code: "004",
            national_id: "0000000000001",
            display_name: "Test Bank Account",
            account_name: "Test Bank Account Name",
            balance: 1000.00
        },
        expected: {
            status: 400,
            message: "account_number must not be empty"
        }
    },
    //* missing and empty fi_code
    {
        testName: "missing fi_code",
        body: {
            account_number: "12345678901234567890",
            national_id: "0000000000001",
            display_name: "Test Bank Account",
            account_name: "Test Bank Account Name",
            balance: 1000.00
        },
        expected: {
            status: 400,
            message: "Missing required field: fi_code"
        }
    },
    {
        testName: "empty fi_code",
        body: {
            account_number: "12345678901234567890",
            fi_code: "",
            national_id: "0000000000001",
            display_name: "Test Bank Account",
            account_name: "Test Bank Account Name",
            balance: 1000.00
        },
        expected: {
            status: 400,
            message: "fi_code must not be empty"
        }
    },
    //* missing and empty national_id
    {
        testName: "missing national_id",
        body: {
            account_number: "12345678901234567890",
            fi_code: "004",
            display_name: "Test Bank Account",
            account_name: "Test Bank Account Name",
            balance: 1000.00
        },
        expected: {
            status: 400,
            message: "Missing required field: national_id"
        }
    },
    {
        testName: "empty national_id",
        body: {
            account_number: "12345678901234567890",
            fi_code: "004",
            national_id: "",
            display_name: "Test Bank Account",
            account_name: "Test Bank Account Name",
            balance: 1000.00
        },
        expected: {
            status: 400,
            message: "national_id must not be empty"
        }
    },
    //* missing and empty display_name
    {
        testName: "missing display_name",
        body: {
            account_number: "12345678901234567890",
            fi_code: "004",
            national_id: "0000000000001",
            account_name: "Test Bank Account Name",
            balance: 1000.00
        },
        expected: {
            status: 400,
            message: "Missing required field: display_name"
        }
    },
    {
        testName: "empty display_name",
        body: {
            account_number: "12345678901234567890",
            fi_code: "004",
            national_id: "0000000000001",
            display_name: "",
            account_name: "Test Bank Account Name",
            balance: 1000.00
        },
        expected: {
            status: 400,
            message: "display_name must not be empty"
        }
    },
    //* missing and empty account_name
    {
        testName: "missing account_name",
        body: {
            account_number: "12345678901234567890",
            fi_code: "004",
            national_id: "0000000000001",
            display_name: "Test Bank Account",
            balance: 1000.00
        },
        expected: {
            status: 400,
            message: "Missing required field: account_name"
        }
    },
    {
        testName: "empty account_name",
        body: {
            account_number: "12345678901234567890",
            fi_code: "004",
            national_id: "0000000000001",
            display_name: "Test Bank Account",
            account_name: "",
            balance: 1000.00
        },
        expected: {
            status: 400,
            message: "account_name must not be empty"
        }
    },
    //* missing and empty balance
    {
        testName: "missing balance",
        body: {
            account_number: "12345678901234567890",
            fi_code: "004",
            national_id: "0000000000001",
            display_name: "Test Bank Account",
            account_name: "Test Bank Account Name"
        },
        expected: {
            status: 400,
            message: "Missing required field: balance"
        }
    },
    {
        testName: "empty balance",
        body: {
            account_number: "12345678901234567890",
            fi_code: "004",
            national_id: "0000000000001",
            display_name: "Test Bank Account",
            account_name: "Test Bank Account Name",
            balance: ""
        },
        expected: {
            status: 400,
            message: "balance must not be empty"
        }
    },

    //* account number
    {
        testName: "valid Kasikorn account",
        body: {
            account_number: "123456789", // User inputs without separators
            fi_code: "004",
            national_id: "0000000000001",
            display_name: "Test Bank Account",
            account_name: "Test Bank Account Name",
            balance: 1000.00
        },
        expected: {
            status: 201,
            message: "Bank account created successfully",
            data: {
                account_number: "123-4-56789-0", // Note the formatted output
                fi_code: "004",
                national_id: "0000000000001",
                display_name: "Test Bank Account",
                account_name: "Test Bank Account Name",
                balance: 1000.00
            }
        }
    },
    {
        testName: "valid Kasikorn account with separators",
        body: {
            account_number: "123-4-56789-0", // User inputs with separators
            fi_code: "004",
            national_id: "0000000000001",
            display_name: "Test Bank Account",
            account_name: "Test Bank Account Name",
            balance: 1000.00
        },
        expected: {
            status: 201,
            message: "Bank account created successfully",
            data: {
                account_number: "123-4-56789-0", // Note the formatted output
                fi_code: "004",
                national_id: "0000000000001",
                display_name: "Test Bank Account",
                account_name: "Test Bank Account Name",
                balance: 1000.00
            }
        }
    },
    {
        testName: "invalid account number for bank",
        body: {
            account_number: "123456789", // SCB format for Kasikorn bank
            fi_code: "004",
            national_id: "0000000000001",
            display_name: "Test Bank Account",
            account_name: "Test Bank Account Name",
            balance: 1000.00
        },
        expected: {
            status: 400,
            message: "Invalid account number format for Kasikorn Bank. Expected format: 123-4-56789-0"
        }
    },
    {
        testName: "unsupported bank code",
        body: {
            account_number: "123456789",
            fi_code: "999", // Unsupported bank code
            national_id: "0000000000001",
            display_name: "Test Bank Account",
            account_name: "Test Bank Account Name",
            balance: 1000.00
        },
        expected: {
            status: 400,
            message: "Invalid bank code. Supported banks are: 004, 025, 006, 014, 030, 002"
        }
    },
    {
        testName: "account_number exceeds max length",
        body: {
            account_number: "123456789012345678901", // 21 characters, exceeds 20
            fi_code: "004",
            national_id: "0000000000001",
            display_name: "Test Bank Account",
            account_name: "Test Bank Account Name",
            balance: 1000.00
        },
        expected: {
            status: 400,
            message: "Account number must not exceed 20 characters."
        }
    },
    {
        testName: "account_number contains non-numeric characters",
        body: {
            account_number: "12345ABV7890",
            fi_code: "004",
            national_id: "0000000000001",
            display_name: "Test Bank Account",
            account_name: "Test Bank Account Name",
            balance: 1000.00
        },
        expected: {
            status: 400,
            message: "Account number must contain only numeric characters."
        }
    },

    //* fi_code
    {
        testName: "fi_code exceeds max length",
        body: {
            account_number: "12345678901234567890",
            fi_code: "12345678901234567890A", // 21 characters, exceeds 20
            national_id: "0000000000001",
            display_name: "Test Bank Account",
            account_name: "Test Bank Account Name",
            balance: 1000.00
        },
        expected: {
            status: 400,
            message: "Financial institution code must not exceed 20 characters."
        }
    },
    {
        testName: "fi_code contains non-numeric characters",
        body: {
            account_number: "12345678901234567890",
            fi_code: "FI_TEST!",
            national_id: "0000000000001",
            display_name: "Test Bank Account",
            account_name: "Test Bank Account Name",
            balance: 1000.00
        },
        expected: {
            status: 400,
            message: "Financial institution code must contain only numeric characters."
        }
    },
    //* national_id
    {
        testName: "national_id wrong length",
        body: {
            account_number: "12345678901234567890",
            fi_code: "004",
            national_id: "00000000001", // 11 characters, should be 13
            display_name: "Test Bank Account",
            account_name: "Test Bank Account Name",
            balance: 1000.00
        },
        expected: {
            status: 400,
            message: "National ID must be 13 characters long."
        }
    },
    {
        testName: "national_id contains non-numeric characters",
        body: {
            account_number: "12345678901234567890",
            fi_code: "004",
            national_id: "00000000000A1",
            display_name: "Test Bank Account",
            account_name: "Test Bank Account Name",
            balance: 1000.00
        },
        expected: {
            status: 400,
            message: "National ID must contain only numeric characters."
        }
    },
    //* display_name
    {
        testName: "display_name exceeds max length",
        body: {
            account_number: "12345678901234567890",
            fi_code: "004",
            national_id: "0000000000001",
            display_name: "A".repeat(101), // 101 characters, exceeds 100
            account_name: "Test Bank Account Name",
            balance: 1000.00
        },
        expected: {
            status: 400,
            message: "Display name must not exceed 100 characters."
        }
    },
    //* account_name
    {
        testName: "account_name exceeds max length",
        body: {
            account_number: "12345678901234567890",
            fi_code: "004",
            national_id: "0000000000001",
            display_name: "Test Bank Account",
            account_name: "A".repeat(101), // 101 characters, exceeds 100
            balance: 1000.00
        },
        expected: {
            status: 400,
            message: "Account name must not exceed 100 characters."
        }
    },
    //* balance
    {
        testName: "balance with more than 2 decimal places",
        body: {
            account_number: "12345678901234567890",
            fi_code: "004",
            national_id: "0000000000001",
            display_name: "Test Bank Account",
            account_name: "Test Bank Account Name",
            balance: 1000.999
        },
        expected: {
            status: 400,
            message: "Balance must have at most 2 decimal places."
        }
    },
    {
        testName: "balance as string instead of number",
        body: {
            account_number: "12345678901234567890",
            fi_code: "004",
            national_id: "0000000000001",
            display_name: "Test Bank Account",
            account_name: "Test Bank Account Name",
            balance: "1000.00"
        },
        expected: {
            status: 400,
            message: "Balance must be a number."
        }
    },
    {
        testName: "balance < 0",
        body: {
            account_number: "12345678901234567890",
            fi_code: "004",
            national_id: "0000000000001",
            display_name: "Test Bank Account",
            account_name: "Test Bank Account Name",
            balance: -100.00
        },
        expected: {
            status: 400,
            message: "balance must not be negative"
        }
    },
];
