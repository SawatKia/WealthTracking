-- Insert transactions for the last 12 months
WITH RECURSIVE months AS (
    SELECT DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months') as month
    UNION ALL
    SELECT month + INTERVAL '1 month'
    FROM months
    WHERE month < DATE_TRUNC('month', CURRENT_DATE)
),
transaction_data AS (
    SELECT 
        month + (RANDOM() * INTERVAL '28 days') as trans_datetime,
        CASE FLOOR(RANDOM() * 4)::INT
            WHEN 0 THEN 'Transfer'
            WHEN 1 THEN 'Income'
            WHEN 2 THEN 'Expense'
            WHEN 3 THEN 'debt_payment'
        END as trans_category,
        CASE FLOOR(RANDOM() * 2)::INT
            WHEN 0 THEN '1234567890123'
            WHEN 1 THEN '2345678901234'
            ELSE '1234567890123'
        END as trans_national_id
    FROM months
),
inserted_transaction AS (
    INSERT INTO transactions (
        transaction_id,
        transaction_datetime,
        category,
        type,
        amount,
        note,
        national_id,
        debt_id,
        sender_account_number,
        sender_fi_code,
        receiver_account_number,
        receiver_fi_code
    )
    SELECT
        gen_random_uuid(),
        trans_datetime,
        CASE 
            WHEN trans_category = 'debt_payment' THEN 'Expense' 
            ELSE COALESCE(trans_category, 'Expense') 
        END,
        CASE 
            WHEN trans_category = 'Transfer' THEN 'Transfer'
            WHEN trans_category = 'Income' THEN (
                CASE FLOOR(RANDOM() * 7)::INT
                    WHEN 0 THEN 'Dividend'
                    WHEN 1 THEN 'Refund'
                    WHEN 2 THEN 'Gift'
                    WHEN 3 THEN 'Revenue'
                    WHEN 4 THEN 'Business'
                    WHEN 5 THEN 'Salary'
                    WHEN 6 THEN 'Other'
                END
            )
            WHEN trans_category = 'Expense' THEN (
                CASE FLOOR(RANDOM() * 19)::INT
                    WHEN 0 THEN 'Food'
                    WHEN 1 THEN 'Transport'
                    WHEN 2 THEN 'Travel'
                    WHEN 3 THEN 'Groceries'
                    WHEN 4 THEN 'House'
                    WHEN 5 THEN 'Borrowed'
                    WHEN 6 THEN 'Cure'
                    WHEN 7 THEN 'Pet'
                    WHEN 8 THEN 'Education'
                    WHEN 9 THEN 'Clothes'
                    WHEN 10 THEN 'Cosmetics'
                    WHEN 11 THEN 'Accessories'
                    WHEN 12 THEN 'Insurance'
                    WHEN 13 THEN 'Hobby'
                    WHEN 14 THEN 'Utilities'
                    WHEN 15 THEN 'Vehicle'
                    WHEN 16 THEN 'Fee'
                    WHEN 17 THEN 'Business'
                    WHEN 18 THEN 'Game'
                END
            )
            ELSE 'debt_payment'
        END as type,
        (RANDOM() * 10000 + 100)::DECIMAL(15,2),
        'Mock transaction',
        trans_national_id,
        CASE WHEN trans_category = 'debt_payment' THEN 
            (SELECT debt_id FROM debts WHERE national_id = trans_national_id ORDER BY RANDOM() LIMIT 1)
        ELSE NULL END,
        CASE 
            WHEN trans_national_id = '1234567890123' THEN
                CASE FLOOR(RANDOM() * 2)::INT
                    WHEN 0 THEN '1234567890'  -- John's Kasikorn account
                    WHEN 1 THEN '1234567890'  -- John's SCB account
                END
            ELSE
                CASE FLOOR(RANDOM() * 2)::INT
                    WHEN 0 THEN '2345678901'  -- Jane's Kasikorn account
                    WHEN 1 THEN '2345678901'  -- Jane's Krungsri account
                END
        END as sender_account_number,
        CASE 
            WHEN trans_national_id = '1234567890123' THEN
                CASE FLOOR(RANDOM() * 2)::INT
                    WHEN 0 THEN '004'  -- Kasikorn
                    WHEN 1 THEN '014'  -- SCB
                END
            ELSE
                CASE FLOOR(RANDOM() * 2)::INT
                    WHEN 0 THEN '004'  -- Kasikorn
                    WHEN 1 THEN '025'  -- Krungsri
                END
        END as sender_fi_code,
        CASE 
            WHEN trans_national_id = '1234567890123' THEN
                CASE FLOOR(RANDOM() * 2)::INT
                    WHEN 0 THEN '1234567890'  -- John's Kasikorn account
                    WHEN 1 THEN '1234567890'  -- John's SCB account
                END
            ELSE
                CASE FLOOR(RANDOM() * 2)::INT
                    WHEN 0 THEN '2345678901'  -- Jane's Kasikorn account
                    WHEN 1 THEN '2345678901'  -- Jane's Krungsri account
                END
        END as receiver_account_number,
        CASE 
            WHEN trans_national_id = '1234567890123' THEN
                CASE FLOOR(RANDOM() * 2)::INT
                    WHEN 0 THEN '004'  -- Kasikorn
                    WHEN 1 THEN '014'  -- SCB
                END
            ELSE
                CASE FLOOR(RANDOM() * 2)::INT
                    WHEN 0 THEN '004'  -- Kasikorn
                    WHEN 1 THEN '025'  -- Krungsri
                END
        END as receiver_fi_code
    FROM transaction_data
    RETURNING transaction_id
)
-- Insert transaction relations for each transaction
INSERT INTO transaction_bank_account_relations (transaction_id, account_number, fi_code, role)
SELECT 
    t.transaction_id,
    CASE WHEN tr.category = 'Income' THEN tr.receiver_account_number
         ELSE tr.sender_account_number END,
    CASE WHEN tr.category = 'Income' THEN tr.receiver_fi_code
         ELSE tr.sender_fi_code END,
    CASE WHEN tr.category = 'Income' THEN 'receiver'
         ELSE 'sender' END
FROM inserted_transaction t
JOIN transactions tr ON t.transaction_id = tr.transaction_id; 