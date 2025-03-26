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
    // Calculate the average y value for the line chart
    const averageY =
      monthlyData.reduce((sum, item) => sum + item.y, 0) / monthlyData.length ||
      0;

    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ flex: 1, justifyContent: "flex-start",alignItems: "flex-start", fontSize: 20, fontWeight: "bold", marginTop: 20 }}>
          Expense Summary
        </Text>
        <VictoryChart animate={{ duration: 500 }} domainPadding={{ x: 30 }} theme={customTheme}>
        <VictoryBar
          data={monthlyData}
          barWidth={20} // Set a fixed bar width
          alignment="middle"
          animate={{
            onEnter: {
              duration: 500,
              before: (datum) => ({
                _y: 0, // Animate the bar from the bottom (y=0)
              }),
              after: (datum) => ({
                _y: datum.y, // Set the final y value after the animation ends
              }),
            },
          }}
          />
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