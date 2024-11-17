-- TABLE: financial_institutions
CREATE TABLE
    IF NOT EXISTS financial_institutions (
        fi_code VARCHAR(20) PRIMARY KEY,
        name_th VARCHAR(255) NOT NULL,
        name_en VARCHAR(255) NOT NULL
    );