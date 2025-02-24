import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import PieChart from "../components/PieChartBudget";
import BudgetCard from "../components/BudgetCard"; 
import { useBudget } from "../services/BudgetService"; 

const Budget = () => {
  const { getBudgets } = useBudget();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBudgets() {
      try {
        const data = await getBudgets(); 
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
    <View style={styles.container}>
      <Text style={styles.title}>Budgets</Text>
      <PieChart spent={1280} total={5570} totalBudget={50000} />
      
      {/* Pass the fetched budgets data to BudgetCard as a prop */}
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
    marginBottom: 20,
  },
});

export default Budget;
