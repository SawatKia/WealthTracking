import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Picker } from "react-native";
import { useRouter } from "expo-router";

// ข้อมูลธนาคารที่มีให้เลือก
const bankList = [
    "Kasikorn",
    "Siam Commercial",
    "Bangkok Bank",
    "Krungthai",
    "TMB",
];

// ข้อมูลบัญชีธนาคารที่มีในระบบ
const initialAccounts = [
    { name: "Kasikorn", owner: "Miss Jane Cooper", accountNumber: "645-8-23195-9", balance: 25890.0 },
    { name: "Siam Commercial", owner: "John Doe", accountNumber: "217-1-65465-3", balance: 50000.0 },
];

export default function BankAccountScreen() {
    const [selectedBank, setSelectedBank] = useState("");
    const [accountName, setAccountName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [remainingBalance, setRemainingBalance] = useState("");
    const [accounts, setAccounts] = useState(initialAccounts); // ข้อมูลบัญชีที่มีในระบบ
    const router = useRouter();

    // ฟังก์ชันสำหรับบันทึกข้อมูลบัญชีใหม่
    const saveAccount = () => {
        if (selectedBank && accountName && accountNumber && remainingBalance) {
            const newAccount = {
                name: selectedBank,
                owner: accountName,
                accountNumber: accountNumber,
                balance: parseFloat(remainingBalance),
            };
            setAccounts([...accounts, newAccount]); // เพิ่มบัญชีใหม่
            clearFields(); // เคลียร์ฟิลด์หลังจากบันทึก
            router.push("/BankAccount"); // กลับไปที่หน้าหลัก
        }
    };

    // ฟังก์ชันสำหรับลบบัญชี
    const deleteAccount = (index: number) => {
        const updatedAccounts = accounts.filter((_, i) => i !== index);
        setAccounts(updatedAccounts);
    };

    // ฟังก์ชันสำหรับเคลียร์ฟิลด์
    const clearFields = () => {
        setSelectedBank("");
        setAccountName("");
        setAccountNumber("");
        setRemainingBalance("");
    };

    return (
        <View style={styles.container}>
            {/* ส่วนที่ 1 - ปุ่ม "Add New Bank Account" */}
            <TouchableOpacity style={styles.addButton} onPress={() => router.push("/AddAccountDetail")}>
                <Text style={styles.addButtonText}>Add New Bank Account</Text>
            </TouchableOpacity>

            {/* ส่วนที่ 2 - แสดงข้อมูลบัญชีธนาคาร */}
            <Text style={styles.sectionTitle}>Existing Bank Accounts</Text>
            <FlatList
                data={accounts}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => (
                    <View style={styles.accountCard}>
                        <View style={styles.accountInfo}>
                            <Text style={styles.accountName}>{item.name}</Text>
                            <Text style={styles.accountOwner}>{item.owner}</Text>
                            <Text style={styles.accountNumber}>Account Number: {item.accountNumber}</Text>
                            <Text style={styles.balanceText}>Balance: {item.balance.toFixed(2)} Baht</Text>
                        </View>
                        <TouchableOpacity style={styles.deleteButton} onPress={() => deleteAccount(index)}>
                            <Text style={styles.deleteButtonText}>🗑️</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />
        </View>
    );
}

export function AddAccountScreen() {
    const [selectedBank, setSelectedBank] = useState("");
    const [accountName, setAccountName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [remainingBalance, setRemainingBalance] = useState("");
    const [accounts, setAccounts] = useState(initialAccounts); // ข้อมูลบัญชีที่มีในระบบ
    const router = useRouter();

    // ฟังก์ชันสำหรับบันทึกข้อมูลบัญชีใหม่
    const saveAccount = () => {
        if (selectedBank && accountName && accountNumber && remainingBalance) {
            const newAccount = {
                name: selectedBank,
                owner: accountName,
                accountNumber: accountNumber,
                balance: parseFloat(remainingBalance),
            };
            setAccounts([...accounts, newAccount]); // เพิ่มบัญชีใหม่
            clearFields(); // เคลียร์ฟิลด์หลังจากบันทึก
            router.push("/BankAccount"); // กลับไปที่หน้าหลัก
        }
    };

    // ฟังก์ชันสำหรับลบบัญชี
    const deleteAccount = (index: number) => {
        const updatedAccounts = accounts.filter((_, i) => i !== index);
        setAccounts(updatedAccounts);
    };

    // ฟังก์ชันสำหรับเคลียร์ฟิลด์
    const clearFields = () => {
        setSelectedBank("");
        setAccountName("");
        setAccountNumber("");
        setRemainingBalance("");
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Add New Bank Account</Text>

            {/* ส่วนเลือกธนาคาร */}
            <Text style={styles.label}>Select Bank</Text>
            <Picker selectedValue={selectedBank} onValueChange={setSelectedBank} style={styles.input}>
                <Picker.Item label="Select Bank" value="" />
                {bankList.map((bank, index) => (
                    <Picker.Item key={index} label={bank} value={bank} />
                ))}
            </Picker>

            {/* ส่วนกรอกข้อมูลบัญชี */}
            <Text style={styles.label}>Account Name</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter Account Name"
                value={accountName}
                onChangeText={setAccountName}
            />

            <Text style={styles.label}>Account Number</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter Account Number"
                value={accountNumber}
                onChangeText={setAccountNumber}
            />

            <Text style={styles.label}>Remaining Balance</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter Remaining Balance"
                value={remainingBalance}
                onChangeText={setRemainingBalance}
                keyboardType="numeric"
            />

            {/* ปุ่ม Save หรือ Cancel */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={saveAccount}>
                    <Text style={styles.buttonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={clearFields}>
                    <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: "#f8f9fa" },
    header: { fontSize: 24, fontWeight: "bold", color: "#333", marginBottom: 20 },
    label: { fontSize: 16, marginBottom: 8, color: "#333" },
    input: {
        height: 40,
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: 8,
        paddingLeft: 10,
        marginBottom: 20,
        fontSize: 16,
    },
    buttonContainer: { flexDirection: "row", justifyContent: "space-between" },
    button: {
        backgroundColor: "#4957AA",
        padding: 12,
        borderRadius: 8,
        flex: 1,
        margin: 5,
        alignItems: "center",
    },
    buttonText: { color: "#fff", fontSize: 16 },
    sectionTitle: { fontSize: 20, fontWeight: "bold", color: "#333", marginTop: 30, marginBottom: 10 },
    addButton: {
        backgroundColor: "#4957AA",
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        alignItems: "center",
    },
    addButtonText: { color: "#fff", fontSize: 16 },
    accountCard: {
        flexDirection: "row",
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    accountInfo: { flex: 1 },
    accountName: { fontSize: 18, fontWeight: "bold", color: "#333" },
    accountOwner: { fontSize: 16, color: "#555" },
    accountNumber: { fontSize: 14, color: "#777" },
    balanceText: { fontSize: 16, fontWeight: "bold", color: "#4957AA" },
    deleteButton: { justifyContent: "center", alignItems: "center", marginLeft: 10 },
    deleteButtonText: { fontSize: 24, color: "#ff0000" },
});
