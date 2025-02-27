import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import DateTimePicker from "react-native-ui-datepicker";
import { useRouter } from "expo-router";
import dayjs from "dayjs";
import { Ionicons } from "@expo/vector-icons";
import { useDebt } from "../services/DebtService";
import { useAccount } from "../services/AccountService";
import { useTransactions } from "../services/TransactionService";

interface Account {
  display_name: string;
  fi_code: string;
  account_number: string;
}

const AddDebtDetail = () => {
  const [debtName, setDebtName] = useState("");
  const [date, setDate] = useState(dayjs());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [loanPrinciple, setLoanPrinciple] = useState("");
  const [totalInstallments, setTotalInstallments] = useState("");
  const [currentInstallment, setCurrentInstallment] = useState("");
  const [loanBalance, setLoanBalance] = useState("");
  const [paymentChannel, setPaymentChannel] = useState("");
  const [openPaymentChannel, setOpenPaymentChannel] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [amountPaid, setAmountPaid] = useState("");

    const { createDebt, getAllDebts } = useDebt();
    const { getAllAccounts } = useAccount();
    const { createTransaction } = useTransactions();
    const [bankAccounts, setBankAccounts] = useState<Account[]>([]);
    const router = useRouter();

  useEffect(() => {
    const fetchAccounts = async () => {
      const accounts = await getAllAccounts();
      setBankAccounts(accounts);
    };
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (loanPrinciple && totalInstallments && currentInstallment) {
      const principle = parseFloat(loanPrinciple);
      const totalInstall = parseFloat(totalInstallments);
      const currentInstall = parseFloat(currentInstallment);

      if (
        !isNaN(principle) &&
        !isNaN(totalInstall) &&
        !isNaN(currentInstall) &&
        totalInstall !== 0
      ) {
        const balance = principle - (principle / totalInstall) * currentInstall;
        setLoanBalance(balance.toFixed(2));

        // Calculate Amount Paid automatically
        const paid = principle - balance;
        setAmountPaid(paid.toFixed(2));
      }
    }
  }, [loanPrinciple, totalInstallments, currentInstallment]);

  const validateInputs = () => {
    const newErrors: { [key: string]: string } = {};

    if (!debtName.trim()) newErrors.debtName = "Debt Name is required";
    if (!date) newErrors.date = "Date is required";
    if (!loanPrinciple.trim())
      newErrors.loanPrinciple = "Loan Principle is required";
    if (!totalInstallments.trim())
      newErrors.totalInstallments = "Total Installments is required";
    if (!currentInstallment.trim())
      newErrors.currentInstallment = "Current Installment is required";
    if (!loanBalance.trim()) newErrors.loanBalance = "Loan Balance is required";
    if (!paymentChannel)
      newErrors.paymentChannel = "Payment Channel is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateInputs()) return;

    try {
      // Prepare debt details for API
      const debtDetails = {
        debt_name: debtName,
        start_date: dayjs(date).format("YYYY-MM-DD"),
        current_installment: Number(currentInstallment),
        total_installments: Number(totalInstallments),
        loan_principle: Number(loanPrinciple),
        loan_balance: Number(loanBalance),
        fi_code: paymentChannel,
      };

      console.log("Saving Debt Details:", debtDetails);

            // Call the createDebt function directly from DebtService
            await createDebt(debtDetails);

            // ดึงข้อมูลใหม่ก่อนกลับไปหน้า Debt
            await getAllDebts();

            // กลับไปหน้า Debt
            router.push("/(tabs)/Debt");
        } catch (error) {
            console.error("Error saving debt:", error);
            alert("Failed to save debt. Please try again.");
        }
    };

    const handleCancel = async () => {
        try {
            // ดึงข้อมูลใหม่ก่อนกลับไปหน้า Debt
            await getAllDebts();

            // กลับไปหน้า Debt
            router.push("/(tabs)/Debt");
        } catch (error) {
            console.error("Error refreshing debts:", error);
            router.push("/(tabs)/Debt");
        }
    };

    const onChangeDate = (params: any) => {
        setDate(params.date);
    };

  const handleDebtNameChange = (text: string) => {
    if (text.length <= 30) {
      setDebtName(text);
    }
  };

  const handleNumberInput = (
    text: string,
    setter: (value: string) => void,
    isDecimal: boolean = false
  ) => {
    const regex = isDecimal ? /^\d*\.?\d*$/ : /^\d*$/;
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
          <Text style={styles.title}>Debt Details</Text>

          {/* Debt Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name Of Debt</Text>
            <TextInput
              style={styles.input}
              value={debtName}
              onChangeText={handleDebtNameChange}
              placeholder="Enter Debt Name"
              maxLength={30}
            />
            {errors.debtName && (
              <Text style={styles.errorText}>{errors.debtName}</Text>
            )}
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
              {date ? <Text>{dayjs(date).format("DD MMM YYYY")}</Text> : "..."}
            </TouchableOpacity>
            {isDatePickerVisible && (
              <DateTimePicker
                mode="single"
                date={date}
                onChange={onChangeDate}
                timePicker={false}
              />
            )}
            {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
          </View>

          {/* Loan Principle Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Loan Principle</Text>
            <TextInput
              style={styles.input}
              value={loanPrinciple}
              onChangeText={(text) =>
                handleNumberInput(text, setLoanPrinciple, true)
              }
              placeholder="Enter Loan Principle"
              keyboardType="numeric"
            />
            {errors.loanPrinciple && (
              <Text style={styles.errorText}>{errors.loanPrinciple}</Text>
            )}
          </View>

          {/* Total Installments Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Total Installments</Text>
            <TextInput
              style={styles.input}
              value={totalInstallments}
              onChangeText={(text) =>
                handleNumberInput(text, setTotalInstallments)
              }
              placeholder="Enter Total Installments"
              keyboardType="numeric"
            />
            {errors.totalInstallments && (
              <Text style={styles.errorText}>{errors.totalInstallments}</Text>
            )}
          </View>

          {/* Current Installment Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Current Installment</Text>
            <TextInput
              style={styles.input}
              value={currentInstallment}
              onChangeText={(text) =>
                handleNumberInput(text, setCurrentInstallment)
              }
              placeholder="Enter Current Installment"
              keyboardType="numeric"
            />
            {errors.currentInstallment && (
              <Text style={styles.errorText}>{errors.currentInstallment}</Text>
            )}
          </View>

          {/* Amount Paid Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Amount Paid</Text>
            <TextInput
              style={styles.input}
              value={amountPaid}
              placeholder="Amount Paid"
              keyboardType="numeric"
              editable={false} // ทำให้ไม่สามารถแก้ไขได้
            />
          </View>

          {/* Loan Balance Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Remaining Balance</Text>
            <TextInput
              style={styles.input}
              value={loanBalance}
              onChangeText={(text) =>
                handleNumberInput(text, setLoanBalance, true)
              }
              placeholder="Enter Loan Balance"
              keyboardType="numeric"
              editable={false} // ทำให้ไม่สามารถแก้ไขได้
            />
            {errors.loanBalance && (
              <Text style={styles.errorText}>{errors.loanBalance}</Text>
            )}
          </View>

          {/* Payment Channel Picker */}
          <View style={[styles.inputContainer, { zIndex: 5000 }]}>
            <Text style={styles.label}>Payment Channel</Text>
            <DropDownPicker
              open={openPaymentChannel}
              value={paymentChannel}
              items={bankAccounts.map((account) => ({
                label: account.display_name,
                value: account.fi_code,
              }))}
              setOpen={setOpenPaymentChannel}
              setValue={setPaymentChannel}
              placeholder="Select Payment Channel..."
              searchable={true}
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownContainer}
              zIndex={5000}
              zIndexInverse={4000}
            />
            {errors.paymentChannel && (
              <Text style={styles.errorText}>{errors.paymentChannel}</Text>
            )}
          </View>

                    {/* Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.cancelButtonStyle} onPress={handleCancel}>
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
  dropdown: {
    height: 45,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 15,
  },
  dropdownContainer: { borderColor: "#ccc", borderRadius: 12 },
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
});

export default AddDebtDetail;
