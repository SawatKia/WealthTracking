import React from 'react';
import { View, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { color } from 'react-native-elements/dist/helpers';

export default function App() {
    const data = {
        labels: ["January", "February", "March", "April", "May", "June"],
        datasets: [
          {
            data: [20, 45, 28, 80, 99, 43]
          }
        ]
      };

    const chartConfig = {
      backgroundColor: '#cf0000',
      backgroundGradientFrom: '#ffffff',
      backgroundGradientTo: '#ffffff',
      // color: (opacity = 0) => `rgba(0, 0, 0, ${opacity})`,
      labelColor: () => "#000000",
      color:() => '#4957AA',
      
      //  barPercentage: 0.5, // Adjust bar width
    
    propsForBackgroundLines: {
      stroke: "#140a0a", // Light gray for grid lines
      color:'fff'
    },
      style: {
        borderRadius: 16,
        // color:'#fff'
      }
    }
  const screenWidth = Dimensions.get('window').width;

  const graphStyle = {
    marginVertical: 8,
    ...chartConfig.style
  }

  return (
    <View>
      <BarChart
                width={screenWidth * 0.9}
                height={200}
                data={data}
                chartConfig={chartConfig}
                style={graphStyle}
                yAxisLabel="$"
                yAxisSuffix=""
                // withInnerLines={false}
                // showBarTops={false}
                // yAxisInterval={1}
                // flatColor = {true}
                verticalLabelRotation={0} // Keep labels horizontal
                withInnerLines={true} // Keep grid lines
                showBarTops={false} // No rounded tops
                fromZero={true} // Start y-axis from zero

              />
    </View>
  );
}

