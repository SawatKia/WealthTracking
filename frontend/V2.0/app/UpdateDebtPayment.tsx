import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import DateTimePicker from "react-native-ui-datepicker";
import { useRouter, useLocalSearchParams } from 'expo-router';
import dayjs from "dayjs";
import { Ionicons } from "@expo/vector-icons";
import { useDebt } from "../services/DebtService";

const UpdateDebtPayment = () => {
    const { debtId } = useLocalSearchParams<{ debtId: string }>();
    const [date, setDate] = useState(dayjs());
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [detail, setDetail] = useState("");
    const [category, setCategory] = useState("Expense : Debt Payment"); // เพิ่ม state สำหรับ category
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const router = useRouter();
    const { updateDebtPayment } = useDebt();

    const validateInputs = () => {
        const newErrors: { [key: string]: string } = {};

        if (!date) newErrors.date = "Date is required";
        if (!paymentAmount.trim()) newErrors.paymentAmount = "Payment Amount is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateInputs()) return;

        const paymentDetails = {
            date: dayjs(date).format("YYYY-MM-DD HH:mm"),
            paymentAmount: Number(paymentAmount),
            detail: detail,
            category: category,
        };

        try {
            await updateDebtPayment(debtId, paymentDetails);
            Alert.alert("Success", "Debt payment updated successfully");
            router.push("/(tabs)/Debt");
        } catch (error) {
            Alert.alert("Error", "Failed to update debt payment");
            console.error("Error updating debt payment:", error);
        }
    };

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
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            <View style={styles.container}>
                <View style={styles.inputWrapper}>
                    <Text style={styles.title}>Update Debt</Text>

                    {/* Category Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Category <Text style={styles.redLabel}>(Cannot be edited)</Text></Text>
                        <TextInput
                            style={styles.input}
                            value={category}
                            editable={false} // ไม่สามารถแก้ไขได้
                        />
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
                            {date ? <Text>{dayjs(date).format("DD MMM YYYY HH:mm")}</Text> : "..."}
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
                        {errors.paymentAmount && <Text style={styles.errorText}>{errors.paymentAmount}</Text>}
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
    errorText: {
        color: "red",
        fontSize: 12,
        marginTop: 5,
    },
    redLabel: {
        color: "red",
        fontSize: 12,
    },
});

export default UpdateDebtPayment;