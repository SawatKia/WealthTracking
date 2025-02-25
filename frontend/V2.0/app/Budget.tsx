import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import PieChartBudget from "../components/PieChartBudget";
import BudgetCard from "../components/BudgetCard";
import { Ionicons } from "@expo/vector-icons";
import { useBudget } from "../services/BudgetService";
import { useRouter } from "expo-router";

const Budget = () => {
  const { getBudgets } = useBudget();
  const [budgets, setBudgets] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchBudgets() {
      try {
        const data = await getBudgets();
        setBudgets(data);
      } catch (error) {
        console.error("Error fetching budgets:", error);
      }
    }

    fetchBudgets();
  }, []);

  return (
    <View style={styles.container}>

      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.push("/(tabs)")}>
          <Ionicons name="chevron-back-outline" size={25} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.title}>Budgets</Text>
      </View>

      <PieChartBudget budgets={budgets} />
      <BudgetCard budgets={budgets} />
      
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F0F6FF" },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1, 
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", 
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
    zIndex: 1, 
  },
});

export default Budget;
