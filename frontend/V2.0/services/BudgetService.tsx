import api from "./axiosInstance";
import { useState, useEffect } from "react";
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
  current_spending: string;
  month: string;
}

export const useBudget = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const createBudget = async (newBudget: newBudget) => {
    try {
      console.log("create");
      console.log(newBudget);
      const response = await api.post("/budgets", newBudget);
      console.log("respond create", response.status);
      if (response.status === 201) {
        router.push("/Budget");
        console.log("create budgets successfully");
      } else {
        console.log(response.status);
      }
    } catch (err) {
      setError(`Failed to create budgets. ${err}`);
      console.log(error);
    }
  };

  const getBudgets = async () => {
    try {
      const response = await api.get("/budgets");
      if (response.status === 200) {
        console.log("budget: ", response.data.data);
        return response.data.data;
      } else {
        throw new Error("Failed to fetch budgets");
      }
    } catch (err) {
      setError(`Failed to fetch budgets: ${err}`);
      return [];
    }
  };

  const updateBudget = async (
    expenseType: string,
    updatedData: { monthly_limit: string }
  ) => {
    try {
      const response = await api.patch(`/budgets/${expenseType}`, updatedData);
      if (response.status === 200) {
        console.log("Budget updated successfully");
      }
    } catch (err) {
      setError(`Failed to update budget: ${err}`);
    }
  };

  const deleteBudget = async (expenseType: string) => {
    try {
      const response = await api.delete(`/budgets/${expenseType}`);
      if (response.status === 200) {
        console.log("Budget deleted successfully");
        return true;  // Indicating success
      }
    } catch (err) {
      console.error(`Failed to delete budget: ${err}`);
      return false;  // Indicating failure
    }
  };
  

  return { createBudget, getBudgets, updateBudget, deleteBudget, error };
};
