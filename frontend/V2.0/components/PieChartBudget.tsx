import React from "react";
import { VictoryPie, VictoryLabel } from "victory-native";
import { View, Text, StyleSheet } from "react-native";

interface PieChartProps {
  spent: number;
  total: number;
  totalBudget: number;
}

const PieChartBudget: React.FC<PieChartProps> = ({ spent, total, totalBudget }) => {
  const percentage = total > 0 ? (spent / total) * 100 : 0;

  return (
    <View style={styles.container}>
      <svg viewBox="0 0 400 300">
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
          colorScale={["#E5E5E5", "#6C4AB6"]} 
          labels={[]} // Remove the labels for each section
        />
        <VictoryLabel
          textAnchor="middle"
          style={{ fontSize: 20 }}
          x={200}
          y={200}
          text={`Total Balance\n$${total}`}
        />
      </svg>
      <View style={styles.budgetInfo}>
        <View style={styles.budgetItem}>
          <Text style={styles.budgetValue}>${totalBudget}k</Text>
          <Text style={styles.budgetLabel}>Total Budget</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.budgetItem}>
          <Text style={styles.budgetValue}>${spent}k</Text>
          <Text style={styles.budgetLabel}>Total Spent</Text>
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
});

export default PieChartBudget;
