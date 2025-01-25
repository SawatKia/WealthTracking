import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import IconMap from "../constants/IconMap";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

type TransactionCardProps = {
  transaction: {
    id: number;
    type: string;
    category: string;
    description: string;
    amount: number;
    date: string;
    time: string;
    fromAccount: string;
    endBalance: number;
  };
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
};

const colorMap: Record<string, string> = {
  Expense: "#FF3D00",
  Income: "#08B80F",
  Transfer: "#ff9f00",
};

export default function TransactionCard({
  transaction,
  onDelete,
  onEdit,
}: TransactionCardProps) {
  const color = colorMap[transaction.type];
  const iconName =
    IconMap[transaction.category.toLowerCase()] || "alert-circle-outline";
  const [isExpanded, setIsExpanded] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const showTransactionDetails = () => {
    setModalVisible(true);
  };

  const hideTransactionDetails = () => {
    console.log('press hide')
    setModalVisible(false);
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity
        onPress={showTransactionDetails}
        style={styles.mainContent}
      >
        {/* Image on the left */}
        <MaterialCommunityIcons
          name={iconName}
          style={styles.icon}
          color="#4a4a8e"
        />

        {/* Description and Date in the center */}
        <View style={styles.infoContainer}>
          <Text style={styles.description}>{transaction.description}</Text>
          <Text style={styles.date}>{transaction.date}</Text>
        </View>

        {/* Amount on the right */}
        <View style={styles.rightContainer}>
          <Text style={[styles.amount, { color }]}>
            {transaction.type === "Income"
              ? "+"
              : transaction.type === "Expense"
              ? "-"
              : ""}
            ฿{transaction.amount.toLocaleString()}
          </Text>
          <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
            <Ionicons
              name={isExpanded ? "chevron-up-outline" : "chevron-down-outline"}
              size={24}
              color="#4a4a8e"
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.additionalDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>From Account</Text>
            <Text style={styles.detailValue}>{transaction.fromAccount}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>End Balance</Text>
            <Text style={styles.detailValue}>
              ฿{transaction.endBalance.toLocaleString()}
            </Text>
          </View>
        </View>
      )}

      {/* Bottom Popup Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={hideTransactionDetails}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.bottomModalContainer}>
            <View style={styles.headerModal}>
      {/* Modal Content */}
                <Text style={styles.modalTitle}>Transaction Details</Text>
              <TouchableOpacity onPress={hideTransactionDetails} style={styles.closeButton}>
                <Ionicons name="close-outline" size={24} color="#333" />
               </TouchableOpacity>
            </View>
            {/* Close Button */}


            

            <View style={styles.modalContent}>
              <Text style={styles.modalLabel}>Description: </Text>
              <Text>{transaction.description}</Text>
            </View>
            <View style={styles.modalContent}>
              <Text style={styles.modalLabel}>Date: </Text>
              <Text>{transaction.date}</Text>
            </View>
            <View style={styles.modalContent}>
              <Text style={styles.modalLabel}>Amount: </Text>
              <Text style={{ color }}>
                {transaction.type === "Income" ? "+" : "-"}฿
                {transaction.amount.toLocaleString()}
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => onDelete(transaction.id)}>
                <Text>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onEdit(transaction.id)}>
                <Text>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    // position: 'absolute'

    // top: 10,
    // right: 10,

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
