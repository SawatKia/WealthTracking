import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getBudgetData } from "../services/BudgetService"; // Import API function

interface Budget {
  id: string;
  category: string;
  budget: number;
  spent: number;
}

export default function BudgetCard() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBudgets() {
      try {
        const data = await getBudgetData(); // Fetch from API
        setBudgets(data);
      } catch (error) {
        console.error("Error fetching budgets:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchBudgets();
  }, []);

  if (loading) return <Text>Loading...</Text>;

  return (
    <FlatList
      data={budgets}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const leftAmount = item.budget - item.spent;
        const overspent = leftAmount < 0;
        const progress = Math.min(item.spent / item.budget, 1);

        return (
          <View style={styles.card}>
            {/* Category Icon and Name */}
            <View style={styles.header}>
              <MaterialCommunityIcons
                name={categoryIcons[item.category] || "help-circle-outline"}
                size={30}
                color="#4a4a8e"
              />
              <Text style={styles.category}>{item.category}</Text>
            </View>

            {/* Amount and Progress Bar */}
            <View style={styles.amountRow}>
              <Text style={styles.amount}>${item.budget.toFixed(2)}</Text>
              <Text style={[styles.status, { color: overspent ? "#FF3D00" : "#8A8A8A" }]}>
                {overspent ? `Overspent $${Math.abs(leftAmount).toFixed(2)}` : `Left $${leftAmount.toFixed(2)}`}
              </Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: overspent ? "#FF3D00" : "#08B80F" }]} />
            </View>
          </View>
        );
      }}
    />
  );
}

// Category Icons
const categoryIcons: Record<string, string> = {
  Food: "food",
  Groceries: "cart",
  Entertainment: "movie",
  Transport: "bus",
  Bills: "receipt",
  Shopping: "shopping",
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginVertical: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  category: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
    color: "#333",
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  amount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  status: {
    fontSize: 14,
    fontWeight: "bold",
  },
  progressBar: {
    height: 10,
    backgroundColor: "#E5E5E5",
    borderRadius: 5,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 5,
  },
});

