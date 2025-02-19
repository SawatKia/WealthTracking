import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import DateTimePicker from "react-native-ui-datepicker";
import { useRouter } from "expo-router";
import dayjs from "dayjs";
import { Ionicons } from "@expo/vector-icons";
import { useDebt } from '../services/DebtService';

const debtCategories = [
    { label: "Credit Card Debt", value: "Credit Card Debt", fi_code: "001" },
    { label: "Mortgage Debt", value: "Mortgage Debt", fi_code: "002" },
    { label: "Car Loan Debt", value: "Car Loan Debt", fi_code: "003" },
    { label: "Student Loan Debt", value: "Student Loan Debt", fi_code: "004" },
    { label: "Other", value: "Other", fi_code: "005" },
];

const AddDebtDetail = () => {
    const [debtName, setDebtName] = useState("");
    const [category, setCategory] = useState(null);
    const [date, setDate] = useState(dayjs());
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [amount, setAmount] = useState("");
    const [installmentAmount, setInstallmentAmount] = useState("");
    const [totalInstallments, setTotalInstallments] = useState("");
    const [paymentChannel, setPaymentChannel] = useState("");
    const [openCategory, setOpenCategory] = useState(false);

    const { createDebt } = useDebt();  // Access createDebt function
    const router = useRouter();

    const handleSave = () => {
        const selectedCategory = debtCategories.find(cat => cat.value === category);

        const debtDetails = {
            debt_name: debtName,
            start_date: dayjs(date).format("YYYY-MM-DD HH:mm"),
            current_installment: 1,
            total_installments: Number(totalInstallments),
            loan_principle: Number(amount),
            loan_balance: Number(amount),
            fi_code: selectedCategory ? selectedCategory.fi_code : null,
        };

        console.log("Saved Debt Details:", debtDetails);
        createDebt(debtDetails);
        router.push("/(tabs)/Debt");
    };


    const onChangeDate = (params: any) => {
        setDate(params.date);
    };

    return (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            <View style={styles.container}>
                <View style={styles.inputWrapper}>
                    <Text style={styles.title}>Debt Details</Text>

                    {/* Debt Name Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Name Of Debt</Text>
                        <TextInput
                            style={styles.input}
                            value={debtName}
                            onChangeText={setDebtName}
                            placeholder="Enter Debt Name"
                        />
                    </View>

                    {/* Category Picker */}
                    <View style={[styles.inputContainer, { zIndex: 5000 }]}>
                        <Text style={styles.label}>Category</Text>
                        <DropDownPicker
                            open={openCategory}
                            value={category}
                            items={debtCategories.map((cat) => ({ label: cat.label, value: cat.value }))}
                            setOpen={setOpenCategory}
                            setValue={setCategory}
                            placeholder="Select Category..."
                            style={styles.dropdown}
                            dropDownContainerStyle={styles.dropdownContainer}
                            zIndex={5000}
                            zIndexInverse={4000}
                        />
                    </View>

                    {/* Date & Time Picker */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Date & Time</Text>
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
                            {date ? <Text>{dayjs(date).format("DD MMM YYYY ")}</Text> : "..."}

                            <Ionicons
                                name="time"
                                size={20}
                                style={styles.iconInput}
                                color="#9AC9F3"
                            />
                            {date ? <Text>{dayjs(date).format("HH:mm")}</Text> : "..."}

                        </TouchableOpacity>
                        {isDatePickerVisible && (
                            <DateTimePicker
                                mode="single"
                                date={date}
                                onChange={onChangeDate}
                                timePicker={true}
                            />
                        )}
                    </View>

                    {/* Amount Of Money Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Amount Of Money</Text>
                        <TextInput
                            style={styles.input}
                            value={amount}
                            onChangeText={setAmount}
                            placeholder="Enter Amount"
                            keyboardType="numeric"
                        />
                    </View>

                    {/* Amount Per Installment Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Amount Per Installment</Text>
                        <TextInput
                            style={styles.input}
                            value={installmentAmount}
                            onChangeText={setInstallmentAmount}
                            placeholder="Enter Installment Amount"
                            keyboardType="numeric"
                        />
                    </View>

                    {/* Total Number of Installments Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Total Number of Installments</Text>
                        <TextInput
                            style={styles.input}
                            value={totalInstallments}
                            onChangeText={setTotalInstallments}
                            placeholder="Enter Total Installments"
                            keyboardType="numeric"
                        />
                    </View>

                    {/* Payment Channel Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Payment Channel</Text>
                        <TextInput
                            style={styles.input}
                            value={paymentChannel}
                            onChangeText={setPaymentChannel}
                            placeholder="Enter Payment Channel"
                        />
                    </View>

                    {/* Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.cancelButtonStyle} onPress={() => router.push("/(tabs)/Debt")}>
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
    inputWrapper: { backgroundColor: "#fff", borderRadius: 16, padding: 20, shadowOpacity: 0.1, marginTop: 20 },
    title: { fontSize: 16, fontWeight: "600", textAlign: "center", marginBottom: 20 },
    inputContainer: { marginBottom: 20 },
    label: { fontSize: 14, marginBottom: 8 },
    input: { height: 45, borderColor: "#ccc", borderWidth: 1, borderRadius: 12, paddingLeft: 15, fontSize: 14, justifyContent: "center" },
    dropdown: { height: 45, borderColor: "#ccc", borderWidth: 1, borderRadius: 12, paddingLeft: 15 },
    dropdownContainer: { borderColor: "#ccc", borderRadius: 12 },
    buttonContainer: { flexDirection: "row", justifyContent: "space-between" },
    cancelButtonStyle: { backgroundColor: "#E2E2E2", paddingVertical: 12, paddingHorizontal: 35, borderRadius: 8 },
    saveButton: { backgroundColor: "#9AC9F3", paddingVertical: 12, paddingHorizontal: 50, borderRadius: 8 },
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
});

export default AddDebtDetail;