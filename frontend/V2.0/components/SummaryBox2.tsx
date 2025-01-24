import React from 'react';
import { View, Text, StyleSheet } from 'react-native';


type ExpenseSummaryProps = {
    text_box2: string;
    amount: number;
  };
  
  const ExpenseSummary = ({ text_box2, amount }: ExpenseSummaryProps) => (
    <View style={styles.container}>
      <Text style={styles.text}>{text_box2}</Text>
      <Text style={styles.amount}>
        -{amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
      </Text>
    </View>
  );

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
  },
  amount: {
    color: '#333333',
    fontSize: 18,
    fontWeight: 'semibold',
  },
});

export default ExpenseSummary;
