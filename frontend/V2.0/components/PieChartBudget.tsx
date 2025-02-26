import { VictoryPie, VictoryLabel } from "victory-native";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import {Budget } from "../services/BudgetService"; 

interface PieChartProps {
  budgets: Budget[]; 
}

const PieChartBudget: React.FC<PieChartProps> = ({ budgets }) => {

  const router = useRouter();

  const totalSpent = budgets.reduce(
    (sum, budget) => sum + (parseFloat(budget?.current_spending)),
    0
  );
  const totalLimit = budgets.reduce(
    (sum, budget) => sum + (parseFloat(budget?.monthly_limit)),
    0
  );

  const percentage = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0; // Calculate percentage spent
  console.log(percentage,totalLimit,totalSpent)
  const remaining = totalLimit - totalSpent

  return (
    <View style={styles.container}>
      <svg viewBox="0 0 400 230">
      <VictoryPie
        standalone={false}
        width={400}
        height={400}
        data={[
          { x: "Remaining", y: 100 - percentage },
          { x: "Spent", y: percentage },
        ]}
        innerRadius={140}
        cornerRadius={20}
        startAngle={90}
        endAngle={-90}
        padAngle={3}
        colorScale={["#E5E5E5", "#4957AA"]}
        labels={[]} 
      />
      <VictoryLabel
        textAnchor="middle"
        style={{ fontSize: 20 }}
        x={200}
        y={200}
        // text={`Total Balance\n${totalLimit}฿`}
        text={`Total Spent\n${totalSpent}฿`}
      />
      </svg>
      <TouchableOpacity
        style={styles.createBudgetButton}
        onPress={() => {
          router.push("/CreateBudget");
        }}
      >
        <Text style={{ margin: 5 }}>Create Budget</Text>
      </TouchableOpacity>
      <View style={styles.budgetInfo}>
        <View style={styles.budgetItem}>
          <Text style={styles.budgetValue}>{totalLimit}฿</Text>
          <Text style={styles.budgetLabel}>Total Budget</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.budgetItem}>
          <Text style={styles.budgetValue}>{remaining}฿</Text>
          <Text style={styles.budgetLabel}>Remaining</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  budgetInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  budgetItem: {
    alignItems: "center",
    marginHorizontal: 20,
  },
  budgetValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  budgetLabel: {
    fontSize: 12,
    color: "#888",
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: "#ccc",
    marginHorizontal: 10,
  },
  createBudgetButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffd358",
    paddingHorizontal: 10,
    borderRadius: 10,
  },
});

export default PieChartBudget;
