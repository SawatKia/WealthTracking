-- Insert some debts
INSERT INTO
    debts (
        debt_id,
        fi_code,
        national_id,
        debt_name,
        start_date,
        current_installment,
        total_installments,
        loan_principle,
        loan_balance
    )
VALUES
    (
        gen_random_uuid (),
        '004',
        '1234567890123',
        'Home Loan',
        '2023-01-01',
        6,
        60,
        1000000.00,
        900000.00
    ),
    (
        gen_random_uuid (),
        '014',
        '2345678901234',
        'Car Loan',
        '2023-03-01',
        4,
        48,
        500000.00,
        450000.00
    );