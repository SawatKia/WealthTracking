-- Insert bank accounts
INSERT INTO
    bank_accounts (
        account_number,
        fi_code,
        national_id,
        display_name,
        account_name,
        balance
    )
VALUES
    -- John's accounts
    (
        '1234567890', -- Kasikorn raw numbers (format when displayed: 123-4-56789-0)
        '004',
        '1234567890123',
        'Main Account',
        'John Savings',
        50000.00
    ),
    (
        '1234567890', -- SCB raw numbers (format when displayed: 123-456789-0)
        '014',
        '1234567890123',
        'Secondary',
        'John Checking',
        25000.00
    ),
    -- Jane's accounts
    (
        '2345678901', -- Kasikorn raw numbers (format when displayed: 234-5-67890-1)
        '004',
        '2345678901234',
        'Primary',
        'Jane Savings',
        35000.00
    ),
    (
        '2345678901', -- Krungsri raw numbers (format when displayed: 234-5-67890-1)
        '025',
        '2345678901234',
        'Business',
        'Jane Business',
        75000.00
    );