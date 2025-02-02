import React from 'react';
import { View, Text } from 'react-native';
import { VictoryPie, VictoryLabel, VictoryTheme } from 'victory-native';

const ReportByCategory = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20, marginBottom: 20,marginTop: 30, alignSelf: 'flex-end' }}>Link to budget page</Text>
      <VictoryPie
        data={[
          { x: "Hobby", y: 35 },
          { x: "Game", y: 40 },
          { x: "Food", y: 55 },
          { x: "Travel", y: 20 },
          { x: "Education", y: 15 },
          { x: "Transport", y: 35 },
          { x: "Accesseries", y: 30 },
          { x: "Cosmetics", y: 40 },
          { x: "Pet", y: 50 },
        ]}
        theme={VictoryTheme.clean} 
        // colorScale={["#FF8C00", "#FF6347", "#87CEEB"]}  
        colorScale={["#4957AA", "#7F8CD9", "#9AC9F3"]}  
        // labelRadius={100}  
        // style={{
        //   labels: {
        //     fontSize: 14,
        //     fill: "#000",
        //   },
        // }}
      />
         
        

    </View>
  );
};

export default ReportByCategory;
