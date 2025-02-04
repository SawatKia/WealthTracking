import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { VictoryPie, VictoryTheme, VictoryLabel } from "victory-native";
import { useTransactions } from "../services/TransactionService";

const ReportByCategory = () => {
  const { monthlyExpenses, loading, error } = useTransactions();
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (monthlyExpenses) {
      const data = monthlyExpenses.map((expense: any) => ({
        x: expense.type,
        y: expense.totalAmount,
      }));
      setChartData(data);
    }
  }, [monthlyExpenses]);

  // Log after state update to ensure it's up-to-date
  // useEffect(() => {
  //   console.log("Updated chart data:", chartData);
  // }, [chartData]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      {/* <Text
        style={{
          fontSize: 20,
          marginBottom: 20,
          marginTop: 30,
          alignSelf: "flex-end",
        }}
      >
        Link to budget page
      </Text> */}
      <Text style={{ fontSize: 20,fontWeight: 'bold', marginTop: 35 }}>Expenses Report</Text>
      
      <VictoryPie
        data={chartData}
        theme={VictoryTheme.clean}
        // innerRadius={68}
        labelRadius={150}
        colorScale={["#4957AA", "#7F8CD9", "#9AC9F3"]}
        // colorScale={["#FF8C00", "#FF6347", "#87CEEB"]}
        style={{
          labels: {
            fontSize: 10,
            fill: "#000",
          },
          data: {
            fillOpacity: 0.9,
            borderWidth: 20,
            borderRadius: 20,
          },
          parent: {
            backgroundColor: "transparent",
            borderRadius: 20,
            padding: 2,
          },
        }}
      />
      <VictoryLabel
        textAnchor="middle"
        style={{ fontSize: 14 }}
        x={200}
        y={200}
        text="Expense"

      />
    </View>
  );
};

export default ReportByCategory;
