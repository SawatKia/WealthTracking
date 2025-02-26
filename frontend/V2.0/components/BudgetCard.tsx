import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { Budget } from "../services/BudgetService";
import { useRouter } from "expo-router";
import { useBudget } from "../services/BudgetService";

interface BudgetCardProps {
  budgets: Budget[];
}

const BudgetCard: React.FC<BudgetCardProps> = ({ budgets }) => {
  const router = useRouter();
  const { getBudgets, deleteBudget, updateBudget } = useBudget();
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(
    null
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [editAmount, setEditAmount] = useState("");
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [expandedBudgetId, setExpandedBudgetId] = useState<string | null>(null);

  const handleEdit = async (budget: Budget) => {
    setSelectedBudget(budget);
    setEditAmount(budget.monthly_limit);
    setModalVisible(true);
  };

  const handleDelete = async (budgetId: string) => {
    Alert.alert("Delete Budget", "Are you sure you want to delete this budget?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: async () => {
          const success = await deleteBudget(budgetId);
          if (success) {
            console.log("Budget deleted:", budgetId);
            setSelectedBudget(null);
            getBudgets(); // Refresh the budget list
          } else {
            Alert.alert("Error", "Failed to delete budget. Please try again.");
          }
        },
      },
    ]);
  };
  

  const handleUpdate = async () => {
    if (!selectedBudget || !editAmount) return;

    try {
      // Use the updateBudget function from the service
      await updateBudget(selectedBudget.expense_type, {
        monthly_limit: editAmount,
      });
      setModalVisible(false);
      getBudgets(); // Refresh the budget list
    } catch (error) {
      console.error("Error updating budget:", error);
      Alert.alert("Error", "Failed to update budget. Please try again.");
    }
  };

  const toggleExpand = (budgetId: string) => {
    setExpandedBudgetId(expandedBudgetId === budgetId ? null : budgetId);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={budgets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const monthlyLimit = parseFloat(item.monthly_limit as string);
          const currentSpending = parseFloat(item.current_spending as string);
          const leftAmount = monthlyLimit - currentSpending;
          const overspent = leftAmount < 0;
          const progress = Math.min(currentSpending / monthlyLimit, 1);

          return (
            <View style={styles.card}>
              <View style={styles.header}>
                <MaterialCommunityIcons
                  name="currency-usd"
                  style={styles.icon}
                  color="#4a4a8e"
                />
                <Text style={styles.category}>{item.expense_type}</Text>
                <TouchableOpacity
                  onPress={() => toggleExpand(item.id)}
                  style={styles.expandButton}
                >
                  <Ionicons
                    name={
                      expandedBudgetId === item.id
                        ? "chevron-up"
                        : "chevron-down"
                    }
                    size={24}
                    color="#333"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.amountRow}>
                <Text style={styles.amount}>${currentSpending.toFixed(2)}</Text>
                <Text
                  style={[
                    styles.status,
                    { color: overspent ? "#FF3D00" : "#8A8A8A" },
                  ]}
                >
                  {overspent
                    ? `Overspent $${Math.abs(leftAmount).toFixed(2)}`
                    : `Left $${leftAmount.toFixed(2)}`}
                </Text>
              </View>

              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progress * 100}%`,
                      backgroundColor: overspent ? "#FF3D00" : "#08B80F",
                    },
                  ]}
                />
              </View>

              {expandedBudgetId === item.id && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    onPress={() => handleDelete(item.id)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.buttonText}>Delete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleEdit(item)}
                    style={styles.editButton}
                  >
                    <Text style={styles.buttonText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.bottomModalContainer}>
            <View style={styles.headerModal}>
              <Text style={styles.modalTitle}>Edit Budget</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close-outline" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <Text style={styles.modalLabel}>Monthly Limit: </Text>
              <TextInput
                style={styles.input}
                value={editAmount}
                onChangeText={setEditAmount}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={handleUpdate}
                style={styles.updateButton}
              >
                <Text style={styles.buttonText}>Update</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginVertical: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  icon: {
    fontSize: 24,
    borderRadius: 20,
    marginRight: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  category: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
    color: "#333",
    flex: 1,
  },
  expandButton: {
    padding: 5,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  amount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  status: {
    fontSize: 14,
    fontWeight: "bold",
  },
  progressBar: {
    height: 10,
    backgroundColor: "#E5E5E5",
    borderRadius: 5,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 5,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  deleteButton: {
    backgroundColor: "#FF3D00",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
    alignItems: "center",
  },
  editButton: {
    backgroundColor: "#4a4a8e",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
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
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginTop: 10,
    borderRadius: 5,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  updateButton: {
    backgroundColor: "#4a4a8e",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
    alignItems: "center",
  },
  closeButton: {
    backgroundColor: "transparent",
  },
});

export default BudgetCard;
