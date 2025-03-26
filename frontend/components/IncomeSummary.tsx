import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTransactions } from "../services/TransactionService";

type IncomeSummaryProps = {
  text_box1: string;
  text_percent: string;
  amount?: string; // We will overwrite this value with the fetched income
};

const SummaryBox1 = ({
  text_box1,
  text_percent,
  amount,
}: IncomeSummaryProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{text_box1}</Text>
      <Text style={styles.amount}>
        {amount ? parseFloat(amount).toLocaleString() : "0"} ฿
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 170,
    height: 70,
    backgroundColor: "#B2FBA5",
    padding: 15,
    borderRadius: 10,
    margin: 5,
    alignItems: "center",
  },
  text: {
    color: "#333333",
    fontSize: 16,
    fontWeight: "bold",
  },
  amount: {
    color: "#333333",
    fontSize: 18,
    fontWeight: "semibold",
  },
  loadingText: {
    color: "gray",
    fontSize: 16,
  },
  errorText: {
    color: "red",
    fontSize: 16,
  },
});

export default SummaryBox1;
