-- TABLE: budgets
CREATE TABLE
    IF NOT EXISTS budgets (
        national_id VARCHAR(255) NOT NULL,
        expense_type VARCHAR(50) NOT NULL,
        monthly_limit DECIMAL(15, 2) NOT NULL,
        current_spending DECIMAL(15, 2) DEFAULT 0.00,
        month DATE NOT NULL, -- to store budget for each month
        created_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (national_id, expense_type, month),
            FOREIGN KEY (national_id) REFERENCES users (national_id) ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT valid_expense_type CHECK (
                expense_type IN (
                    'Food',
                    'Transport',
                    'Travel',
                    'Groceries',
                    'House',
                    'Borrowed',
                    'Cure',
                    'Pet',
                    'Education',
                    'Clothes',
                    'Cosmetics',
                    'Accessories',
                    'Insurance',
                    'Hobby',
                    'Utilities',
                    'Vehicle',
                    'Fee',
                    'Business',
                    'Game',
                    'Debt Payment',
                    'Other Expense'
                )
            )
    );

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_budgets_national_id ON budgets (national_id);

CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets (month);