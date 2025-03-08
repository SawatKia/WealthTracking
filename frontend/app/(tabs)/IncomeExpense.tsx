import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from "react-native";
import AccountCard from "../../components/AccountCard";
import DropdownButton from "../../components/CategoryDropdown";
import TransactionCard from "../../components/TransactionCard";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { Account, useAccount } from "@/services/AccountService"; // Import the Account type
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function IncomeExpenses() {
  const router = useRouter();
  const { getAllAccounts } = useAccount();
  const [selectedType, setSelectedType] = useState<
    "Income" | "Expense" | "Transfer" | "All"
  >("All");
  const [bankAccounts, setBankAccounts] = useState<Account[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAddPopup, setAddshowAddPopup] = useState(false);
  const [showOnlyThisAccount, setShowOnlyThisAccount] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        const accounts = await getAllAccounts();
        console.log("Fetched Accounts:", accounts);
        setBankAccounts(accounts);

        // Set the first account as the default selected account
        // if (accounts.length > 0) {
        //   setSelectedAccount(accounts[0]);
        // }
      };

      fetchData();
    }, [])
  );

  return (
    <View style={styles.container}>
      {bankAccounts.length > 0 ? (
        <AccountCard account={bankAccounts} currentIndex={currentIndex} setCurrentIndex={setCurrentIndex} />
      ) : (
        <ActivityIndicator size="large" color="#0000ff" />
         
      )}

      <DropdownButton selectedType={selectedType} onSelect={setSelectedType} />

      {/* Add a Switch to toggle "Show transactions only for this account" */}
      <View style={styles.switchContainer}>
        <Text>Show transactions only for this account</Text>
        <Switch
          value={showOnlyThisAccount}
          onValueChange={(value) => setShowOnlyThisAccount(value)}
        />
      </View>

      <TransactionCard
        selected={selectedType}
        showOnlyThisAccount={showOnlyThisAccount}
        selectedAccount={bankAccounts[currentIndex]}
      />

      {/* Floating Button */}
      {showAddPopup && (
        <View style={styles.popup}>
          <TouchableOpacity
            style={[
              styles.link,
              {
                backgroundColor: "#99a7f7",
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
              },
            ]}
            onPress={() => {
              router.push("/CreateTransaction");
              setAddshowAddPopup(false);
            }}
          >
            <Text style={[styles.linkText, { color: "#ffffff" }]}>
              Create Transaction
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.link,
              {
                backgroundColor: "#7F8CD9",
                borderBottomLeftRadius: 8,
                borderBottomRightRadius: 8,
              },
            ]}
            onPress={() => {
              setAddshowAddPopup(false);
              router.push("/UploadSlip");
            }}
          >
            <Text style={[styles.linkText, { color: "#ffffff" }]}>
              Create Transaction{"\n"}By Slip
            </Text>
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "stretch",
    padding: 16,
    backgroundColor: "#f0f4f8",
  },
  accountContainer: {
    backgroundColor: "#F5F5F5",
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 16,
  },
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
    backgroundColor: "#fff",
    // justifyContent: "center",
    // alignItems: "center",
    // textAlign:"center"
    // justifyContent: 'flex-end',
  },
  floatingPlusButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#7F8CD9",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "bold",
  },
  popup: {
    position: "absolute",
    bottom: 85,
    right: 20,
    backgroundColor: "#EEEFF7",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  link: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  linkText: {
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 10,
  },
});
