import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import AccountCard from "../../components/AccountCard"
import DropdownButton from "../../components/DropdownButton";
import TransactionCard from "../../components/TransactionCard";

import { GestureHandlerRootView } from 'react-native-gesture-handler';
const accounts = [
  { name: "Account A", balance: 1000000, lastUpdated: "Today, 18:00 PM" },
  { name: "Account B", balance: 500000, lastUpdated: "Yesterday, 15:00 PM" },
];

const transactions = [
  { id: 1, category: "Taxi", description: "Taxi", amount: 500, type: "Expense", date: "22 Feb 2024", time: "15:00 PM", fromAccount: "Account A", endBalance: 999500 },
  { id: 2, category: "Insurance", description: "Insurance", amount: 10000, type: "Expense", date: "22 Feb 2024", time: "18:00 PM", fromAccount: "Account A", endBalance: 989500 },
  { id: 3, category: "Taxi", description: "Taxi", amount: 500, type: "Expense", date: "22 Feb 2024", time: "15:00 PM", fromAccount: "Account A", endBalance: 999000 },
  { id: 4, category: "Taxi", description: "Taxi", amount: 500, type: "Expense", date: "22 Feb 2024", time: "15:00 PM", fromAccount: "Account A", endBalance: 998500 },
  { id: 5, category: "Salary", description: "Salary", amount: 1000, type: "Income", date: "22 Feb 2024", time: "18:00 PM", fromAccount: "Account A", endBalance: 1000500 },
];


// export default function DebtScreen() {
  export default function IncomeExpenses () {
  const [selectedType, setSelectedType] = useState<"Income" | "Expense">("Expense");
  const [currentIndex, setCurrentIndex] = useState(0);

  const filteredTransactions = transactions.filter((transaction) => transaction.type === selectedType);

  const handleSwipe = (direction: 'Left' | 'Right') => {
    if (direction === 'Left') {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % accounts.length);
    } else if (direction === 'Right') {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + accounts.length) % accounts.length);
    }
  };

  return (
    <View style={styles.container}>

      <GestureHandlerRootView style={styles.accountContainer}>
        <AccountCard
          account={accounts[currentIndex]}
          currentIndex={currentIndex}
          totalAccounts={accounts.length}
          onSwipe={handleSwipe}
        />
      </GestureHandlerRootView>
      <DropdownButton selectedType={selectedType} onSelect={setSelectedType} />
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <TransactionCard transaction={item} />}
      />
      <TouchableOpacity style={styles.floatingButton}>
        <Text style={styles.floatingButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f0f4f8" },

  accountContainer: {
    backgroundColor: '#F5F5F5',
    marginBottom: 10
  },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginVertical: 16 },
  floatingButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  floatingButtonText: { color: "#fff", fontSize: 24, fontWeight: "bold" },
});

