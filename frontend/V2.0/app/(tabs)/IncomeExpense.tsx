import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import AccountCard from "../../components/AccountCard"
import DropdownButton from "../../components/DropdownButton";
import TransactionCard from "../../components/TransactionCard";
import { Ionicons} from "@expo/vector-icons"; 
import { useRouter } from 'expo-router';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
const accounts = [
  { name: "Account A", balance: 1000000, lastUpdated: "Today, 18:00 PM" },
  { name: "Account B", balance: 500000, lastUpdated: "Yesterday, 15:00 PM" },
];

const transactions = [
  { id: 1, category: "Transport", description: "Taxi", amount: 500, type: "Expense", date: "22 Feb 2024", time: "15:00 PM", fromAccount: "Account A", endBalance: 999500 },
  { id: 2, category: "insurance", description: "Insurance", amount: 10000, type: "Expense", date: "22 Feb 2024", time: "18:00 PM", fromAccount: "Account A", endBalance: 989500 },
  { id: 3, category: "Transport", description: "Taxi", amount: 500, type: "Expense", date: "22 Feb 2024", time: "15:00 PM", fromAccount: "Account A", endBalance: 999000 },
  { id: 4, category: "Transport", description: "Taxi", amount: 500, type: "Expense", date: "22 Feb 2024", time: "15:00 PM", fromAccount: "Account A", endBalance: 998500 },
  { id: 5, category: "Transport", description: "Salary", amount: 1000, type: "Income", date: "22 Feb 2024", time: "18:00 PM", fromAccount: "Account A", endBalance: 1000500 },
  { id: 6, category: "Transfer", description: "Transfer", amount: 1000, type: "Transfer", date: "22 Feb 2024", time: "18:00 PM", fromAccount: "Account A", endBalance: 1000500 },
  { id: 7, category: "Transfer", description: "Transfer", amount: 1000, type: "Transfer", date: "22 Feb 2024", time: "18:00 PM", fromAccount: "Account A", endBalance: 1000500 },
];


// export default function DebtScreen() {
  export default function IncomeExpenses () {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<"Income" | "Expense" | "Transfer" | "All">("Expense");
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [filteredTransactions, setFilteredTransactions] = useState(transactions);

  const handleSwipe = (direction: 'Left' | 'Right') => {
    if (direction === 'Left') {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % accounts.length);
    } else if (direction === 'Right') {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + accounts.length) % accounts.length);
    }
  };
  useEffect(() => {
    const filterLst = selectedType === "All" ? transactions : transactions.filter((transaction) => 
      transaction.type === selectedType
    );
    console.log(filterLst)
    setFilteredTransactions(filterLst)
  }, [transactions, selectedType])
  const [showAddPopup, setAddshowAddPopup] = useState(false);

  return (
    <View style={styles.container}>

      <GestureHandlerRootView style={styles.accountContainer}>
        <AccountCard
          account={accounts[currentIndex]}
          currentIndex={currentIndex}
          totalAccounts={accounts.length}
          onSwipe={handleSwipe}
        />
      </GestureHandlerRootView>
      <DropdownButton selectedType={selectedType} onSelect={setSelectedType} />
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <TransactionCard transaction={item} />}
      />
 

      {/* Floating Button */}
      {showAddPopup && (
        <View style={styles.popup}>
          <TouchableOpacity
            style={[styles.link, {backgroundColor: '#99a7f7', borderTopLeftRadius:8,
              borderTopRightRadius:8 }]}
            onPress={() => {
              router.push('/CreateTransaction')
              setAddshowAddPopup(false);
              
            }}
          >
            <Text style={[styles.linkText, {color: '#ffffff' }]}  >Create Transaction</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.link, {backgroundColor: '#7F8CD9'}]} 
            onPress={() => {
              setAddshowAddPopup(false);
              console.log('Navigate to Page 2');
  
              // Add your navigation logic here
            }}
          >
            <Text style={[styles.linkText, {color: '#ffffff' }]}>Create Transaction{"\n"}By Slip</Text>
            </TouchableOpacity>

            <TouchableOpacity
            style={[styles.link, {backgroundColor: '#4957AA',  borderBottomLeftRadius:8,
              borderBottomRightRadius:8 }]} 
              onPress={() => {
                // router.push('/DebtPayment')
                setAddshowAddPopup(false);
            }}
          >
            <Text style={[styles.linkText, {color: '#ffffff' }]}>Dept Payment</Text>
          </TouchableOpacity>

        </View>
      )}

      {/* Floating Button */}
      <TouchableOpacity
        style={styles.floatingPlusButton}
        onPress={() => setAddshowAddPopup(!showAddPopup)}
      >
        <Ionicons name="add" size={45} color="#ffffff" />
      </TouchableOpacity>
     
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f0f4f8" },

  accountContainer: {
    backgroundColor: '#F5F5F5',
    marginBottom: 10
  },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginVertical: 16 },
  floatingButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  floatingButtonText: { color: "#fff", fontSize: 24, fontWeight: "bold" },


  plusButtonContainer: {
    // flex: 1,
    backgroundColor: '#fff',
    // justifyContent: "center",
    // alignItems: "center",
    // textAlign:"center"
    // justifyContent: 'flex-end',
  },
  floatingPlusButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#7F8CD9',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
    
  },
  popup: {
    position: 'absolute',
    bottom: 85, // Position it above the button
    right: 20,
    backgroundColor: '#EEEFF7',
    // padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  link: {
    // marginVertical: 5,
    paddingVertical: 10, // Padding for height
    paddingHorizontal: 15,
    // padding: 10,
  },
  linkText: {
    fontSize: 16,
    // fontWeight:'semibold'
    // color: '#007AFF',
  },
});

