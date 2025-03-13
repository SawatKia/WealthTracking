// components/i18next/translations/en.ts
export default {
  profile: {
    loading: "Loading profile...",
    username: "Username",
    email: "Email",
    birthday: "Birthday",
    password: "Password",
    currentPassword: "Current Password:",
    newPassword: "New Password:",
    confirmNewPassword: "Confirm New Password:",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete Account",
    logout: "Logout",
    deleteAccount: "Delete Account",
    deleteConfirm: "Are you sure you want to delete your account? This action cannot be undone.",
    enterPassword: "Enter your password to confirm:",
    required: "Required to update",
    selectDate: "Select Date",
    success: {
      update: "Your profile has been updated successfully.",
      delete: "Your account has been deleted successfully."
    },
    error: {
      update: "Failed to update profile. Please try again.",
      delete: "Failed to delete account. Please check your password and try again.",
      password: "New passwords do not match."
    }
  },

  login: {
    title: "Welcome Back",
    email: "Email",
    password: "Password",
    rememberMe: "Remember me",
    forgotPassword: "Forgot password?",
    loginButton: "Log In",
    noAccount: "Don't have an account?",
    signupLink: "Sign Up",
    errors: {
      emailRequired: "Email is required",
      emailInvalid: "Invalid email format",
      passwordRequired: "Password is required",
      loginFailed: "Login Failed: "
    }
  },

  signup: {
    title: "Create Account",
    nationalId: "National ID",
    username: "Username",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    signupButton: "Sign Up",
    haveAccount: "Already have an account?",
    loginLink: "Log In",
    errors: {
      nationalIdRequired: "National ID is required",
      nationalIdInvalid: "Invalid National ID format",
      usernameRequired: "Username is required",
      emailRequired: "Email is required",
      emailInvalid: "Invalid email format",
      passwordRequired: "Password is required",
      passwordLength: "Password must be at least 6 characters",
      passwordMatch: "Passwords do not match",
      signupFailed: "Signup Failed: "
    }
  },
  debt: {

    summary: {
      totalDebt: "Total Debt",
      totalMonthlyPayment: "Total Monthly Payment",
      baht: "Baht",
      perMonth: "Baht/Month"
    },
    details: {
      title: "Debt Details",
      installments: "Installments Paid",
      loanPrincipal: "Loan Principal",
      totalPaid: "Total Paid",
      remainingBalance: "Remaining Balance",
      paymentChannel: "Payment Channel",
      buttons: {
        update: "Update Debt",
        delete: "Delete"
      }
    },
    modal: {
      deleteConfirm: "Are you sure you want to delete this debt?",
      cancel: "Cancel",
      delete: "Delete"
    }
  },

  addDebt: {
    title: "Add New Debt",
    form: {
      debtName: "Debt Name",
      loanPrincipal: "Loan Principal",
      totalInstallments: "Total Installments",
      currentInstallment: "Current Installment",
      paymentChannel: "Payment Channel",
      selectBank: "Select Bank"
    },
    validation: {
      required: "This field is required",
      numberOnly: "Please enter numbers only",
      positiveNumber: "Please enter a positive number",
      installmentValid: "Current installment cannot be greater than total installments"
    },
    buttons: {
      add: "Add Debt",
      cancel: "Cancel"
    },
    messages: {
      success: "Debt added successfully",
      error: "Failed to add debt. Please try again."
    }
  },
  account: {
    title: "Account Management",
    summary: {
      totalBalance: "Total Balance",
      totalIncome: "Total Income",
      totalExpense: "Total Expense"
    },
    details: {
      accountName: "Account Name",
      balance: "Balance",
      accountType: "Account Type",
      bank: "Bank",
      actions: {
        edit: "Edit",
        delete: "Delete"
      }
    },

    addAccount: {
      title: "Add New Account",
      form: {
        accountName: "Account Name",
        initialBalance: "Initial Balance",
        accountType: "Account Type",
        bank: "Select Bank",
        selectType: "Select Account Type"
      },
      types: {
        savings: "Savings Account",
        checking: "Checking Account",
        credit: "Credit Card",
        investment: "Investment Account",
        other: "Other"
      },
      validation: {
        required: "This field is required",
        numberOnly: "Please enter numbers only",
        positiveNumber: "Please enter a positive number"
      },
      buttons: {
        add: "Add Account",
        cancel: "Cancel"
      }
    },

    addDetail: {
      title: "Add Transaction",
      form: {
        type: "Transaction Type",
        amount: "Amount",
        category: "Category",
        date: "Date",
        note: "Note",
        selectCategory: "Select Category"
      },
      types: {
        income: "Income",
        expense: "Expense"
      },
      categories: {
        salary: "Salary",
        investment: "Investment",
        food: "Food & Drinks",
        shopping: "Shopping",
        transport: "Transportation",
        utilities: "Utilities",
        other: "Other"
      },
      validation: {
        required: "This field is required",
        numberOnly: "Please enter numbers only",
        positiveNumber: "Please enter a positive number"
      },
      buttons: {
        add: "Add Transaction",
        cancel: "Cancel"
      }
    },
    messages: {
      success: {
        add: "Account added successfully",
        update: "Account updated successfully",
        delete: "Account deleted successfully",
        transaction: "Transaction added successfully"
      },
      error: {
        add: "Failed to add account",
        update: "Failed to update account",
        delete: "Failed to delete account",
        transaction: "Failed to add transaction"
      },
      confirm: {
        delete: "Are you sure you want to delete this account?"
      }
    }
  },
  budget: {
    title: "Budgets",
    category: "Category",
    amount: "Amount",
    selectCategory: "Select Category",
    cancel: "Cancel",
    save: "Save",
    edit: "Edit",
    delete: "Delete",
    update: "Update",
    editBudget: "Edit Budget",
    monthlyLimit: "Monthly Limit",
    left: "Left",
    overspent: "Overspent",
    createBudgetSuccess: "Budget created successfully",
    updateBudgetSuccess: "Budget updated successfully",
    deleteBudgetSuccess: "Budget deleted successfully",
    errorMessages: {
      fillAllFields: "Please fill in all required fields",
      failedToCreate: "Failed to create budget",
      failedToUpdate: "Failed to update budget",
      failedToDelete: "Failed to delete budget",
      failedToFetch: "Failed to fetch budgets"
    }
  },
  pieChart: {
    // Expense Pie Chart
    expensesReport: "Expenses Report",
    noExpense: "No Expense",
    error: "Error",

    // Debt Pie Chart
    noDebtData: "No debt data. Please add your debt to see the debt overview in pie chart.",
    loading: "Loading...",

    // Budget Pie Chart
    totalSpent: "Total Spent",
    createBudget: "Create Budget",
    totalBudget: "Total Budget",
    remaining: "Remaining",
    spent: "Spent",
  }
};




