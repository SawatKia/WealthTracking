import React from 'react';
import { Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get("window").width;

const chartConfig = {
  backgroundColor: "#e26a00",
  backgroundGradientFrom: "#fb8c00",
  backgroundGradientTo: "#ffa726",
  decimalPlaces: 2, // Optional, shows decimal points in numbers
  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  style: {
    borderRadius: 16
  }
};

const data = [
  {
    name: "Food",
    amount: 10000,
    color: "#7F8CD9",
    legendFontColor: "#7F7F7F",
    legendFontSize: 15
  },
  {
    name: "Transport",
    amount: 5000,
    color: "#4957AA",
    legendFontColor: "#7F7F7F",
    legendFontSize: 15
  },
  {
    name: "Other",
    amount: 4500,
    color: "#DDDDDD",
    legendFontColor: "#7F7F7F",
    legendFontSize: 15
  },
  {
    name: "Travel",
    amount: 7500,
    color: "#ffffff",
    legendFontColor: "#7F7F7F",
    legendFontSize: 15
  },
  {
    name: "Education",
    amount: 18000,
    color: "#9AC9F3",
    legendFontColor: "#7F7F7F",
    legendFontSize: 15
  }
];

// Function to calculate the percentage of each category
const calculatePercentage = (amount: number, total: number) => {
  return ((amount / total) * 100).toFixed(1); // Rounds to 1 decimal point
};

// Total amount for percentage calculation
const totalAmount = data.reduce((sum, category) => sum + category.amount, 0);


const reportByCategory = () => {
  const updatedData = data.map((category) => ({
    ...category,
    name: `${category.name}\n${calculatePercentage(category.amount, totalAmount)}%`, // Add percentage to name
  }));

  return (
    // <PieChart
    //   data={data}
    //   width={screenWidth *3/4}
    //   height={225}
    //   chartConfig={chartConfig}
    //   accessor={"population"}
    //   backgroundColor={"transparent"}
    //   paddingLeft={"15"}
    //   center={[10, 50]}
    //   absolute
    // />
    <PieChart
        data={data}
        width={screenWidth * 0.9}
        height={220}
        // chartConfig={{
        //   backgroundColor: "transparent",
        //   backgroundGradientFrom: '#eff3ff',
        //   backgroundGradientTo: '#efefef',
        //   color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        // }}
        chartConfig={chartConfig}
        accessor="amount"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute = {false} // if True : Displays absolute numbers instead of percentages
        // withLabel={true} // Display category names and percentages
      />

  );
};

export default reportByCategory;
