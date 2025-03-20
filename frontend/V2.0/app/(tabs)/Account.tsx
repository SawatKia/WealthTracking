<<<<<<< HEAD
import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { GestureHandlerRootView, PanGestureHandler, GestureHandlerGestureEvent } from "react-native-gesture-handler";
import { useRouter } from "expo-router";

// ข้อมูลบัญชีธนาคาร
const bankAccounts = [
  { name: "Kasikorn", owner: "Miss Jane Cooper", accountNumber: "645-8-23195-9", balance: 25890.0, lastUpdated: "Today, 14:30 PM" },
  { name: "Krungthai", owner: "Miss Jane Cooper", accountNumber: "217-1-65465-3", balance: 50000.0, lastUpdated: "Yesterday, 16:00 PM" },
];

// ข้อมูลธุรกรรมล่าสุด
const recentTransactions = [
  { id: 1, type: "Deposit", accountNumber: "645-8-23195-9", amount: 500.0, color: "green" },
  { id: 2, type: "Withdraw", accountNumber: "217-1-65465-3", amount: 100.0, color: "red" },
  { id: 3, type: "Deposit", accountNumber: "645-8-23195-9", amount: 1500.0, color: "green" },
  { id: 4, type: "Withdraw", accountNumber: "217-1-65465-3", amount: 200.0, color: "red" },
  { id: 5, type: "Deposit", accountNumber: "645-8-23195-9", amount: 3000.0, color: "green" },
];

export default function BankAccountScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  // คำนวณยอดรวมของทุกบัญชี
  const totalBalance = bankAccounts.reduce((total, account) => total + account.balance, 0);

  // ฟังก์ชันสำหรับเลื่อนการ์ดบัญชีธนาคาร
  const handleSwipe = (event: GestureHandlerGestureEvent) => {
    const { nativeEvent } = event;

    const { translationX } = nativeEvent as unknown as { translationX: number };

    if (translationX < -50) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % bankAccounts.length);
    } else if (translationX > 50) {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + bankAccounts.length) % bankAccounts.length);
=======
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from "react-native";
import { GestureHandlerRootView, PanGestureHandler, State } from "react-native-gesture-handler";
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from "@expo/vector-icons";
import { Account, useAccount } from "../../services/AccountService"; // นำเข้า useAccount
import { Transaction, useTransactions } from "../../services/TransactionService";

const { width: screenWidth } = Dimensions.get("window");

export default function BankAccountScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [bankAccounts, setBankAccounts] = useState<Account[]>([]); // สร้าง state สำหรับ bankAccounts
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  const router = useRouter();
  const { getAllAccounts } = useAccount();
  const { getAllTransactions } = useTransactions();

  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        const accounts = await getAllAccounts();
        console.log("Fetched Accounts:", accounts); // ตรวจสอบข้อมูลบัญชีที่ได้
        setBankAccounts(accounts);

        const transactions = await getAllTransactions();
        console.log("Fetched Transactions:", transactions); // ตรวจสอบข้อมูลธุรกรรมที่ได้
        if (transactions) {
          setRecentTransactions(transactions);
        } else {
          setRecentTransactions([]); // ตั้งค่าเป็น array ว่างแทน undefined
        }
      };

      fetchData();
    }, [])
  );

  // คำนวณยอดรวมของทุกบัญชี
  const totalBalance = bankAccounts.reduce((total, account) => total + parseFloat(account.balance), 0);

  // ฟังก์ชันสำหรับเลื่อนการ์ดบัญชีธนาคาร
  const handleSwipe = ({ nativeEvent }: any) => {
    const { translationX, state } = nativeEvent;

    if (state === State.END) {
      if (translationX < -50) {
        // ลากไปทางซ้าย
        setCurrentIndex((prevIndex) => (prevIndex + 1) % bankAccounts.length);
      } else if (translationX > 50) {
        // ลากไปทางขวา
        setCurrentIndex((prevIndex) => (prevIndex - 1 + bankAccounts.length) % bankAccounts.length);
      }
>>>>>>> a51f311a0b38028b391ffa03f728ea2485a74edb
    }
  };

  // ฟังก์ชันสำหรับนำทางไปยังหน้า AddAccount
  const navigateToAddAccount = () => {
    router.push("/AddAccount"); // นำทางไปยัง AddAccount.tsx
  };

<<<<<<< HEAD
=======
  // คำนวณช่วงของจุดที่แสดง
  const visibleDots = 10; // จำนวนจุดที่แสดง
  const halfVisibleDots = Math.floor(visibleDots / 2);

  const startIndex = Math.max(0, Math.min(currentIndex - halfVisibleDots, bankAccounts.length - visibleDots));
  const endIndex = Math.min(startIndex + visibleDots, bankAccounts.length);

  // แสดงจุดเฉพาะในช่วงที่คำนวณได้
  const visibleDotIndexes = Array.from({ length: endIndex - startIndex }, (_, i) => startIndex + i);

>>>>>>> a51f311a0b38028b391ffa03f728ea2485a74edb
  return (
    <GestureHandlerRootView style={styles.container}>
      {/* ยอดเงินรวมทั้งหมด */}
      <View style={styles.totalBalanceContainer}>
        <Text style={styles.totalBalanceText}>
          Total Balance : {totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} Baht
        </Text>
      </View>

      {/* การ์ดแสดงบัญชีธนาคาร */}
<<<<<<< HEAD
      <PanGestureHandler onGestureEvent={handleSwipe}>
        <View style={styles.accountContainer}>
          <View style={styles.accountCard}>
            <Text style={styles.bankName}>{bankAccounts[currentIndex].name}</Text>
            <Text style={styles.accountOwner}>{bankAccounts[currentIndex].owner}</Text>
            <Text style={styles.accountNumber}>{bankAccounts[currentIndex].accountNumber}</Text>
            <Text style={styles.balanceText}>Bank Balance</Text>
            <Text style={styles.balanceAmount}>
              {bankAccounts[currentIndex].balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} Baht
=======
      <PanGestureHandler onHandlerStateChange={handleSwipe}>
        <View style={styles.accountContainer}>
          <View style={styles.accountCard}>
            <Text style={styles.bankName}>{bankAccounts[currentIndex]?.display_name}</Text>
            <Text style={styles.accountOwner}>{bankAccounts[currentIndex]?.account_name}</Text>
            <Text style={styles.accountNumber}>{bankAccounts[currentIndex]?.account_number}</Text>
            <Text style={styles.balanceText}>Bank Balance</Text>
            <Text style={styles.balanceAmount}>
              {bankAccounts[currentIndex]?.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} Baht
>>>>>>> a51f311a0b38028b391ffa03f728ea2485a74edb
            </Text>
          </View>
        </View>
      </PanGestureHandler>

      {/* จุดแสดงการ์ดที่แสดงอยู่ */}
      <View style={styles.dotContainer}>
<<<<<<< HEAD
        {bankAccounts.map((_, index) => (
=======
        {visibleDotIndexes.map((index) => (
>>>>>>> a51f311a0b38028b391ffa03f728ea2485a74edb
          <View
            key={index}
            style={[styles.dot, currentIndex === index && styles.activeDot]}
          />
        ))}
      </View>

      {/* ประวัติธุรกรรมล่าสุด */}
<<<<<<< HEAD
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#333' }}> Recent Transactions</Text>
      <FlatList
        data={recentTransactions.slice(0, 5)} // แสดงแค่ 5 รายการแรก
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.transactionCard}>
            <Text style={[styles.transactionType, { color: "#333333" }]}>{item.type}</Text>
            <Text style={[styles.transactionDetails, { color: "#333333" }]}>Account Number : {item.accountNumber}</Text>
            <Text style={[styles.transactionAmount, { color: item.color }]}>
=======
      <FlatList
        data={recentTransactions ? recentTransactions.slice(0, 5) : []}
        keyExtractor={(item) => item.transaction_id.toString()}
        renderItem={({ item }) => (
          <View style={styles.transactionCard}>
            <Text style={[styles.transactionType, { color: "#333333" }]}>{item.type}</Text>
            <Text style={[styles.transactionDetails, { color: "#333333" }]}>Account Number : {item.sender?.account_number || "N/A"}</Text>
            <Text style={[styles.transactionAmount, { color: item.type === "Income" ? "green" : "red" }]}>
>>>>>>> a51f311a0b38028b391ffa03f728ea2485a74edb
              {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} Baht
            </Text>
          </View>
        )}
      />

      {/* ปุ่มเพิ่มบัญชี */}
      <TouchableOpacity style={styles.floatingButton} onPress={navigateToAddAccount}>
<<<<<<< HEAD
        <Text style={styles.floatingButtonText}>+</Text>
=======
        <Ionicons name="add" size={45} color="#ffffff" /> {/* เปลี่ยนจาก Text เป็น Ionicons */}
>>>>>>> a51f311a0b38028b391ffa03f728ea2485a74edb
      </TouchableOpacity>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F0F6FF" },
  accountContainer: {
    backgroundColor: "#4957AA",
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
<<<<<<< HEAD
=======
    width: screenWidth - 32, // ความกว้างของการ์ด
>>>>>>> a51f311a0b38028b391ffa03f728ea2485a74edb
  },
  accountCard: {
    padding: 16,
    backgroundColor: "#4957AA",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  bankName: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  accountOwner: { fontSize: 14, color: "#E2E2E2", marginVertical: 4 },
  accountNumber: { fontSize: 14, color: "#E2E2E2", marginVertical: 4 },
  balanceText: { fontSize: 14, color: "#E2E2E2", marginVertical: 4 },
  balanceAmount: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginVertical: 10,
  },
  transactionCard: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  transactionType: { fontSize: 14 },
  transactionDetails: { fontSize: 14, color: "#555", marginVertical: 4 },
  transactionAmount: { fontSize: 14 },
  floatingButton: {
    position: "absolute",
<<<<<<< HEAD
    bottom: 10,
    right: 10,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4957AA",
    marginLeft: -30,
    marginTop: -30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    paddingLeft: 20,
    paddingRight: 20,
  },
  floatingButtonText: {
    color: "#fff",
    fontSize: 60,
    marginLeft: -10,
    marginTop: -16,
=======
    bottom: 20,
    right: 20,
    backgroundColor: "#7F8CD9", // สีพื้นหลัง
    width: 60,
    height: 60,
    borderRadius: 30, // ทำให้เป็นวงกลม
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5, // สำหรับ Android
>>>>>>> a51f311a0b38028b391ffa03f728ea2485a74edb
  },
  dotContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ccc",
    margin: 5,
  },
  activeDot: {
    backgroundColor: "#4957AA",
  },
  totalBalanceContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 16,
  },
  totalBalanceText: {
    fontSize: 14,
    color: "#555",
  },
<<<<<<< HEAD
});
=======
});
>>>>>>> a51f311a0b38028b391ffa03f728ea2485a74edb
