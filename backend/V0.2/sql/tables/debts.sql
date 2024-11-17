-- TABLE: debts
CREATE TABLE
    IF NOT EXISTS debts (
        debt_number VARCHAR(50) PRIMARY KEY,
        fi_code VARCHAR(20) NOT NULL,
        national_id CHAR(13) NOT NULL,
        debt_name VARCHAR(100) NOT NULL,
        start_date DATE NOT NULL,
        current_installment INT NOT NULL,
        total_installments INT NOT NULL,
        loan_principle DECIMAL(15, 2) NOT NULL,
        loan_balance DECIMAL(15, 2) NOT NULL,
        FOREIGN KEY (national_id) REFERENCES users (national_id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (fi_code) REFERENCES financial_institutions (fi_code) ON UPDATE CASCADE ON DELETE CASCADE
    );