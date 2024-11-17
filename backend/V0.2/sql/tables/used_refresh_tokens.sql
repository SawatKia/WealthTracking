-- TABLE: used_refresh_tokens
CREATE TABLE
    IF NOT EXISTS used_refresh_tokens (
        jti TEXT PRIMARY KEY,
        created_at TIMESTAMP NOT NULL,
        expires_at TIMESTAMP NOT NULL
    );