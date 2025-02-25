// IncomeExpensesReport.tsx
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { VictoryChart, VictoryBar, VictoryLine } from 'victory-native';
import { VictoryTheme } from 'victory-native';
import { useTransactions,MonthlySummary } from '../services/TransactionService'; // Import the service

const IncomeExpensesReport = ({ monthlyData }: { monthlyData: MonthlySummary[] }) => {

  // If there is an error, show the error message

  // Calculate the average y value for the line chart
  const averageY = monthlyData.reduce((sum, item) => sum + item.y, 0) / monthlyData.length || 0;
  console.log('monthlyData:',monthlyData)

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 35 }}>Income/Expenses Report</Text>
      <VictoryChart domainPadding={{ x: 10 }} theme={VictoryTheme.clean}>
        <VictoryBar data={monthlyData} />
        <VictoryLine
          data={monthlyData.map(item => ({
            x: item.x,
            y: averageY,
          }))}
          style={{
            data: {
              stroke: 'red',
              strokeWidth: 2,
              strokeOpacity: 0.6,
              strokeDasharray: '5,5',
            },
          }}
        />
      </VictoryChart>
    </View>
  );
};

export default IncomeExpensesReport;
