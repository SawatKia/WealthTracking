import { useState, useEffect } from 'react';
import { useRouter} from "expo-router";
import api from "./axiosInstance";
export interface SenderReceiver {
  fi_code: string;
  account_name: string;
  bank_name_en: string;
  bank_name_th: string;
  display_name: string;
  account_number: string;
}

export interface Transaction {
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
interface editTransaction {
  transaction_datetime: string;
  category: string;
  type: string;
  amount: number;
  note: string | null;
  debt_id: string | null;
}

export interface MonthlySummary{
  x: string,
  y: number,
}

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [monthlyData, setMonthlyData] = useState<MonthlySummary[]>([]);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const router = useRouter()

  const getAllTransactions = async () => {
    try {
      const data = await api.get('/transactions');
      console.log('data gell trans',data)
      if (data.status === 200) {
        return data.data.data.transactions;
      } else {
        setError(data.data.statusText);
      }
    } catch (err) {
      setError('Failed to load transactions data.');
    } finally {
      setLoading(false);
    }
  };
  // Function to delete a transaction
  const deleteTransaction = async (transactionId: string) => {
    try {
      const response = await api.delete(`/transactions/${transactionId}`);
      if (response.status === 200) {
        return response.status
      }
    } catch (err) {
      setError('Failed to delete transaction.');
    }
  };
  const getTransactionbyId = async (transactionId: string) => {
    try {
      const response = await api.get(`/transactions/${transactionId}`);
      if (response.status === 200) {
        return  response.data.data.transaction
      }
    } catch (err) {
      setError('Failed to update transaction.');
    }
  };
  // Function to edit a transaction
  const editTransaction = async (transactionId: string, updatedTransaction: editTransaction) => {
    try {
      const response = await api.patch(`/transactions/${transactionId}`, updatedTransaction);
      if (response.status === 200) {
        router.push('/(tabs)/IncomeExpense')
        return response.data.data
      }
    } catch (err) {
      setError('Failed to update transaction.');
    }
  };

  // Function to create a new transaction
  const createTransaction = async (newTransaction: newTransaction) => {
    try {
      console.log('create')
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

    // Fetch monthly expense summary by category
    const getMonthlyExpense = async () => {
      try {
        const response = await api.get('/transactions/summary/month-expenses');
        if (response.status === 200) {
          return (response.data.data.summary);  // Set the monthly expenses data in state
        } else {
          throw new Error('Failed to fetch monthly expenses');
        }
      } catch (err) {
        setError('Failed to fetch monthly expenses.');
      }
    };

    // Fetch monthly expense 12 month
    const getMonthlySummary = async () => {
      try {
        setLoading(true); // Start loading
        setError(null);
        const response = await api.get('/transactions/summary/monthly');
        const data = response.data;
    
        if (data?.status_code === 200) {
          const currentYear = new Date().getFullYear();

            // Filter only data from the current year
          const filteredSummary = data.data.summary.filter((item: any) => {
            const itemYear = new Date(item.month).getFullYear();
            return itemYear === currentYear;
          });

          const summary = filteredSummary.map((item: any) => ({
            x: new Date(item.month).toLocaleString('default', { month: 'short' }),
            y: item.summary.expense,
          }));
          setMonthlyData(summary); // Set the summary data for monthly expenses
          const lastItem = data.data.summary[data.data.summary.length - 1];
          if (lastItem) {
            setIncome(lastItem.summary.income);
            setExpense(lastItem.summary.expense);
          }
          return summary
        } else {
          setError('Failed to fetch monthly summary');
        }
      } catch (error) {
        setError('An error occurred while fetching monthly summary');
        console.error(error);
      }finally {
        setLoading(false); // Stop loading
      }
    };

    const getSummaryIncome = () => {
      if (loading) return 'Loading...';
      return income.toFixed(2);
    };
    
    const getSummaryExpense = () => {
      if (loading) return 'Loading...';
      return expense.toFixed(2);
    };

    const getTransactionByAccount = async (acc_num: string, ficode: string) => {
      try {
        const response = await api.get(`/transactions/account/${acc_num}/${ficode}`);
        if (response.status === 200) {
          return response.data.data.transactions; // Ensure this matches the API response structure
        } else {
          console.error("Error fetching transactions", response);
          return [];
        }
      } catch (error) {
        console.error("Error fetching transactions", error);
        return [];
      }
    };

  return { getAllTransactions, loading, error, deleteTransaction, editTransaction, createTransaction, getMonthlyExpense, monthlyData, getMonthlySummary, getSummaryIncome, getSummaryExpense, getTransactionbyId, getTransactionByAccount };
};
