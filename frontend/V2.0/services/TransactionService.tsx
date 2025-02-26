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
  // const [incomeData, setIncomeData] = useState<number>(0);
  const router = useRouter()

  // useEffect(() => {
    

  //   getAllTransactions();
  // }, []);
  const getAllTransactions = async () => {
    try {
      const response = await api.get('/transactions');
      console.log(response.status)
      const data  = response;
      // const data  = {  "status_code": 200,
      //   "message": "Retrieved 2 transactions successfully",
      //   "data": {
      //     "transactions": [
      //       {
      //         "transaction_id": "4892c134-9015-4e4e-a75b-77b662050215",
      //         "transaction_datetime": "2024-03-15T10:30:00.000Z",
      //         "category": "Expense",
      //         "type": "Food",
      //         "amount": 100,
      //         "note": "food hooman",
      //         "national_id": "1234567890123",
      //         "debt_id": null,
      //         "sender": {
      //           "fi_code": "004",
      //           "account_name": "JOHN DOE",
      //           "bank_name_en": "KASIKORNBANK PUBLIC COMPANY LIMITED",
      //           "bank_name_th": "ธนาคารกสิกรไทย จำกัด (มหาชน)",
      //           "display_name": "My Savings Account",
      //           "account_number": "1234567890"
      //         }
      //       },
      //       {
      //         "transaction_id": "2a8cec26-5be3-44b8-a010-eb0469289353",
      //         "transaction_datetime": "2024-05-15T10:30:00.000Z",
      //         "category": "Income",
      //         "type": "Refund",
      //         "amount": 100,
      //         "note": "Monthly refund",
      //         "national_id": "1234567890123",
      //         "debt_id": null,
      //         "receiver": {
      //           "fi_code": "004",
      //           "account_name": "JOHN DOE",
      //           "bank_name_en": "KASIKORNBANK PUBLIC COMPANY LIMITED",
      //           "bank_name_th": "ธนาคารกสิกรไทย จำกัด (มหาชน)",
      //           "display_name": "My Savings Account",
      //           "account_number": "1234567890"
      //         }
      //       }
      //     ]
      //   }
      // }
      // console.log( data)

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
        console.log(response.data.data.transaction)
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
  
    // Fetch monthly expense when component mounts
    // useEffect(() => {
    //   getMonthlyExpense();
    // }, []);

    // Fetch monthly expense 12 month
    const getMonthlySummary = async () => {
      try {
        setLoading(true); // Start loading
        setError(null);
        const response = await api.get('/transactions/summary/monthly');
        const data = response.data;
    
        if (data?.status_code === 200) {
          // const summary = data.data.summary.map((item: any) => {
          //   const monthShort = new Date(item.month).toLocaleString('default', { month: 'short' });
          //   console.log(monthShort,item.summary.income,item.summary.expense);
          //   return {
          //     x: monthShort,
          //     y: item.summary.expense, // Change to `expense` or `balance` as needed
          //   };

          // });
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


          console.log(summary);
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
    
    // const getSummaryExpense = async (): Promise<number> => {
    //   try {
    //     const response = await api.get('/transactions/summary/monthly');
    //     if (response.status === 200 && response.data && response.data.data) {
    //       return response.data.data.summary.expense || 0; // Access the expense data in the response
    //     } else {
    //       throw new Error('Failed to retrieve expense data');
    //     }
    //   } catch (error) {
    //     console.error('Error fetching monthly expense:', error);
    //     throw error;  // Re-throw the error so the component can handle it
    //   }
    // };    

    const getTransactionByAccount = async (acc_num: string, ficode: string) => {
      try {
        const response = await api.get(`/transactions/account/${acc_num}/${ficode}`);
        if (response.status === 200) {
          return response.data.data.transactions; // Returning the transactions array
        } else {
          console.error("Error fetching transactions", response);
          return [];
        }
      } catch (error) {
        console.error("Error fetching transactions", error);
        return [];
      }
    }

  return { getAllTransactions, loading, error, deleteTransaction, editTransaction, createTransaction, getMonthlyExpense, monthlyData, getMonthlySummary, getSummaryIncome, getSummaryExpense, getTransactionbyId, getTransactionByAccount };
};
