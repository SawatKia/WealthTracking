import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Modal, Button, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Account, useAccount } from '../services/AccountService';

export default function BankAccountScreen() {
    const { getAllAccounts, deleteAccount } = useAccount();
    const router = useRouter();

    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<{ accountNumber: string, fiCode: string } | null>(null);
    const [loading, setLoading] = useState(true);

    // ดึงข้อมูลบัญชีจาก API
    useEffect(() => {
        const fetchAccounts = async () => {
            setLoading(true);
            const data = await getAllAccounts();
            if (data) {
                setAccounts(data);
            }
            setLoading(false);
        };

        fetchAccounts();
    }, []);

    // ฟังก์ชันแสดง Modal ยืนยันการลบ
    const confirmDeleteAccount = (accountNumber: string, fiCode: string) => {
        setSelectedAccount({ accountNumber, fiCode });
        setIsModalVisible(true);
    };

    // ฟังก์ชันลบบัญชี (เชื่อมกับ API)
    const handleDeleteAccount = async () => {
        if (selectedAccount) {
            const fiCode = selectedAccount.fiCode || '';  // เปลี่ยน fiCode ที่เป็น null เป็น string ว่าง
            await deleteAccount(selectedAccount.accountNumber, fiCode);
            setAccounts(accounts.filter(acc => acc.account_number !== selectedAccount.accountNumber));
            setIsModalVisible(false);
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.addButton} onPress={() => router.push("/AddAccountDetail")}>
                <View style={styles.addButtonContent}>
                    <Image source={require("../assets/images/bank_icon.png")} style={styles.addButtonIcon} />
                    <Text style={styles.addButtonText}>Add New Bank Account</Text>
                </View>
            </TouchableOpacity>

            <Text style={{ fontSize: 20, fontWeight: "bold", color: "#333" }}>Existing Bank Accounts</Text>

            {loading ? (
                <ActivityIndicator size="large" color="#4957AA" />
            ) : (
                <FlatList
                    data={accounts}
                    keyExtractor={(item) => item.account_number}
                    renderItem={({ item }) => (
                        <View style={styles.accountCard}>
                            <View style={styles.accountInfo}>
                                <Text style={styles.accountName}>{item.account_name}</Text>
                                <Text style={styles.accountOwner}>{item.display_name}</Text>
                                <Text style={styles.accountNumber}>Account Number: {item.account_number}</Text>
                                <Text style={styles.balanceText}>Balance: {item.balance.toFixed(2)} Baht</Text>
                            </View>
                            <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDeleteAccount(item.account_number, item.fi_code)}>
                                <Image source={require("../assets/images/delete.png")} style={styles.deleteIcon} />
                            </TouchableOpacity>
                        </View>
                    )}
                />
            )}

            {/* Modal สำหรับยืนยันการลบ */}
            <Modal
                visible={isModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalText}>Are you sure you want to delete this bank account?</Text>
                        <View style={styles.modalButtons}>
                            <Button title="Cancel" onPress={() => setIsModalVisible(false)} />
                            <Button title="Delete" color="red" onPress={handleDeleteAccount} />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: "#F0F6FF" },
    addButton: { backgroundColor: "#4957AA", padding: 12, borderRadius: 8, marginBottom: 20 },
    addButtonContent: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
    addButtonIcon: { width: 30, height: 30, marginRight: 8 },
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
    accountName: { fontSize: 14, fontWeight: "bold", color: "#333", margin: 2 },
    accountOwner: { fontSize: 14, color: "#333", margin: 2 },
    accountNumber: { fontSize: 14, color: "#333", margin: 2 },
    balanceText: { fontSize: 14, color: "#4957AA", margin: 2 },
    deleteButton: { justifyContent: "center", alignItems: "center", marginLeft: 10 },
    deleteIcon: { width: 25, height: 25 },
    modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0.5)" },
    modalContent: { backgroundColor: "white", padding: 20, borderRadius: 8, width: 300, alignItems: "center" },
    modalText: { fontSize: 16, marginBottom: 20 },
    modalButtons: { flexDirection: "row", justifyContent: "space-around", width: "100%" },
});