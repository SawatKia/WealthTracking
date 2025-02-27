import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useBudget } from "../services/BudgetService"; 
import SelectExpenseTypeModal from "./SelectExpenseType";
import { useRouter } from "expo-router";

const CreateBudget = () => {
  const { createBudget } = useBudget(); 
  const [selectedCategory, setSelectedCategory] = useState({ type: '', category: '' });
  const [amount, setAmount] = useState('');
  const router = useRouter()

  const handleSelectCategory = (category: string, type: string) => {
    setSelectedCategory({ category, type });
    setCategoryPickerVisibility(false);
  };

  const handleCreateBudget = async () => {
    // Validate required fields
    if (!selectedCategory.category || !amount) {
      alert("Please fill in all required fields.");
      return;
    }

    const newBudget = {
      expense_type: selectedCategory.category,
      monthly_limit: amount,
    };
    await createBudget(newBudget);
  };

  const [isCategoryPickerVisible, setCategoryPickerVisibility] = useState(false);

  return (
    <KeyboardAwareScrollView>
      {/* Category Section */}
      <View style={styles.container}>
        <View style={styles.rowTile}>
          <Ionicons name="shapes" style={styles.iconTitle} size={20} color="#fff" />
          <Text style={styles.title}>Category</Text>
        </View>

        <View style={styles.rowInput}>
          <TouchableOpacity onPress={() => setCategoryPickerVisibility(true)} style={styles.inputButton}>
            <Text>{selectedCategory.category ? `${selectedCategory.type} : ${selectedCategory.category}` : 'Select Category'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={isCategoryPickerVisible} animationType="slide" onRequestClose={() => setCategoryPickerVisibility(false)}>
        <SelectExpenseTypeModal selected={selectedCategory.category} onSelect={handleSelectCategory} />
      </Modal>

      {/* Amount Section */}
      <View style={styles.container}>
        <View style={styles.rowTile}>
          <Ionicons name="cash" style={styles.iconTitle} size={20} color="#fff" />
          <Text style={styles.title}>Amount</Text>
        </View>

        <View style={styles.rowInput}>
          <TextInput
            placeholder="0.00"
            onChangeText={setAmount}
            keyboardType="numeric"
            value={amount}
            returnKeyType="done"
            style={[styles.inputButton, { width: "65%" }]}
          />
          <Text style={styles.textInput}>THB</Text>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.sumbitContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => 
        router.push('/Budget')}>
          <Text>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveButton} onPress={handleCreateBudget}>
          <Text>Save</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 10,
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    elevation: 2, 
    shadowColor: "#000", 
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  rowTile: {
    flexDirection: "row", 
    alignItems: "center",
    marginBottom: 8,
  },
  iconTitle: {
    backgroundColor: "#4957AA",
    padding: 8,
    borderRadius: 25,
    marginRight: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginLeft: 5,
  },
  rowInput: {
    flexDirection: "row", 
    alignItems: "center",
  },
  inputButton: {
    flexDirection: "row",
    backgroundColor: "#4957AA40",
    borderRadius: 8,
    minHeight: 35,
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    width: "100%",
    borderWidth: 0,
  },
  textInput: {
    backgroundColor: "#4957AA40",
    borderRadius: 8,
    width: "25%",
    textAlign: "center",
    paddingVertical: 8,
    marginLeft: 20,
  },
  sumbitContainer: {
    flexDirection: "row",
    display: "flex",
    justifyContent: "space-around",
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: "#E2E2E2",
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#9AC9F3",
    paddingHorizontal: 60,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 16,
  },
});

export default CreateBudget;
