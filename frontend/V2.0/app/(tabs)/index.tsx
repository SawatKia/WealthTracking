import React from 'react';

import { StyleSheet, Button } from 'react-native';
import SummaryCard from '../../components/SummaryCard';
import IncomeSummary from '../../components/SummaryIncome';
import ExpenseSummary from '../../components/SummaryExpense';
import IncomeExpenseReport from '@/components/IncomeExpenseReport';
import ReportByCategory from '../../components/reportByCategory'

import EditScreenInfo from '@/components/EditScreenInfo';
import { View, Text } from '@/components/Themed';
import { Pressable } from 'react-native';
import { Link } from 'expo-router';

import {
  LineChart,
  BarChart,
  PieChart,
  ProgressChart,
  ContributionGraph,
  StackedBarChart
} from "react-native-chart-kit";
import { Dimensions } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <SummaryCard typeAccount='ยอดรวมทั้งหมด' balance={1000} totalAccounts={5} typeList='บัญชี' />
      <View style={styles.rowIncomeExpense}>
        <IncomeSummary amount={10000000.0} />
        <ExpenseSummary amount={1000000.0} />
        {/* <IncomeExpenseReport /> */}
        
        {/* <View>
          <Text>Bezier Line Chart</Text>

        </View> */}

      </View>
      <IncomeExpenseReport />
      <ReportByCategory />
      {/* <LineChart
        data={{
          labels: ["January", "February", "March", "April", "May", "June"],
          datasets: [
            {
              data: [
                Math.random() * 100,
                Math.random() * 100,
                Math.random() * 100,
                Math.random() * 100,
                Math.random() * 100,
                Math.random() * 100
              ]
            }
          ]
        }}
        width={Dimensions.get("window").width * 3 / 4} // from react-native
        height={180}
        yAxisLabel="$"
        yAxisSuffix="k"
        yAxisInterval={1} // optional, defaults to 1
        chartConfig={{
          backgroundColor: "#e26a00",
          backgroundGradientFrom: "#fb8c00",
          backgroundGradientTo: "#ffa726",
          decimalPlaces: 2, // optional, defaults to 2dp
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          style: {
            borderRadius: 16
          },
          propsForDots: {
            r: "6",
            strokeWidth: "2",
            stroke: "#ffa726"
          }
        }}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16
        }}
      /> */}



      {/* <Link to ="/Login">Go to Details</Link> */}
      {/* <Link href="/Login">go to login page</Link> */}

      {/* <Link href="/Login" asChild>
      <Pressable>
        <Text style={styles.temp}>go to login page</Text>
      </Pressable>
    </Link> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f0f4f8"
  },
  rowIncomeExpense: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    backgroundColor: "transparent",
  },
  // summaryContainer: {
  //   backgroundColor: '#F5F5F5',
  //   marginBottom: 10
  // },
  // title: {
  //   fontSize: 20,
  //   // color: '#7fa1ff',
  //   fontWeight: 'bold',
  // },

  temp: {
    color: '#7fa1ff',
  }
});
