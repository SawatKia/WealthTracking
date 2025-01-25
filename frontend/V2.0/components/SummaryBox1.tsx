import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type IncomeSummaryProps = {
    text_box1: string;
    text_percent: string;
    amount: number;
  };
  
  const IncomeSummary = ({ text_box1,text_percent, amount }: IncomeSummaryProps) => (
    <View style={styles.container}>
      <Text style={styles.text}>{text_box1}</Text>
      <Text style={styles.amount}>
      {amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} {text_percent}
    </Text>
    </View>
  );

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
});

export default IncomeSummary;
