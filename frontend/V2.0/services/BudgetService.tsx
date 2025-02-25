import api from "./axiosInstance";
import { useState, useEffect } from 'react';
import { useRouter } from "expo-router";
import CreateBudget from "@/app/CreateBudget";

interface newBudget {
  expense_type: string;
  monthly_limit: string;
}
export interface Budget {
  id: string;
  expense_type: string;
  monthly_limit: string;
  current_spending: string ;
  month: string;
}

export const useBudget =  () => {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null);

    const createBudget = async (newBudget: newBudget) => {
        try {
          console.log('create')
          console.log(newBudget)
          const response = await api.post('/budgets', newBudget);
          console.log('respond create',response.status)
          if (response.status === 201) {
            router.push('/Budget')
            console.log('create budgets successfully')
    
          }
          else{
            console.log(response.status)
          }
        } catch (err) {
          setError(`Failed to create budgets. ${err}`);
          console.log(error)
        }
      };

      const getBudgets = async () => {
        try {
          const response = await api.get('/budgets');
          if (response.status === 200) {
            console.log('budget: ',response.data.data)
            return response.data.data; 
          } else {
            throw new Error('Failed to fetch budgets');
          }
        } catch (err) {
          setError(`Failed to fetch budgets: ${err}`);
          return [];
        }
      };
    
    return { createBudget, getBudgets, error };
};