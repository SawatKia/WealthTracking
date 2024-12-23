import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Picker } from "react-native";
import { useRouter } from "expo-router";

const AddAccountDetail = () => {
    const [bankName, setBankName] = useState("");
    const [accountName, setAccountName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [remainingBalance, setRemainingBalance] = useState("");
    const router = useRouter();

    const handleSave = () => {
        // Logic to save the account details can go here
        console.log("Saved Account Details:", {
            bankName,
            accountName,
            accountNumber,
            remainingBalance,
        });
        // Logic to update account information could go here (e.g., sending data to a backend or state management)
        // Navigate back to the Bank Account page after saving
        router.push("/BankAccount");
    };

    const handleCancel = () => {
        // Logic for canceling, like clearing input or just navigating back
        router.push("/BankAccount");
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Bank Account Details</Text>

            {/* เลือกธนาคาร */}
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Bank Name</Text>
                <Picker
                    selectedValue={bankName}
                    onValueChange={(itemValue) => setBankName(itemValue)}
                    style={styles.picker}
                >
                    <Picker.Item label="Kasikorn" value="Kasikorn" />
                    <Picker.Item label="Siam Commercial" value="Siam Commercial" />
                    <Picker.Item label="Bangkok Bank" value="Bangkok Bank" />
                    <Picker.Item label="Krungthai" value="Krungthai" />
                    <Picker.Item label="Bank of Ayudhya" value="Bank of Ayudhya" />
                </Picker>
            </View>

            {/* กรอกชื่อบัญชี */}
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Account Name</Text>
                <TextInput
                    style={styles.input}
                    value={accountName}
                    onChangeText={setAccountName}
                    placeholder="Enter Account Name"
                />
            </View>

            {/* กรอกหมายเลขบัญชี */}
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Account Number</Text>
                <TextInput
                    style={styles.input}
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    placeholder="Enter Account Number"
                    keyboardType="numeric"
                />
            </View>

            {/* กรอกยอดเงินคงเหลือ */}
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Remaining Balance</Text>
                <TextInput
                    style={styles.input}
                    value={remainingBalance}
                    onChangeText={setRemainingBalance}
                    placeholder="Enter Remaining Balance"
                    keyboardType="numeric"
                />
            </View>

            {/* ปุ่ม Save และ Cancel */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                    <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.buttonText}>Save</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#f8f9fa",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center",
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: "500",
        marginBottom: 8,
    },
    input: {
        height: 40,
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: 4,
        paddingLeft: 10,
        fontSize: 16,
        backgroundColor: "#fff",
    },
    picker: {
        height: 40,
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: 4,
        backgroundColor: "#fff",
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    cancelButton: {
        backgroundColor: "#f44336",
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 5,
    },
    saveButton: {
        backgroundColor: "#4957AA",
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 5,
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "500",
    },
});

export default AddAccountDetail;
