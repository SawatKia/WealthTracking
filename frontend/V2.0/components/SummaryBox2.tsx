// components/SummaryBox2.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTransactions } from '../services/TransactionService'; // Import the hook to access the new function

type ExpenseSummaryProps = {
  text_box2: string;
  amount?: number;  // Optional amount prop, we'll use the fetched value
};

const ExpenseSummary = ({ text_box2, amount }: ExpenseSummaryProps) => {
  const { getSummaryExpense } = useTransactions(); // Access the new function to fetch monthly expense
  const [expense, setExpense] = useState<number>(0);  // State to store the fetched expense
  const [loading, setLoading] = useState<boolean>(true);  // Loading state for the request
  const [error, setError] = useState<string | null>(null);  // Error state

  useEffect(() => {
    // Fetch the monthly expense data when the component mounts
    const fetchExpense = async () => {
      try {
        setLoading(true);
        const data = await getSummaryExpense();  // Call the new function to get expense data
        setExpense(data);  // Set the expense state
      } catch (err) {
        setError('Failed to load expense data');  // Set error message
      } finally {
        setLoading(false);  // Stop loading
      }
    };

    fetchExpense();  // Execute the fetch function
  }, [getSummaryExpense]);  // Dependency array to ensure it runs on mount

  if (loading) {
    return <Text style={styles.loadingText}>Loading...</Text>;  // Loading indicator
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;  // Show error message
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{text_box2}</Text>
      <Text style={styles.amount}>
        -{expense.toLocaleString("en-US", { minimumFractionDigits: 2 })} {/* Display fetched expense */}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 170,
    height: 70,
    backgroundColor: '#FF9997',  // Red background to represent expense
    padding: 15,
    borderRadius: 10,
    margin: 5,
    alignItems: 'center',
  },
  text: {
    color: '#333333',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  amount: {
    color: '#333333',
    fontSize: 18,
    fontWeight: 'semibold',
    textAlign: 'right',
  },
  loadingText: {
    color: 'gray',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
});

export default ExpenseSummary;
