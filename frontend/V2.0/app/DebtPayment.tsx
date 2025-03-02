import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import DateTimePicker from "react-native-ui-datepicker";
import { useRouter, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import { Ionicons } from "@expo/vector-icons";
import { useDebt } from "../services/DebtService";
import { useTransactions } from "../services/TransactionService";
import { useAccount } from "../services/AccountService";
import DropDownPicker from "react-native-dropdown-picker";

const UpdateDebtPayment = () => {
  const { debtId } = useLocalSearchParams<{ debtId: string }>();
  const [date, setDate] = useState(dayjs());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [detail, setDetail] = useState("");
  const [category, setCategory] = useState("Expense : Debt Payment");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [paymentChannel, setPaymentChannel] = useState<string | null>(null);
  const [originalFiCode, setOriginalFiCode] = useState<string | null>(null);
  const [accountItems, setAccountItems] = useState<
    { label: string; value: string }[]
  >([]);
  const [isAccountPickerVisible, setAccountPickerVisibility] = useState(false);
  const [paymentChannelPlaceholder, setPaymentChannelPlaceholder] = useState(
    "Select Payment Channel"
  );

  const router = useRouter();
  const { updateDebtPayment, getAllDebts, updateDebt } = useDebt();
  const { createTransaction } = useTransactions();
  const { getAllAccounts } = useAccount();

  useEffect(() => {
    const fetchDebtAndAccounts = async () => {
      const debts = await getAllDebts();
      const selectedDebt = debts.find((debt) => debt.debt_id === debtId);

      if (selectedDebt) {
        // Store the original fi_code for reference
        setOriginalFiCode(selectedDebt.fi_code);

        // Find the matching account to get complete account details
        const accounts = await getAllAccounts();
        const matchingAccount = accounts.find(
          (account) => account.fi_code === selectedDebt.fi_code
        );

        if (matchingAccount) {
          // Store the complete account info (both fi_code and account_number)
          setPaymentChannel(
            JSON.stringify({
              account_number: matchingAccount.account_number,
              fi_code: matchingAccount.fi_code,
            })
          );
          setPaymentChannelPlaceholder(matchingAccount.display_name);
        } else if (selectedDebt.fi_code) {
          // If no matching account but we have fi_code, still set it
          setPaymentChannel(
            JSON.stringify({
              account_number: "",
              fi_code: selectedDebt.fi_code,
            })
          );
          setPaymentChannelPlaceholder(selectedDebt.fi_code);
        }

        // Prepare dropdown items
        const accountItems = accounts.map((account) => ({
          label: account.display_name,
          value: JSON.stringify({
            account_number: account.account_number,
            fi_code: account.fi_code,
          }),
        }));
        setAccountItems(accountItems);
      }
    };

    fetchDebtAndAccounts();
  }, [debtId]);

  const validateInputs = () => {
    const newErrors: { [key: string]: string } = {};

    if (!date) newErrors.date = "Date is required";
    if (!paymentAmount.trim())
      newErrors.paymentAmount = "Payment Amount is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

    // In DebtPayment.tsx
    const handleSave = async () => {
        if (!validateInputs()) return;

    try {
      const selectedAccountObj = paymentChannel
        ? JSON.parse(paymentChannel)
        : null;
      const selectedFiCode = selectedAccountObj
        ? selectedAccountObj.fi_code
        : originalFiCode;

            const paymentDetails: any = {
                date: dayjs(date).format("YYYY-MM-DD HH:mm"),
                paymentAmount: Number(paymentAmount),
                detail: detail
            };

            await updateDebtPayment(debtId, paymentDetails);

            if (selectedFiCode !== originalFiCode) {
                await updateDebt(debtId, {
                    fi_code: selectedFiCode
                });
                console.log("Updated debt fi_code to:", selectedFiCode);
            }

            const transactionDetails = {
                transaction_datetime: dayjs(date).format("YYYY-MM-DD HH:mm"),
                category: "Expense",
                type: "Debt Payment",
                amount: Number(paymentAmount),
                note: detail,
                debt_id: debtId,
                sender: {
                    account_number: selectedAccountObj ? selectedAccountObj.account_number : "",
                    fi_code: selectedFiCode,
                },
            };

      await createTransaction(transactionDetails);

            Alert.alert("Success", "Debt payment updated successfully");
            router.push("/(tabs)/Debt");
        } catch (error) {
            Alert.alert("Error", "Failed to update debt payment");
            console.error("Error updating debt payment:", error);
        }
    };;

  const onChangeDate = (params: any) => {
    setDate(params.date);
  };

  const handleNumberInput = (text: string, setter: (value: string) => void) => {
    const regex = /^\d*\.?\d*$/;
    if (regex.test(text)) {
      setter(text);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.container}>
        <View style={styles.inputWrapper}>
          <Text style={styles.title}>Update Debt</Text>

          {/* Category Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Category <Text style={styles.redLabel}>(Cannot be edited)</Text>
            </Text>
            <TextInput style={styles.input} value={category} editable={false} />
          </View>

          {/* Date Picker */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity
              style={styles.inputButton}
              onPress={() => setDatePickerVisibility(!isDatePickerVisible)}
            >
              <Ionicons
                name="calendar"
                size={20}
                style={styles.iconInput}
                color="#9AC9F3"
              />
              {date ? (
                <Text>{dayjs(date).format("DD MMM YYYY HH:mm")}</Text>
              ) : (
                "..."
              )}
            </TouchableOpacity>
            {isDatePickerVisible && (
              <DateTimePicker
                mode="single"
                date={date}
                onChange={onChangeDate}
                timePicker={true}
              />
            )}
            {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
          </View>

          {/* Payment Amount Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Payment Amount</Text>
            <TextInput
              style={styles.input}
              value={paymentAmount}
              onChangeText={(text) => handleNumberInput(text, setPaymentAmount)}
              placeholder="Enter Payment Amount"
              keyboardType="numeric"
            />
            {errors.paymentAmount && (
              <Text style={styles.errorText}>{errors.paymentAmount}</Text>
            )}
          </View>

          {/* Payment Channel Input */}
          <View style={[styles.inputContainer, { zIndex: 1000 }]}>
            <Text style={styles.label}>Payment Channel</Text>
            <DropDownPicker
              open={isAccountPickerVisible}
              value={paymentChannel}
              items={accountItems}
              setOpen={setAccountPickerVisibility}
              setValue={setPaymentChannel}
              setItems={setAccountItems}
              placeholder={paymentChannelPlaceholder}
              searchable={true}
              style={[styles.dropdown, { zIndex: 1000 }]}
              dropDownContainerStyle={[
                styles.dropdownContainer,
                { zIndex: 1000 },
              ]}
              zIndex={1000}
              zIndexInverse={3000}
            />
          </View>

          {/* Detail Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Detail (Optional)</Text>
            <TextInput
              style={styles.input}
              value={detail}
              onChangeText={setDetail}
              placeholder="Enter Detail"
            />
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButtonStyle}
              onPress={() => router.push("/(tabs)/Debt")}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F0F6FF" },
  inputWrapper: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowOpacity: 0.1,
    marginTop: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
  },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, marginBottom: 8 },
  input: {
    height: 45,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 15,
    fontSize: 14,
    justifyContent: "center",
  },
  buttonContainer: { flexDirection: "row", justifyContent: "space-between" },
  cancelButtonStyle: {
    backgroundColor: "#E2E2E2",
    paddingVertical: 12,
    paddingHorizontal: 35,
    borderRadius: 8,
  },
  saveButton: {
    backgroundColor: "#9AC9F3",
    paddingVertical: 12,
    paddingHorizontal: 50,
    borderRadius: 8,
  },
  buttonText: { fontSize: 16, fontWeight: "600" },
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
  iconInput: {
    marginHorizontal: 10,
    backgroundColor: "white",
    borderRadius: 5,
    padding: 3,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 5,
  },
  redLabel: {
    color: "red",
    fontSize: 12,
  },
  dropdown: {
    height: 45,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 15,
    fontSize: 14,
    color: "#333",
  },
  dropdownContainer: {
    borderColor: "#ccc",
    borderRadius: 12,
    backgroundColor: "#fff",
  },
});

export default UpdateDebtPayment;
