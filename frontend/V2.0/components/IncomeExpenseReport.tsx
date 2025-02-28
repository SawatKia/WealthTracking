// IncomeExpensesReport.tsx
import React, { useState, useEffect } from "react";
import { View, Text } from "react-native";
import { VictoryChart, VictoryBar, VictoryLine } from "victory-native";
import { VictoryTheme } from "victory-native";
import {
  useTransactions,
  MonthlySummary,
} from "../services/TransactionService"; // Import the service

const IncomeExpensesReport = ({
  monthlyData,
}: {
  monthlyData: MonthlySummary[];
}) => {
  // If there is an error, show the error message

  // Calculate the average y value for the line chart
  const averageY =
    monthlyData.reduce((sum, item) => sum + item.y, 0) / monthlyData.length ||
    0;
  console.log("monthlyData:", monthlyData);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", marginTop: 35 }}>
        Income/Expenses Report
      </Text>
      <VictoryChart domainPadding={{ x: 30 }} theme={customTheme}>
        <VictoryBar data={monthlyData} barWidth={20} // Set a fixed bar width
          alignment="middle" />
        <VictoryLine
          data={monthlyData.map((item) => ({
            x: item.x,
            y: averageY,
          }))}
          
          style={{
            data: {
              stroke: "red",
              strokeWidth: 2,
              strokeOpacity: 0.6,
              strokeDasharray: "5,5",
            },
          }}
        />
      </VictoryChart>
    </View>
  );
};
const customTheme = {
  axis: {
    style: {
      grid: { stroke: "none" },
      axis: {
        stroke: "#333",
        strokeWidth: 2,
      },
      ticks: {
        stroke: "#555",
        size: 5,
      },
      tickLabels: {
        fill: "#222",
        fontSize: 12,
        padding: 5,
      },
    },
  },
  bar: {
    style: {
      data: {
        fill: "#4957AA",
        width: 15,
      },
    },
  },
};
export default IncomeExpensesReport;
