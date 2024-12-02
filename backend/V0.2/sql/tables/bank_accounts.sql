-- TABLE: bank_accounts
CREATE TABLE
    IF NOT EXISTS bank_accounts (
        account_number VARCHAR(20) NOT NULL,
        fi_code VARCHAR(20) NOT NULL,
        national_id VARCHAR(255) NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        account_name VARCHAR(100) NOT NULL,
        balance DECIMAL(15, 2) NOT NULL,
        PRIMARY KEY (account_number, fi_code),
        FOREIGN KEY (national_id) REFERENCES users (national_id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (fi_code) REFERENCES financial_institutions (fi_code) ON UPDATE CASCADE ON DELETE CASCADE
    );