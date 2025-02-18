import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTransactions } from '../services/TransactionService'; 

type IncomeSummaryProps = {
  text_box1: string;
  text_percent: string;
  amount?: number; // We will overwrite this value with the fetched income
};

const SummaryBox1 = ({ text_box1, text_percent, amount }: IncomeSummaryProps) => {
  const { getSummaryIncome } = useTransactions(); // Access the function to fetch monthly income data

  const [income, setIncome] = useState<number>(0); // State to store the fetched income
  const [loading, setLoading] = useState<boolean>(true); // To manage loading state
  const [error, setError] = useState<string | null>(null); // To manage error state

  useEffect(() => {
    // Fetch the income data when the component mounts
    const fetchIncome = async () => {
      try {
        setLoading(true);
        const data = await getSummaryIncome(1); // Get the income for the latest month
        setIncome(data); // Update the income state
      } catch (err) {
        setError('Failed to load income data');
      } finally {
        setLoading(false); // Set loading to false once the request is complete
      }
    };

    fetchIncome(); // Call the function to fetch the income
  }, [getSummaryIncome]); // Re-run this effect if the getMonthlyIncome function changes (optional)

  if (loading) {
    return <Text style={styles.loadingText}>Loading...</Text>; // Display a loading message if fetching
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>; // Display an error message if something went wrong
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{text_box1}</Text>
      <Text style={styles.amount}>
        {income.toLocaleString("en-US", { minimumFractionDigits: 2 })} {text_percent}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 170,
    height: 70,
    backgroundColor: '#B2FBA5',
    padding: 15,
    borderRadius: 10,
    margin: 5,
    alignItems: 'center',
  },
  text: {
    color: '#333333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  amount: {
    color: '#333333',
    fontSize: 18,
    fontWeight: 'semibold',
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

export default SummaryBox1;
