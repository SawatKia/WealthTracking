import { StatusBar } from "expo-status-bar";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Modal,
} from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import DateTimePicker from "react-native-ui-datepicker";
import DropDownPicker from "react-native-dropdown-picker";
import dayjs from "dayjs";
import SelectCategoryModal from "./SelectCategoryModal";

const CreateBudget = () => {
  const [date, setDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState({ type: '', category: '' });
  const [isCategoryPickerVisible, setCategoryPickerVisibility] = useState(false);
  const [selectedAccountValue, setSelectedAccountValue] = useState(null);
  const [isAccountPickerVisible, setAccountPickerVisibility] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [accountItems, setAccountItems] = useState([]); // Example: empty for now
  const [sizeOption] = useState(1); // Example size option for dropdown
  const [isAccountTransPickerVisible, setAccountTransPickerVisibility] = useState(false);
  const [selectedAccountTransValue, setSelectedAccountTransValue] = useState(null);

  const handleSelectCategory = (category: string,type: string) => {
    setSelectedCategory({ category, type });
    setCategoryPickerVisibility(false);
  };

  const handleCreateTransaction = () => {
    // Handle creating the transaction (only frontend, no backend call)
    console.log("Transaction created with data:", {
      date,
      selectedCategory,
      selectedAccountValue,
      amount,
      note,
    });
  };

  return (
    <KeyboardAwareScrollView>
      {/* date & time */}
      <View style={styles.container}>
        <View style={styles.rowTile}>
          <Ionicons name="calendar-clear" style={styles.iconTitle} size={20} color="#fff" />
          <Text style={styles.title}>Date and time</Text>
        </View>

        <View style={styles.rowInput}>
          <View style={styles.inputsContainer}>
            <TouchableOpacity
              style={styles.inputButton}
              onPress={() => setDatePickerVisibility(!isDatePickerVisible)}
            >
              <Ionicons name="calendar" size={20} style={styles.iconInput} color="#9AC9F3" />
              {date ? <Text>{dayjs(date).format("DD MMM YYYY ")}</Text> : "..."}
              <Ionicons name="time" size={20} style={styles.iconInput} color="#9AC9F3" />
              {date ? <Text>{dayjs(date).format("HH:mm")}</Text> : "..."}
            </TouchableOpacity>

            {isDatePickerVisible && (
              <DateTimePicker
                mode="single"
                date={date}
                onChange={(date) => setDate(date)}
                timePicker={true}
              />
            )}
          </View>
        </View>
      </View>

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
        <SelectCategoryModal selected={selectedCategory.category} onSelect={handleSelectCategory} />
      </Modal>

      <View style={styles.container}>
        <View style={styles.rowTile}>
          <Ionicons name="albums" style={styles.iconTitle} size={20} color="#fff" />
          <Text style={styles.title}>{selectedCategory.type === 'Transfer' ? 'Sender Account' : 'Account'}</Text>
        </View>

        <View style={styles.rowInput}>
          <DropDownPicker
            open={isAccountPickerVisible}
            multiple={false}
            value={selectedAccountValue}
            items={accountItems}
            setOpen={setAccountPickerVisibility}
            setValue={setSelectedAccountValue}
            setItems={setAccountItems}
            placeholder="[Select Account]"
            style={styles.inputButton}
            textStyle={{ textAlign: "center" }}
          />
        </View>
      </View>

      {selectedCategory.type === 'Transfer' && (
        <View style={styles.container}>
          <View style={styles.rowTile}>
            <Ionicons name="albums" style={styles.iconTitle} size={20} color="#fff" />
            <Text style={styles.title}>Receiver Account</Text>
          </View>

          <View style={styles.rowInput}>
            <DropDownPicker
              open={isAccountTransPickerVisible}
              multiple={false}
              value={selectedAccountTransValue}
              items={accountItems}
              setOpen={setAccountTransPickerVisibility}
              setValue={setSelectedAccountTransValue}
              setItems={setAccountItems}
              placeholder="[Select Account]"
              style={styles.inputButton}
              textStyle={{ textAlign: "center" }}
            />
          </View>
        </View>
      )}

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

      <View style={styles.container}>
        <View style={styles.rowTile}>
          <Ionicons name="shapes" style={[styles.iconTitle, { backgroundColor: "#9AC9F3" }]} size={20} color="#fff" />
          <Text style={styles.title}>Detail</Text>
          <Text style={{ color: "#00000040" }}> *Optional</Text>
        </View>

        <View style={styles.rowInput}>
          <TextInput
            style={[styles.inputButton, { backgroundColor: "#9AC9F357" }]}
            returnKeyType="done"
            onChangeText={setNote}
            value={note}
          />
        </View>
      </View>

      <View style={styles.sumbitContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => { /* Add cancel logic */ }}>
          <Text>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveButton} onPress={handleCreateTransaction}>
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
  inputsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "90%",
    marginLeft: 40,
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
  iconInput: {
    marginHorizontal: 10,
    backgroundColor: "white",
    borderRadius: 5,
    padding: 3,
  },
  dropdownContainer: {
    borderRadius: 8,
    backgroundColor: "#BEC2E0",
    borderWidth: 0,
    zIndex: 1,
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
