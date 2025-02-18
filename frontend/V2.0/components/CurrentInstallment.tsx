import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type CurrentInstallmentProps = {
  text: string;
  amount: number;
};

const CurrentInstallment = ({ text, amount }: CurrentInstallmentProps) => (
  <View style={styles.container}>
    <Text style={styles.text}>{text}</Text>
    <Text style={styles.amount}>
      {amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    width: 170,
    height: 70,
    backgroundColor: '#B3DBFF', 
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
});

export default CurrentInstallment;
