-- TABLE: slip_history
CREATE TABLE
    IF NOT EXISTS slip_history (
        id SERIAL PRIMARY KEY,
        payload VARCHAR(255) NOT NULL UNIQUE,
        trans_ref VARCHAR(255) NOT NULL,
        national_id VARCHAR(13) NOT NULL,
        created_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (national_id) REFERENCES users (national_id)
    );

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_slip_history_payload ON slip_history (payload);

CREATE INDEX IF NOT EXISTS idx_slip_history_national_id ON slip_history (national_id);