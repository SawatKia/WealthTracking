-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS after_transaction_change ON transactions;
DROP TRIGGER IF EXISTS after_debt_payment ON transactions;
DROP TRIGGER IF EXISTS before_transaction_change ON transactions;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS update_bank_account_balance();
DROP FUNCTION IF EXISTS update_debt_payment();
DROP FUNCTION IF EXISTS manage_transaction_relations();

-- Function to handle bank account balance updates
CREATE OR REPLACE FUNCTION update_bank_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- For new transactions
    IF TG_OP = 'INSERT' THEN
        -- Handle different transaction types
        CASE NEW.type
            WHEN 'transfer' THEN
                -- Update sender account (deduct)
                UPDATE bank_accounts 
                SET balance = balance - NEW.amount
                WHERE (account_number, fi_code) IN (
                    SELECT account_number, fi_code 
                    FROM transaction_bank_account_relations 
                    WHERE transaction_id = NEW.transaction_id AND role = 'sender'
                );
                
                -- Update receiver account (add)
                UPDATE bank_accounts 
                SET balance = balance + NEW.amount
                WHERE (account_number, fi_code) IN (
                    SELECT account_number, fi_code 
                    FROM transaction_bank_account_relations 
                    WHERE transaction_id = NEW.transaction_id AND role = 'receiver'
                );
                
            WHEN 'income' THEN
                -- Add to account balance
                UPDATE bank_accounts 
                SET balance = balance + NEW.amount
                WHERE (account_number, fi_code) IN (
                    SELECT account_number, fi_code 
                    FROM transaction_bank_account_relations 
                    WHERE transaction_id = NEW.transaction_id
                );
                
            WHEN 'expense' THEN
                -- Deduct from account balance
                UPDATE bank_accounts 
                SET balance = balance - NEW.amount
                WHERE (account_number, fi_code) IN (
                    SELECT account_number, fi_code 
                    FROM transaction_bank_account_relations 
                    WHERE transaction_id = NEW.transaction_id
                );
        END CASE;

    -- For updated transactions
    ELSIF TG_OP = 'UPDATE' THEN
        -- Reverse old transaction
        CASE OLD.type
            WHEN 'transfer' THEN
                -- Reverse sender account
                UPDATE bank_accounts 
                SET balance = balance + OLD.amount
                WHERE (account_number, fi_code) IN (
                    SELECT account_number, fi_code 
                    FROM transaction_bank_account_relations 
                    WHERE transaction_id = OLD.transaction_id AND role = 'sender'
                );
                
                -- Reverse receiver account
                UPDATE bank_accounts 
                SET balance = balance - OLD.amount
                WHERE (account_number, fi_code) IN (
                    SELECT account_number, fi_code 
                    FROM transaction_bank_account_relations 
                    WHERE transaction_id = OLD.transaction_id AND role = 'receiver'
                );
                
            WHEN 'income' THEN
                UPDATE bank_accounts 
                SET balance = balance - OLD.amount
                WHERE (account_number, fi_code) IN (
                    SELECT account_number, fi_code 
                    FROM transaction_bank_account_relations 
                    WHERE transaction_id = OLD.transaction_id
                );
                
            WHEN 'expense' THEN
                UPDATE bank_accounts 
                SET balance = balance + OLD.amount
                WHERE (account_number, fi_code) IN (
                    SELECT account_number, fi_code 
                    FROM transaction_bank_account_relations 
                    WHERE transaction_id = OLD.transaction_id
                );
        END CASE;

        -- Apply new transaction
        CASE NEW.type
            WHEN 'transfer' THEN
                UPDATE bank_accounts 
                SET balance = balance - NEW.amount
                WHERE (account_number, fi_code) IN (
                    SELECT account_number, fi_code 
                    FROM transaction_bank_account_relations 
                    WHERE transaction_id = NEW.transaction_id AND role = 'sender'
                );
                
                UPDATE bank_accounts 
                SET balance = balance + NEW.amount
                WHERE (account_number, fi_code) IN (
                    SELECT account_number, fi_code 
                    FROM transaction_bank_account_relations 
                    WHERE transaction_id = NEW.transaction_id AND role = 'receiver'
                );
                
            WHEN 'income' THEN
                UPDATE bank_accounts 
                SET balance = balance + NEW.amount
                WHERE (account_number, fi_code) IN (
                    SELECT account_number, fi_code 
                    FROM transaction_bank_account_relations 
                    WHERE transaction_id = NEW.transaction_id
                );
                
            WHEN 'expense' THEN
                UPDATE bank_accounts 
                SET balance = balance - NEW.amount
                WHERE (account_number, fi_code) IN (
                    SELECT account_number, fi_code 
                    FROM transaction_bank_account_relations 
                    WHERE transaction_id = NEW.transaction_id
                );
        END CASE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle debt updates
CREATE OR REPLACE FUNCTION update_debt_payment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.category = 'debt_payment' AND NEW.debt_number IS NOT NULL THEN
        -- Update debt balance and increment installment
        UPDATE debts
        SET loan_balance = loan_balance - NEW.amount,
            current_installment = current_installment + 1
        WHERE debt_number = NEW.debt_number;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle transaction_bank_account_relations creation/updates
CREATE OR REPLACE FUNCTION manage_transaction_relations()
RETURNS TRIGGER AS $$
BEGIN
    -- For updates where sender/receiver are swapped in a transfer
    IF TG_OP = 'UPDATE' AND NEW.type = 'transfer' AND OLD.type = 'transfer' THEN
        -- If the sender account became the receiver account
        IF NEW.receiver_account_number = (
            SELECT account_number 
            FROM transaction_bank_account_relations 
            WHERE transaction_id = OLD.transaction_id 
            AND role = 'sender'
        ) THEN
            -- Update the roles
            UPDATE transaction_bank_account_relations
            SET role = CASE 
                    WHEN role = 'sender' THEN 'receiver'
                    WHEN role = 'receiver' THEN 'sender'
                END
            WHERE transaction_id = NEW.transaction_id;
            
            RETURN NEW;
        END IF;
    END IF;

    -- Handle normal inserts and other types of updates
    CASE NEW.type
        WHEN 'transfer' THEN
            -- For transfers, we need both sender and receiver accounts
            -- First, handle the sender account
            INSERT INTO transaction_bank_account_relations (
                transaction_id, 
                account_number, 
                fi_code, 
                role
            )
            SELECT 
                NEW.transaction_id,
                ba.account_number,
                ba.fi_code,
                'sender'
            FROM bank_accounts ba
            WHERE ba.national_id = NEW.national_id 
            AND ba.fi_code = NEW.sender_fi_code
            LIMIT 1
            ON CONFLICT (transaction_id, account_number, fi_code) 
            DO UPDATE SET role = 'sender';

            -- Then, handle the receiver account
            INSERT INTO transaction_bank_account_relations (
                transaction_id, 
                account_number, 
                fi_code, 
                role
            )
            VALUES (
                NEW.transaction_id,
                NEW.receiver_account_number,
                NEW.receiver_fi_code,
                'receiver'
            )
            ON CONFLICT (transaction_id, account_number, fi_code) 
            DO UPDATE SET role = 'receiver';

        WHEN 'income', 'expense' THEN
            -- For income and expense, we only need one account
            INSERT INTO transaction_bank_account_relations (
                transaction_id, 
                account_number, 
                fi_code, 
                role
            )
            SELECT 
                NEW.transaction_id,
                ba.account_number,
                ba.fi_code,
                CASE 
                    WHEN NEW.type = 'income' THEN 'receiver'
                    ELSE 'sender'
                END
            FROM bank_accounts ba
            WHERE ba.national_id = NEW.national_id 
            AND ba.fi_code = NEW.sender_fi_code
            LIMIT 1
            ON CONFLICT (transaction_id, account_number, fi_code) 
            DO UPDATE SET role = CASE 
                WHEN NEW.type = 'income' THEN 'receiver'
                ELSE 'sender'
            END;
    END CASE;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER after_transaction_change
AFTER INSERT OR UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_bank_account_balance();

CREATE TRIGGER after_debt_payment
AFTER INSERT OR UPDATE ON transactions
FOR EACH ROW
WHEN (NEW.category = 'debt_payment')
EXECUTE FUNCTION update_debt_payment();

CREATE TRIGGER before_transaction_change
BEFORE INSERT OR UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION manage_transaction_relations(); 