import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import IconMap from "../constants/IconMap";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTransactions, Transaction } from "../services/TransactionService";
import { Account } from "../services/AccountService";
import { useRouter } from "expo-router";

interface TransactionCardProps {
  selected: "Income" | "Expense" | "Transfer" | "All";
  showOnlyThisAccount: boolean;
  selectedAccount: Account | null;
}

const colorMap: Record<string, string> = {
  Expense: "#FF3D00",
  Income: "#08B80F",
  Transfer: "#ff9f00",
};

export default function TransactionCard({
  selected,
  showOnlyThisAccount,
  selectedAccount,
}: TransactionCardProps) {
  const router = useRouter();
  const {
    getAllTransactions,
    loading,
    error,
    deleteTransaction,
    getTransactionByAccount,
  } = useTransactions();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refresh, setRefresh] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        let data;
        if (showOnlyThisAccount && selectedAccount) {
          const accountNumberWithoutHyphens = selectedAccount.account_number.replace(/-/g, "");
          data = await getTransactionByAccount(accountNumberWithoutHyphens, selectedAccount.fi_code);
        } else {
          data = await getAllTransactions();
        }
        setTransactions(data ?? []);
        console.log("Fetched Transactions:", data);
      } catch (err) {
        console.log("Error fetching transactions:", err);
      }
    };

    fetchTransactions();
  }, [refresh, showOnlyThisAccount, selectedAccount]);

  const filteredTransactions = transactions.filter((transaction) => {
    if (selected === "All") {
      return true; 
    }
    return transaction.category === selected;
  });

  const handleEdit = (transactionId: string) => {
    setSelectedTransaction(null);
    router.push(`/EditTransaction/${transactionId}`);
  };

  const handleDelete = async (transactionId: string) => {
    try {
      await deleteTransaction(transactionId);
      setRefresh((prev) => !prev); 
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  if (loading) {
    return <View><Text>Loading...</Text></View>;
  }

  if (error) {
    return <View><Text>{error}</Text></View>;
  }

  if (!selectedAccount && showOnlyThisAccount) {
    return <View><Text>No account selected. Please select an account to view transactions.</Text></View>;
  }

  return (
    <FlatList
      data={filteredTransactions}
      keyExtractor={(item) => item.transaction_id}
      renderItem={({ item: transaction }) => (
        <View style={styles.card}>
          <TouchableOpacity onPress={() => setSelectedTransaction(transaction.transaction_id)} style={styles.mainContent}>
            <MaterialCommunityIcons
              name={IconMap[transaction.type.toLowerCase()] || "alert-circle-outline"}
              style={styles.icon}
              color="#4a4a8e"
            />
            <View style={styles.infoContainer}>
              <Text style={styles.description}>{transaction.type}</Text>
              <Text style={styles.date}>
                {new Date(transaction.transaction_datetime).toLocaleDateString()}
              </Text>
              {/* Display the Note under Date */}
              {transaction.note && (
                <Text style={styles.note}>{transaction.note}</Text>
              )}
            </View>
            <View style={styles.rightContainer}>
              <Text style={[styles.amount, { color: colorMap[transaction.category] }]}>
                {transaction.category === "Income" ? "+" : transaction.category === "Expense" ? "-" : ""}
                ฿{transaction.amount.toLocaleString()}
              </Text>
            </View>
          </TouchableOpacity>

          <Modal
            visible={selectedTransaction === transaction.transaction_id}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setSelectedTransaction(null)}
          >
            <View style={styles.modalBackdrop}>
              <View style={styles.bottomModalContainer}>
                <View style={styles.headerModal}>
                  <Text style={styles.modalTitle}>Transaction Details</Text>
                  <TouchableOpacity onPress={() => setSelectedTransaction(null)} style={styles.closeButton}>
                    <Ionicons name="close-outline" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                <View style={styles.modalContent}>
                  <Text style={styles.modalLabel}>Description: </Text>
                  <Text>{transaction.note}</Text>
                </View>
                <View style={styles.modalContent}>
                  <Text style={styles.modalLabel}>Date: </Text>
                  <Text>{new Date(transaction.transaction_datetime).toLocaleDateString()}</Text>
                </View>
                <View style={styles.modalContent}>
                  <Text style={styles.modalLabel}>Amount: </Text>
                  <Text style={{ color: colorMap[transaction.category] }}>
                    {transaction.category === "Income" ? "+" : "-"}฿{transaction.amount.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.modalActions}>
                  <TouchableOpacity onPress={() => handleDelete(transaction.transaction_id)}>
                    <Text>Delete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleEdit(transaction.transaction_id)}>
                    <Text>Edit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 7,
    marginVertical: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  mainContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    fontSize: 24,
    borderRadius: 20,
    marginRight: 10,
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
  },
  rightContainer: {
    alignItems: "flex-end",
  },
  description: {
    fontSize: 21,
    fontWeight: "semibold",
    color: "#333",
  },
  date: {
    fontSize: 12,
    color: "#666",
  },
  note: {
    fontSize: 13,
    color: "#666",
    marginTop: 5,
  },
  amount: {
    fontSize: 16,
    fontWeight: "semibold",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  bottomModalContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    width: "100%",
  },
  headerModal: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  closeButton: {
    backgroundColor: "transparent",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalContent: {
    marginBottom: 10,
  },
  modalLabel: {
    fontWeight: "bold",
    color: "#333",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
});
