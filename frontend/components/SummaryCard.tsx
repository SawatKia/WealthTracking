import React from "react";
import { View, Text, StyleSheet } from "react-native";

type SummaryCardProps = {
  typeAccount: string;
  balance: number;
  totalAccounts: number;
  typeList: string;
};

export default function SummaryAccountCard({
  typeAccount,
  balance,
  totalAccounts,
  typeList,
}: SummaryCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.typeAccount}>{typeAccount}</Text>
      <Text style={styles.balance}>
        {balance.toLocaleString("en-US", { minimumFractionDigits: 2 })} ฿
      </Text>
      <Text style={styles.totalAccounts}>{`${totalAccounts} ${typeList}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    backgroundColor: "#4957AA",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    marginBottom: 10,
  },
  typeAccount: {
    fontSize: 20,
    color: "#FFFFFF",
    marginBottom: 8,
    fontWeight: "semibold",
  },
  balance: {
    fontSize: 40,
    color: "#FFFFFF",
    fontWeight: "bold",
    marginBottom: 4,
    textAlign: "right",
  },
  totalAccounts: {
    fontSize: 20,
    color: "#FFFFFF",
    fontWeight: "regular",
    textAlign: "right",
  },
});
