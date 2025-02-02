import React from 'react';
import { View, Text } from 'react-native';
import { VictoryChart, VictoryBar } from 'victory-native'; 
import { VictoryTheme, VictoryLine } from 'victory-native'; 

const sampleData = [
  { x: 'Jan', y: 1200 },
  { x: 'Feb', y: 800 },
  { x: 'Mar', y: 950 },
  { x: 'Apr', y: 1100 },
  { x: 'May', y: 1300 },
  { x: 'Jun', y: 1000 },
  { x: 'Jul', y: 1100 },
  { x: 'Aug', y: 900 },
  { x: 'Sep', y: 1500 },
  { x: 'Oct', y: 1100 },
  { x: 'Nov', y: 1200 },
  { x: 'Dec', y: 1300 },
];


const IncomeExpensesReport = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20,fontWeight: 'bold', marginTop: 35 }}>Income/Expenses Report</Text>
      <VictoryChart
        domainPadding={{ x: 10 }}  
        theme={customTheme}
      >
        <VictoryBar data={sampleData} />  {/* Pass the sample data to VictoryBar */}
      <VictoryLine
    style={{
      data: {
        stroke: "blue",
        strokeWidth: 3,
      },
    }}
    y={(d) => d.x}
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
        fill: "#7F8CD9",
        width: 15,
      },
    },
  },
};

export default IncomeExpensesReport;
