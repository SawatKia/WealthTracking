-- TABLE: api_request_limits
CREATE TABLE
    IF NOT EXISTS api_request_limits (
        service_name VARCHAR(255) NOT NULL,
        request_date DATE NOT NULL,
        request_count INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (service_name, request_date)
    );