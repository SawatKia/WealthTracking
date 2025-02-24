import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import PieChart from "../components/PieChartBudget";
import CategoryBudgetCard from "../components/CategoryBudgetCard";

const categories = [
  { id: "1", category: "Food", amount: 500, left: 125, overspent: null },
  { id: "2", category: "Groceries", amount: 300, left: 0, overspent: 800 },
];

const Budget = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Budgets</Text>
      <PieChart spent={1280} total={5570} totalBudget={50000} />
      <FlatList style={styles.category}
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CategoryBudgetCard {...item} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F0F6FF" },
  title: { fontSize: 20, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  category: {
    marginTop: 10,
  }
});

export default Budget;
