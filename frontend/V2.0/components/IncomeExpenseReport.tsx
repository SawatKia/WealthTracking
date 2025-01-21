// import React from 'react';
// import { Dimensions, View } from 'react-native';
// import { BarChart } from 'react-native-chart-kit'; 
// import { Text } from 'react-native'; // If you need to add text

// const screenWidth = Dimensions.get("window").width;

// const chartConfig = {
//   backgroundColor: "#e26a00",
//   backgroundGradientFrom: "#fb8c00",
//   backgroundGradientTo: "#ffa726",
//   decimalPlaces: 2, // Optional, shows decimal points in numbers
//   color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
//   style: {
//     borderRadius: 16
//   }
// };

// const data = {
//   labels: ["January", "February", "March", "April", "May", "June"],
//   datasets: [
//     {
//       data: [20, 45, 28, 80, 99, 43]
//     }
//   ]
// };

// const ReportByCategory = () => {
//   return (
//     <View>
//       <BarChart
//         style={{ marginVertical: 8, borderRadius: 16 }}
//         data={data}
//         width={screenWidth}
//         height={220}
//         yAxisLabel="$"
//         chartConfig={chartConfig}
//         verticalLabelRotation={30}
//       />
//     </View>
//   );
// };

// export default ReportByCategory;
