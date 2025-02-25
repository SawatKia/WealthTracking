import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import {
  State,
  PanGestureHandler,
  GestureHandlerRootView,
  GestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import { Account } from "@/services/AccountService"; // นำเข้า useAccount

type AccountCardProps = {
  account: Account[];
};

export default function AccountCard({
  account,
}: AccountCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalBalance = account.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
  const handleSwipe = (event: GestureHandlerGestureEvent) => {
    const { nativeEvent } = event;
    const { translationX } = nativeEvent as unknown as { translationX: number };
  
    // Adding a delay using setTimeout
    setTimeout(() => {
      if (translationX < -50) {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % account.length);
      } else if (translationX > 50) {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + account.length) % account.length);
      }
    }, 300); // 300ms delay before changing the index
  };
  console.log(account[currentIndex])
  return (
    // <GestureDetector gesture={swipeGesture}>

    // <View style={styles.card}>
    // <Text style={styles.name}>{account.name}</Text>
    // <Text style={styles.balance}>฿{account.balance.toLocaleString()}</Text>
    // <Text style={styles.updated}>Last Updated: {account.lastUpdated}</Text>
    // <Text style={styles.indicator}>{`${currentIndex + 1} / ${totalAccounts}`}</Text>
    // </View>
    // </GestureDetector>

    <GestureHandlerRootView style={styles.container}>
      {/* ยอดเงินรวมทั้งหมด */}
      <View style={styles.totalBalanceContainer}>
        <Text style={styles.totalBalanceText}>
          Total Balance: ฿{totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          Baht
        </Text>
      </View>

      {/* การ์ดแสดงบัญชีธนาคาร */}
      <PanGestureHandler 
      onHandlerStateChange={(event) => {
        if (event.nativeEvent.state === State.END) {
          handleSwipe(event);
        }
      }}
    >
        
        <View style={styles.accountContainer}>
          <View style={styles.card}>
            <Text style={styles.name}>{account[currentIndex]?.display_name}</Text>
            <Text style={styles.balance}>
              ฿{account[currentIndex]?.balance.toLocaleString()}
            </Text>
            <Text style={styles.updated}>
              Account Number: {account[currentIndex]?.account_number}
            </Text>
            {/* <Text style={styles.indicator}>{`${
              currentIndex + 1
            } / ${account.length}`}</Text> */}
          </View>
        </View>
      </PanGestureHandler>
      <View style={styles.dotContainer}>
              {account.map((_, index) => (
                <View
                  key={index}
                  style={[styles.dot, currentIndex === index && styles.activeDot]}
                />
              ))}
            </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#F0F6FF" },
  card: {
    padding: 16,
    backgroundColor: "#4957AA",
    borderRadius: 8,
    marginBottom: 16,
  },
  name: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  balance: { fontSize: 18, color: "#fff", marginVertical: 4 },
  updated: { fontSize: 14, color: "#ddd" },
  indicator: { marginTop: 8, textAlign: "center", color: "#ccc" },
  totalBalanceContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 16,
  },
  totalBalanceText: {
    fontSize: 14,
    color: "#555",
  },
  accountContainer: {
    backgroundColor: "#4957AA",
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
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

  dotContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
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
});
