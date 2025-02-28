import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTransactions } from '../services/TransactionService'; 

type ExpenseSummaryProps = {
  text_box2: string;
  amount?: string; 
};

const ExpenseSummary = ({ text_box2, amount }: ExpenseSummaryProps) => {
 
  // if (loading) {
  //   return <Text style={styles.loadingText}>Loading...</Text>;  // Loading indicator
  // }

  // if (error) {
  //   return <Text style={styles.errorText}>{error}</Text>;  // Show error message
  // }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{text_box2}</Text>
      <Text style={styles.amount}>
        -{amount} ฿{/* Display fetched expense */}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 170,
    height: 70,
    backgroundColor: '#FF9997',  
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
