import React from 'react';
import { View, Text } from 'react-native';
import { VictoryChart, VictoryBar } from 'victory-native'; // Import VictoryBar and VictoryChart from victory-native
import { VictoryTheme } from 'victory-native'; // You can still use Victory's themes

// Sample data for the Income/Expense chart
const sampleData = [
  { x: 'January', y: 1200 },
  { x: 'February', y: 800 },
  { x: 'March', y: 950 },
  { x: 'April', y: 1100 },
  { x: 'May', y: 1300 },
  { x: 'June', y: 1000 },
];

const IncomeExpensesReport = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>Income/Expenses Report</Text>
      <VictoryChart
        domainPadding={{ x: 20 }}  // Adds padding on the x-axis for better visibility of bars
        theme={VictoryTheme.clean}   // Use Victory's clean theme
      >
        <VictoryBar data={sampleData} />  {/* Pass the sample data to VictoryBar */}
      </VictoryChart>
    </View>
  );
};

export default IncomeExpensesReport;
