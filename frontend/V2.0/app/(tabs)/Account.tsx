import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from "react-native";
import { GestureHandlerRootView, PanGestureHandler, State } from "react-native-gesture-handler";
import { useRouter } from "expo-router";
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


  // ดึงข้อมูลบัญชีจาก API เมื่อคอมโพเนนต์ถูกโหลด
  useEffect(() => {
    const fetchAccounts = async () => {
      const accounts = await getAllAccounts();
      setBankAccounts(accounts);
    };

    const fetchTransactions = async () => {
      const transactions = await getAllTransactions();
      console.log("Fetched Transactions:", transactions); // ตรวจสอบข้อมูลที่ได้
      if (transactions) {
        setRecentTransactions(transactions);
      } else {
        setRecentTransactions([]); // ตั้งค่าเป็น array ว่างแทน undefined
      }
    };

    fetchAccounts();
  }, []);

  // คำนวณยอดรวมของทุกบัญชี
  const totalBalance = bankAccounts.reduce((total, account) => total + account.balance, 0);

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
    }
  };

  // ฟังก์ชันสำหรับนำทางไปยังหน้า AddAccount
  const navigateToAddAccount = () => {
    router.push("/AddAccount"); // นำทางไปยัง AddAccount.tsx
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* ยอดเงินรวมทั้งหมด */}
      <View style={styles.totalBalanceContainer}>
        <Text style={styles.totalBalanceText}>
          Total Balance : {totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} Baht
        </Text>
      </View>

      {/* การ์ดแสดงบัญชีธนาคาร */}
      <PanGestureHandler onHandlerStateChange={handleSwipe}>
        <View style={styles.accountContainer}>
          <View style={styles.accountCard}>
            <Text style={styles.bankName}>{bankAccounts[currentIndex]?.display_name}</Text>
            <Text style={styles.accountOwner}>{bankAccounts[currentIndex]?.account_name}</Text>
            <Text style={styles.accountNumber}>{bankAccounts[currentIndex]?.account_number}</Text>
            <Text style={styles.balanceText}>Bank Balance</Text>
            <Text style={styles.balanceAmount}>
              {bankAccounts[currentIndex]?.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} Baht
            </Text>
          </View>
        </View>
      </PanGestureHandler>

      {/* จุดแสดงการ์ดที่แสดงอยู่ */}
      <View style={styles.dotContainer}>
        {bankAccounts.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, currentIndex === index && styles.activeDot]}
          />
        ))}
      </View>

      {/* ประวัติธุรกรรมล่าสุด */}
      <FlatList
        data={recentTransactions ? recentTransactions.slice(0, 5) : []}
        keyExtractor={(item) => item.transaction_id.toString()}
        renderItem={({ item }) => (
          <View style={styles.transactionCard}>
            <Text style={[styles.transactionType, { color: "#333333" }]}>{item.type}</Text>
            <Text style={[styles.transactionDetails, { color: "#333333" }]}>Account Number : {item.sender?.account_number || "N/A"}</Text>
            <Text style={[styles.transactionAmount, { color: item.type === "Income" ? "green" : "red" }]}>
              {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} Baht
            </Text>
          </View>
        )}
      />

      {/* ปุ่มเพิ่มบัญชี */}
      <TouchableOpacity style={styles.floatingButton} onPress={navigateToAddAccount}>
        <Ionicons name="add" size={45} color="#ffffff" /> {/* เปลี่ยนจาก Text เป็น Ionicons */}
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
    width: screenWidth - 32, // ความกว้างของการ์ด
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
});