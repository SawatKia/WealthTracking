import React, { useState, useEffect } from "react";
import { StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import SummaryCard from '../../components/SummaryCard';
import SummaryBox1 from '../../components/IncomeSummary';
import SummaryBox2 from '../../components/ExpenseSummary';
import PercentDebt from '../../components/PercentDebt';
import CurrentInstallment from '../../components/CurrentInstallment';
import IncomeExpenseReport from '@/components/IncomeExpenseReport';
import ReportByCategory from '../../components/reportByCategory';

import { Ionicons} from "@expo/vector-icons"; 
import { View, Text } from '@/components/Themed';
import { useTransactions,MonthlySummary } from '@/services/TransactionService'; 

export default function HomeScreen() {
  const {getMonthlySummary, getSummaryExpense, getSummaryIncome,error } = useTransactions(); // Get monthlyData from the hook
  const [monthlyData, setMonthlyData] = useState<MonthlySummary[]>([]);
  useEffect(() => {
      const fetchMonthlySummary = async () => {
        try {
          const data = await getMonthlySummary();
          console.log('getMonthlySummary',data)
          setMonthlyData(data ?? []);
        }
        catch(err){
          console.log(err)
        }
      };
  
      fetchMonthlySummary();
    }, []);
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Account</Text>
          <TouchableOpacity style = {styles.summaryButton}>
            <Ionicons name="pie-chart" size={25} color="#000000" />
            <Text style = {{margin:5}}>Summary</Text>
          </TouchableOpacity>
          

        </View>
        <SummaryCard typeAccount="Total" balance={1000} totalAccounts={5} typeList="accounts" />
        
        <View style={styles.rowIncomeExpense}>
          <SummaryBox1 text_box1="Income" text_percent='' amount={getSummaryIncome()} />
          <SummaryBox2 text_box2="Expense" amount={getSummaryExpense()} />
        </View>

        <IncomeExpenseReport monthlyData ={monthlyData}/>
        <ReportByCategory />

        <Text style={styles.header}>Debt</Text>
        <SummaryCard typeAccount="Total Debt" balance={500} totalAccounts={3} typeList="items" />
        <View style={styles.rowIncomeExpense}>
          <PercentDebt text="Paid" amount={30} percent="%" />
          <CurrentInstallment text="This Installment" amount={1000000.0} />
        </View>
      </View>
    </ScrollView>

    //   {/* <Link to ="/Login">Go to Details</Link> */}
    //   {/* <Link href="/Login">go to login page</Link> */}

    //   {/* <Link href="/Login" asChild>
    //   <Pressable>
    //     <Text style={styles.temp}>go to login page</Text>
    //   </Pressable>
    // </Link> */}
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f0f4f8"
  },
  headerContainer:{
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin:10

  },
  summaryButton:{
    flexDirection: 'row',
    justifyContent:'center',
    alignItems:'center',
    backgroundColor:"#ffd358",
    paddingHorizontal:10,
    borderRadius:10

  },
  scrollContainer: {
    flexGrow: 1, // Ensure the content fills the screen height when needed
    backgroundColor: "#f0f4f8",
  },
  rowIncomeExpense: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    backgroundColor: "transparent",
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'left',
    // marginBottom: 10,
  },
  temp: {
    color: '#7fa1ff',
  }
});
