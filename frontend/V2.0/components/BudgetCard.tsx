import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import IconMap from "../constants/IconMap";
import { Budget } from "../services/BudgetService"; 


interface BudgetCardProps {
  budgets: Budget[]; 
}

const BudgetCard: React.FC<BudgetCardProps> = ({ budgets }) => {
  return (
    <FlatList
      data={budgets}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const monthlyLimit = parseFloat(item.monthly_limit as string);
        const currentSpending = parseFloat(item.current_spending as string);
        const leftAmount = monthlyLimit - currentSpending;
        const overspent = leftAmount < 0;
        const progress = Math.min(currentSpending / monthlyLimit, 1);

        return (
          <View style={styles.card}>
            <View style={styles.header}>
              <MaterialCommunityIcons
                name={IconMap[item.expense_type.toLowerCase()] || "alert-circle-outline"}
                style={styles.icon}
                color="#4a4a8e"
              />
              <Text style={styles.category}>{item.expense_type}</Text>
            </View>

            <View style={styles.amountRow}>
              <Text style={styles.amount}>${currentSpending.toFixed(2)}</Text>
              <Text style={[styles.status, { color: overspent ? "#FF3D00" : "#8A8A8A" }]}>
                {overspent ? `Overspent $${Math.abs(leftAmount).toFixed(2)}` : `Left $${leftAmount.toFixed(2)}`}
              </Text>
            </View>

            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: overspent ? "#FF3D00" : "#08B80F" }]} />
            </View>
          </View>
        );
      }}
    />
  );
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
  icon: {
    fontSize: 24,
    borderRadius: 20,
    marginRight: 10,
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

export default BudgetCard;
