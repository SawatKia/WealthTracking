import { useState, useEffect } from 'react';
import { useRouter} from "expo-router";
import api from "./axiosInstance";
interface SenderReceiver {
  fi_code: string;
  account_name: string;
  bank_name_en: string;
  bank_name_th: string;
  display_name: string;
  account_number: string;
}

interface Transaction {
  transaction_id: string;
  transaction_datetime: string;
  category: string;
  type: string;
  amount: number;
  note: string | null;
  national_id: string;
  debt_id: string | null;
  sender?: SenderReceiver;
  receiver?: SenderReceiver;
}
export interface newSenderReceiver {
  fi_code: string;
  account_number: string;
}

interface newTransaction {
  transaction_datetime: string;
  category: string;
  type: string;
  amount: number;
  note: string | null;
  debt_id: string | null;
  sender?: newSenderReceiver | null;
  receiver?: newSenderReceiver | null;
}
export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [monthlyExpenses, setMonthlyExpenses] = useState<any>(null);
  const router = useRouter()

  useEffect(() => {
    const getAllTransactions = async () => {
      try {
        const response = await api.get('/transactions');
        console.log(response.status)
        // const { data } = response;
        const data  = {  "status_code": 200,
          "message": "Retrieved 2 transactions successfully",
          "data": {
            "transactions": [
              {
                "transaction_id": "4892c134-9015-4e4e-a75b-77b662050215",
                "transaction_datetime": "2024-03-15T10:30:00.000Z",
                "category": "Expense",
                "type": "Food",
                "amount": 100,
                "note": "food hooman",
                "national_id": "1234567890123",
                "debt_id": null,
                "sender": {
                  "fi_code": "004",
                  "account_name": "JOHN DOE",
                  "bank_name_en": "KASIKORNBANK PUBLIC COMPANY LIMITED",
                  "bank_name_th": "ธนาคารกสิกรไทย จำกัด (มหาชน)",
                  "display_name": "My Savings Account",
                  "account_number": "1234567890"
                }
              },
              {
                "transaction_id": "2a8cec26-5be3-44b8-a010-eb0469289353",
                "transaction_datetime": "2024-05-15T10:30:00.000Z",
                "category": "Income",
                "type": "Refund",
                "amount": 100,
                "note": "Monthly refund",
                "national_id": "1234567890123",
                "debt_id": null,
                "receiver": {
                  "fi_code": "004",
                  "account_name": "JOHN DOE",
                  "bank_name_en": "KASIKORNBANK PUBLIC COMPANY LIMITED",
                  "bank_name_th": "ธนาคารกสิกรไทย จำกัด (มหาชน)",
                  "display_name": "My Savings Account",
                  "account_number": "1234567890"
                }
              }
            ]
          }
        }
        console.log('data gell trans', data)

        if (data.status_code === 200) {
          setTransactions(data.data.transactions);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError('Failed to load transactions data.');
      } finally {
        setLoading(false);
      }
    };

    getAllTransactions();
  }, []);

  // Function to delete a transaction
  const deleteTransaction = async (transactionId: string) => {
    try {
      const response = await api.delete(`https://api.example.com/transactions/${transactionId}`);
      if (response.status === 200) {
        setTransactions((prev) => prev.filter((t) => t.transaction_id !== transactionId));
      }
    } catch (err) {
      setError('Failed to delete transaction.');
    }
  };

  // Function to edit a transaction
  const editTransaction = async (transactionId: string, updatedTransaction: Transaction) => {
    try {
      const response = await api.put(`https://api.example.com/transactions/${transactionId}`, updatedTransaction);
      if (response.status === 200) {
        setTransactions((prev) =>
          prev.map((t) =>
            t.transaction_id === transactionId ? { ...t, ...updatedTransaction } : t
          )
        );
      }
    } catch (err) {
      setError('Failed to update transaction.');
    }
  };

  // Function to create a new transaction
  const createTransaction = async (newTransaction: newTransaction) => {
    try {
      console.log('create')
      console.log(newTransaction)
      const response = await api.post('/transactions', newTransaction);
      console.log('respond create',response.status)
      if (response.status === 201) {
        // setTransactions((prev) => [...prev, response.data.transaction]);
        router.push('/(tabs)/IncomeExpense')
        console.log('create transaction successfully')

      }
      else{
        console.log(response.status)
      }
    } catch (err) {
      setError(`Failed to create transaction. ${err}`);
      console.log(error)
    }
  };

    // Fetch monthly expense summary
    const getMonthlyExpense = async () => {
      try {
        const response = await api.get('/transactions/summary/month-expenses');
        if (response.status === 200) {
          setMonthlyExpenses(response.data.data.summary);  // Set the monthly expenses data in state
        } else {
          throw new Error('Failed to fetch monthly expenses');
        }
      } catch (err) {
        setError('Failed to fetch monthly expenses.');
      }
    };
  
    // Fetch monthly expense when component mounts
    useEffect(() => {
      getMonthlyExpense();
    }, []);

  return { transactions, loading, error, deleteTransaction, editTransaction, createTransaction, monthlyExpenses };
};
