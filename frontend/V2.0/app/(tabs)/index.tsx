import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import SummaryCard from "../../components/SummaryCard";
import SummaryBox1 from "../../components/IncomeSummary";
import SummaryBox2 from "../../components/ExpenseSummary";
import PercentDebt from "../../components/PercentDebt";
import CurrentInstallment from "../../components/CurrentInstallment";
import IncomeExpenseReport from "@/components/IncomeExpenseReport";
import ReportByCategory from "../../components/PieChartExpense";

import { Ionicons } from "@expo/vector-icons";
import { View, Text } from "@/components/Themed";
import { useTransactions, MonthlySummary } from "@/services/TransactionService";
import { Account, useAccount } from "@/services/AccountService"; 
import { useRouter, useFocusEffect } from "expo-router";

export default function HomeScreen() {
  const { getMonthlySummary, getSummaryExpense, getSummaryIncome, error } =
    useTransactions(); // Get monthlyData from the hook
  const [monthlyData, setMonthlyData] = useState<MonthlySummary[]>([]);
  const { getAllAccounts } = useAccount();
  const [bankAccounts, setBankAccounts] = useState<Account[]>([]); 
  const router = useRouter();
  
  useEffect(() => {
    const fetchMonthlySummary = async () => {
      try {
        const data = await getMonthlySummary();
        console.log("getMonthlySummary", data);
        setMonthlyData(data ?? []);
      } catch (err) {
        console.log(err);
      }
    };
    fetchMonthlySummary();
  }, []);
  
  useFocusEffect(
        useCallback(() => {
          const fetchData = async () => {
            const accounts = await getAllAccounts();
            console.log("Fetched Accounts:", accounts);
            setBankAccounts(accounts);
            console.log('bankAccounts.length:', bankAccounts.length)
          };
          
          fetchData();
        }, []), 
      );
      
      const totalBalance = bankAccounts.reduce((total, account) => total + parseFloat(account.balance), 0);
      console.log('totalBalance:', totalBalance)

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Account</Text>
          <TouchableOpacity
            style={styles.summaryButton}
            onPress={() => {
              router.push("/Budget");
            }}
          >
            <Ionicons name="pie-chart" size={25} color="#000000" />
            <Text style={{ margin: 5 }}>Summary</Text>
          </TouchableOpacity>
        </View>
         {bankAccounts.length > 0 ? (
                   <SummaryCard 
                   typeAccount="Total"
                   balance={totalBalance}
                   totalAccounts={bankAccounts.length}
                   typeList="accounts"
                 />
                ) : (
                  <Text>Loading...</Text>
                )}

        <View style={styles.rowIncomeExpense}>
          <SummaryBox1
            text_box1="Income"
            text_percent=""
            amount={getSummaryIncome()}
          />
          <SummaryBox2 text_box2="Expense" amount={getSummaryExpense()} />
        </View>

        <IncomeExpenseReport monthlyData={monthlyData} />
        <ReportByCategory />

        <Text style={styles.header}>Debt</Text>
        <SummaryCard
          typeAccount="Total Debt"
          balance={500}
          totalAccounts={3}
          typeList="items"
        />
        <View style={styles.rowIncomeExpense}>
          <PercentDebt text="Paid" amount={30} percent="%" />
          <CurrentInstallment text="This Installment" amount={1000000.0} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f0f4f8",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    margin: 10,
    backgroundColor: "transparent",
  },
  summaryButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffd358",
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  scrollContainer: {
    flexGrow: 1, 
    backgroundColor: "#f0f4f8",
  },
  rowIncomeExpense: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    backgroundColor: "transparent",
  },
  header: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333333",
    textAlign: "left",
  },
  temp: {
    color: "#7fa1ff",
  },
});
