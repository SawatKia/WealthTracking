import React from 'react';
import { View, Text } from 'react-native';
import { VictoryPie } from 'victory-native'; // Import VictoryPie from victory-native
import { VictoryTheme } from 'victory-native'; // You can still use Victory's themes

const ReportByCategory = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>Pet Preferences</Text>
      <VictoryPie
        data={[
          { x: "Cats", y: 35 },
          { x: "Dogs", y: 40 },
          { x: "Birds", y: 55 },
        ]}
        theme={VictoryTheme.clean}  // Use the clean theme for the pie chart
        colorScale={["#FF8C00", "#FF6347", "#87CEEB"]}  // Custom colors
        labelRadius={50}  // Adjust label positioning (can be outside the pie)
        style={{
          labels: {
            fontSize: 14,
            fill: "#333",
          },
        }}
      />
    </View>
  );
};

export default ReportByCategory;
