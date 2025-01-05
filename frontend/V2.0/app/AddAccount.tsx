import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { useRouter } from "expo-router";

// Initial user bank accounts
const initialAccounts = [
    { name: "Kasikorn", owner: "Miss Jane Cooper", accountNumber: "645-8-23195-9", balance: 25890.0 },
    { name: "Krungthai", owner: "John Doe", accountNumber: "217-1-65465-3", balance: 50000.0 },
];

export default function BankAccountScreen() {
    const [accounts, setAccounts] = useState(initialAccounts);
    const router = useRouter();

    // Function to delete an account
    const deleteAccount = (index: number) => {
        const updatedAccounts = accounts.filter((_, i) => i !== index);
        setAccounts(updatedAccounts);
    };

    return (
        <View style={styles.container}>
            {/* Button to add a new bank account */}
            <TouchableOpacity style={styles.addButton} onPress={() => router.push("/AddAccountDetail")}>
                <Text style={styles.addButtonText}>Add New Bank Account</Text>
            </TouchableOpacity>

            {/* Display user bank accounts */}
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

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: "#F0F6FF" },
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
