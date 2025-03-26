import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { VictoryPie, VictoryTheme, VictoryLabel } from "victory-native";
import { useTransactions } from "../services/TransactionService";

const ReportByCategory = () => {
  const { getMonthlyExpense, loading, error } = useTransactions();
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchMonthlyExpense = async () => {
      try {
        const data = await getMonthlyExpense();
        if (data) {
          const monthlyExpenses = data.map((expense: any) => ({
            x: expense.type,
            y: expense.totalAmount,
          }));
          setChartData(monthlyExpenses);
        }
      } catch (err) {
        console.log(err);
      }
    };

    fetchMonthlyExpense();
  }, []);

  // if (loading) {
  //   return (
  //     <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
  //       <ActivityIndicator size="large" color="#0000ff" />
  //     </View>
  //   );
  // }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 18, color: "red" }}>
          Error: {error}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", marginTop: 10 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", marginTop: 20 , marginBottom: -20 }}>
        Expenses Report
      </Text>

      {chartData.length === 0 ? (
        <View style={{ justifyContent: "center", alignItems: "center" }}>
          <VictoryPie
            data={[{ x: "No Expense", y: 1 }]}
            theme={VictoryTheme.clean}
            colorScale={["#D3D3D3"]} // Gray color for no expense
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
        </View>
      ) : (
        <VictoryPie
          data={chartData}
          theme={VictoryTheme.clean}
          labelRadius={150}
          colorScale={["#4957AA", "#7F8CD9", "#9AC9F3", "#FF8C00", "#FF6347"]}
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
      )}
    </View>
  );
};

export default ReportByCategory;