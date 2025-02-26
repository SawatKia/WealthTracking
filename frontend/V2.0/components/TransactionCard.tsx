import React, { useState,useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal,FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import IconMap from "../constants/IconMap";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { useTransactions, Transaction } from '../services/TransactionService';
import { useRouter } from "expo-router";

interface TransactionCardProps {
  selected: "Income" | "Expense" | "Transfer" | "All";
}

const colorMap: Record<string, string> = {
  Expense: "#FF3D00",
  Income: "#08B80F",
  Transfer: "#ff9f00",
};

export default function TransactionCard({selected }: TransactionCardProps) {
  const router = useRouter()
  const { getAllTransactions, loading, error, deleteTransaction } = useTransactions();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refresh, setRefresh] = useState(false); 

  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  // const [selectedType, setSelectedType] = useState<string>('All');
  // const [isExpanded, setIsExpanded] = useState(false);
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const data = await getAllTransactions();
        console.log(data)
        setTransactions(data ?? []);
      }
      catch(err){
        console.log(err)
      }
    };

    fetchTransactions();
  }, [refresh]);
  const filteredTransactions = transactions.filter((transaction) => {
    if (selected === 'All') {
      return true; // Show all transactions
    }
    return transaction.category === selected;
  });

  const handleEdit = async (transactionId: string) =>{
    setSelectedTransaction(null)
    router.push(`/EditTransaction/${transactionId}`);

  }
  const handleDelete = async (transactionId: string) => {
    try {
      await deleteTransaction(transactionId);
  
      // ✅ Trigger a re-render
      setRefresh(prev => !prev); // Toggle refresh state
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
    
  };


    if (error) {
      return (
        <View >
          <Text>{error}</Text>
        </View>
      );
    }

  return (
    // <View>
      <FlatList
      
        data={filteredTransactions}
        keyExtractor={(item) => item.transaction_id}
        renderItem={({ item: transaction }) => (
        
        <View style={styles.card}>
          <TouchableOpacity
            onPress={() => setSelectedTransaction(transaction.transaction_id)}
            style={styles.mainContent}
          >
            {/* Image on the left */}
            <MaterialCommunityIcons
              name={IconMap[transaction.type.toLowerCase()] || "alert-circle-outline"}
              style={styles.icon}
              color="#4a4a8e"
            />

            {/* Description and Date in the center */}
            <View style={styles.infoContainer}>
              <Text style={styles.description}>{transaction.type}</Text>
              <Text style={styles.date}>
                {new Date(transaction.transaction_datetime).toLocaleDateString()}
              </Text>
            </View>

            {/* Amount on the right */}
            <View style={styles.rightContainer}>
              <Text style={[styles.amount, { color : colorMap[transaction.category] }]}>
                {transaction.category === "Income"
                  ? "+"
                  : transaction.category === "Expense"
                  ? "-"
                  : ""}
                ฿{transaction.amount.toLocaleString()}
              </Text>
              {/* <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
                <Ionicons
                  name={isExpanded ? "chevron-up-outline" : "chevron-down-outline"}
                  size={24}
                  color="#4a4a8e"
                />
              </TouchableOpacity> */}
            </View>
          </TouchableOpacity>

          {/* {isExpanded && (
            <View style={styles.additionalDetails}>
              {
              transaction.category === "Expense" && transaction.sender && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>From Account</Text>
                  <Text style={styles.detailValue}>
                    {transaction.sender.account_name}
                  </Text>
                </View>
              )}

            </View>
            
          )} */}

          {/* Bottom Popup Modal */}
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
                  <TouchableOpacity
                    onPress={() => setSelectedTransaction(null)}
                    style={styles.closeButton}
                  >
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
                  <Text style={{ color : colorMap[transaction.category] }}>
                    {transaction.category === "Income" ? "+" : "-"}฿
                    {transaction.amount.toLocaleString()}
                  </Text>
                </View>

                {/* Actions */}
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
  amount: {
    fontSize: 16,
    fontWeight: "semibold",
  },
  additionalDetails: {
    marginTop: 10,
    marginLeft: 50,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  detailLabel: {
    fontSize: 14,
    color: "#555",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
    flex: 1,
    textAlign: "right",
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
  headerModal :{
    flexDirection: 'row', // Align elements horizontally
    justifyContent: 'space-between', // Push elements to the ends
  },
  closeButton: {
    backgroundColor: 'transparent',
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
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#4a4a8e",
    borderRadius: 5,
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});
