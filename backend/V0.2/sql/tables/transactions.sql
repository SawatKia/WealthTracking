-- TABLE: transactions
CREATE TABLE
    IF NOT EXISTS transactions (
        transaction_id VARCHAR(50) PRIMARY KEY,
        transaction_datetime TIMESTAMP NOT NULL,
        category VARCHAR(50) NOT NULL,
        type VARCHAR(20) NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        note TEXT,
        slip_uri TEXT,
        national_id CHAR(13) NOT NULL,
        debt_id VARCHAR(50),
        sender_account_number VARCHAR(20),
        sender_fi_code VARCHAR(20),
        receiver_account_number VARCHAR(20),
        receiver_fi_code VARCHAR(20),
        FOREIGN KEY (national_id) REFERENCES users (national_id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (debt_id) REFERENCES debts (debt_id) ON UPDATE CASCADE ON DELETE CASCADE,
        FOREIGN KEY (sender_account_number, sender_fi_code) REFERENCES bank_accounts (account_number, fi_code) ON UPDATE CASCADE ON DELETE CASCADE,
        FOREIGN KEY (receiver_account_number, receiver_fi_code) REFERENCES bank_accounts (account_number, fi_code) ON UPDATE CASCADE ON DELETE CASCADE
    );