-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS after_transaction_change ON transactions;
DROP TRIGGER IF EXISTS after_debt_payment ON transactions;
DROP TRIGGER IF EXISTS before_transaction_change ON transactions;
DROP TRIGGER IF EXISTS after_transaction_relations ON transactions;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS update_bank_account_balance();
DROP FUNCTION IF EXISTS update_debt_payment();
DROP FUNCTION IF EXISTS manage_transaction_relations();

-- Function to handle bank account balance updates
CREATE OR REPLACE FUNCTION update_bank_account_balance()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
DECLARE
    sender_balance DECIMAL;
    receiver_balance DECIMAL;
BEGIN
    -- For new transactions
    IF TG_OP = 'INSERT' THEN
        -- Handle different transaction categories
        CASE NEW.category
            WHEN 'Transfer' THEN
                -- Check sender balance first
                SELECT balance INTO sender_balance
                FROM bank_accounts
                WHERE (account_number, fi_code) = (NEW.sender_account_number, NEW.sender_fi_code);

                IF sender_balance < NEW.amount THEN
                    RAISE EXCEPTION 'Insufficient balance in sender account. Available: %, Required: %', sender_balance, NEW.amount;
                END IF;

                -- Update sender account (deduct)
                UPDATE bank_accounts 
                SET balance = balance - NEW.amount
                WHERE (account_number, fi_code) = (NEW.sender_account_number, NEW.sender_fi_code);
                
                -- Update receiver account (add)
                UPDATE bank_accounts 
                SET balance = balance + NEW.amount
                WHERE (account_number, fi_code) = (NEW.receiver_account_number, NEW.receiver_fi_code);
                
            WHEN 'Income' THEN
                -- Add to account balance (no balance check needed for income)
                UPDATE bank_accounts 
                SET balance = balance + NEW.amount
                WHERE (account_number, fi_code) = (NEW.receiver_account_number, NEW.receiver_fi_code);
                
            WHEN 'Expense' THEN
                -- Check balance first
                SELECT balance INTO sender_balance
                FROM bank_accounts
                WHERE (account_number, fi_code) = (NEW.sender_account_number, NEW.sender_fi_code);

                IF sender_balance < NEW.amount THEN
                    RAISE EXCEPTION 'Insufficient balance for expense. Available: %, Required: %', sender_balance, NEW.amount;
                END IF;

                -- Deduct from account balance
                UPDATE bank_accounts 
                SET balance = balance - NEW.amount
                WHERE (account_number, fi_code) = (NEW.sender_account_number, NEW.sender_fi_code);
        END CASE;

    -- For updated transactions
    ELSIF TG_OP = 'UPDATE' THEN
        -- For updates, we need to check if the new amount is covered by the balance
        -- after reversing the old transaction
        
        -- Reverse old transaction first
        CASE OLD.category
            WHEN 'Transfer' THEN
                -- Reverse sender account
                UPDATE bank_accounts 
                SET balance = balance + OLD.amount
                WHERE (account_number, fi_code) = (OLD.sender_account_number, OLD.sender_fi_code);
                
                -- Reverse receiver account
                UPDATE bank_accounts 
                SET balance = balance - OLD.amount
                WHERE (account_number, fi_code) = (OLD.receiver_account_number, OLD.receiver_fi_code);
                
            WHEN 'Income' THEN
                UPDATE bank_accounts 
                SET balance = balance - OLD.amount
                WHERE (account_number, fi_code) = (OLD.receiver_account_number, OLD.receiver_fi_code);
                
            WHEN 'Expense' THEN
                UPDATE bank_accounts 
                SET balance = balance + OLD.amount
                WHERE (account_number, fi_code) = (OLD.sender_account_number, OLD.sender_fi_code);
        END CASE;

        -- Now check and apply new transaction
        CASE NEW.category
            WHEN 'Transfer' THEN
                -- Check sender balance after reversal
                SELECT balance INTO sender_balance
                FROM bank_accounts
                WHERE (account_number, fi_code) = (NEW.sender_account_number, NEW.sender_fi_code);

                IF sender_balance < NEW.amount THEN
                    RAISE EXCEPTION 'Insufficient balance for updated transfer. Available: %, Required: %', sender_balance, NEW.amount;
                END IF;

                UPDATE bank_accounts 
                SET balance = balance - NEW.amount
                WHERE (account_number, fi_code) = (NEW.sender_account_number, NEW.sender_fi_code);
                
                UPDATE bank_accounts 
                SET balance = balance + NEW.amount
                WHERE (account_number, fi_code) = (NEW.receiver_account_number, NEW.receiver_fi_code);
                
            WHEN 'Income' THEN
                -- No balance check needed for income
                UPDATE bank_accounts 
                SET balance = balance + NEW.amount
                WHERE (account_number, fi_code) = (NEW.receiver_account_number, NEW.receiver_fi_code);
                
            WHEN 'Expense' THEN
                -- Check balance after reversal
                SELECT balance INTO sender_balance
                FROM bank_accounts
                WHERE (account_number, fi_code) = (NEW.sender_account_number, NEW.sender_fi_code);

                IF sender_balance < NEW.amount THEN
                    RAISE EXCEPTION 'Insufficient balance for updated expense. Available: %, Required: %', sender_balance, NEW.amount;
                END IF;

                UPDATE bank_accounts 
                SET balance = balance - NEW.amount
                WHERE (account_number, fi_code) = (NEW.sender_account_number, NEW.sender_fi_code);
        END CASE;

    -- For deleted transactions
    ELSIF TG_OP = 'DELETE' THEN
        -- No balance checks needed for deletions as they only add money back
        CASE OLD.category
            WHEN 'Transfer' THEN
                -- Return money to sender account
                UPDATE bank_accounts 
                SET balance = balance + OLD.amount
                WHERE (account_number, fi_code) = (OLD.sender_account_number, OLD.sender_fi_code);
                
                -- Deduct money from receiver account
                UPDATE bank_accounts 
                SET balance = balance - OLD.amount
                WHERE (account_number, fi_code) = (OLD.receiver_account_number, OLD.receiver_fi_code);
                
            WHEN 'Income' THEN
                -- Deduct money from receiver account
                UPDATE bank_accounts 
                SET balance = balance - OLD.amount
                WHERE (account_number, fi_code) = (OLD.receiver_account_number, OLD.receiver_fi_code);
                
            WHEN 'Expense' THEN
                -- Return money to sender account
                UPDATE bank_accounts 
                SET balance = balance + OLD.amount
                WHERE (account_number, fi_code) = (OLD.sender_account_number, OLD.sender_fi_code);
        END CASE;
    END IF;
    
    RETURN OLD;
END;
$$;

-- Function to handle debt updates
CREATE OR REPLACE FUNCTION update_debt_payment()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
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
$$;

-- Function to handle transaction_bank_account_relations creation/updates
CREATE OR REPLACE FUNCTION manage_transaction_relations()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    -- For updates where sender/receiver are swapped in a transfer
    IF TG_OP = 'UPDATE' AND NEW.category = 'Transfer' AND OLD.category = 'Transfer' THEN
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
    CASE NEW.category
        WHEN 'Transfer' THEN
            -- For transfers, we need both sender and receiver accounts
            INSERT INTO transaction_bank_account_relations (
                transaction_id, 
                account_number, 
                fi_code, 
                role
            )
            VALUES 
            -- Sender
            (
                NEW.transaction_id,
                NEW.sender_account_number,
                NEW.sender_fi_code,
                'sender'
            ),
            -- Receiver
            (
                NEW.transaction_id,
                NEW.receiver_account_number,
                NEW.receiver_fi_code,
                'receiver'
            )
            ON CONFLICT (transaction_id, account_number, fi_code) 
            DO UPDATE SET role = EXCLUDED.role;

        WHEN 'Income' THEN
            -- For income, we only need receiver account
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

        WHEN 'Expense' THEN
            -- For expense, we only need sender account
            INSERT INTO transaction_bank_account_relations (
                transaction_id, 
                account_number, 
                fi_code, 
                role
            )
            VALUES (
                NEW.transaction_id,
                NEW.sender_account_number,
                NEW.sender_fi_code,
                'sender'
            )
            ON CONFLICT (transaction_id, account_number, fi_code) 
            DO UPDATE SET role = 'sender';
    END CASE;

    RETURN NEW;
END;
$$;

-- Create triggers in the correct order
CREATE TRIGGER after_transaction_relations
AFTER INSERT OR UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION manage_transaction_relations();

CREATE TRIGGER after_transaction_change
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_bank_account_balance();

CREATE TRIGGER after_debt_payment
AFTER INSERT OR UPDATE ON transactions
FOR EACH ROW
WHEN (NEW.category = 'debt_payment')
EXECUTE FUNCTION update_debt_payment(); 