-- TABLE: transaction_bank_account_relations
CREATE TABLE
    IF NOT EXISTS transaction_bank_account_relations (
        transaction_id VARCHAR(50) NOT NULL,
        account_number VARCHAR(20) NOT NULL,
        fi_code VARCHAR(20) NOT NULL,
        role VARCHAR(20) NOT NULL,
        PRIMARY KEY (account_number, fi_code, transaction_id),
        FOREIGN KEY (account_number, fi_code) REFERENCES bank_accounts (account_number, fi_code) ON UPDATE CASCADE ON DELETE CASCADE,
        FOREIGN KEY (transaction_id) REFERENCES transactions (transaction_id) ON UPDATE CASCADE ON DELETE CASCADE
    );