import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import SummaryCard from '../../components/SummaryCard';
import SummaryBox1 from '../../components/SummaryBox1';
import SummaryBox2 from '../../components/SummaryBox2';
import IncomeExpenseReport from '@/components/IncomeExpenseReport';
import ReportByCategory from '../../components/reportByCategory';

import { View, Text } from '@/components/Themed';

export default function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.header}>Account</Text>
        
        <SummaryCard typeAccount="ยอดรวมทั้งหมด" balance={1000} totalAccounts={5} typeList="บัญชี" />
        
        <View style={styles.rowIncomeExpense}>
          <SummaryBox1 text_box1="Income" text_percent='' amount={10000000.0} />
          <SummaryBox2 text_box2="Expense" amount={1000000.0} />
        </View>

        <IncomeExpenseReport />
        <ReportByCategory />

        <Text style={styles.header}>Debt</Text>
        <SummaryCard typeAccount="ยอดหนี้ทั้งหมด" balance={500} totalAccounts={3} typeList="รายการ" />
        <View style={styles.rowIncomeExpense}>
          <SummaryBox1 text_box1="Paid" amount={30} text_percent='%' />
          <SummaryBox2 text_box2="This Installment" amount={1000000.0} />
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
    marginBottom: 10,
  },
  temp: {
    color: '#7fa1ff',
  }
});
