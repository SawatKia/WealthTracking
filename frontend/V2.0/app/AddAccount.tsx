import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Modal, Button, ActivityIndicator, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Account, useAccount } from '../services/AccountService';
import { Ionicons } from '@expo/vector-icons'; // นำเข้าไอคอนจาก @expo/vector-icons

export default function BankAccountScreen() {
    const { getAllAccounts, deleteAccount } = useAccount();
    const router = useRouter();

    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<{ accountNumber: string, fiCode: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [accountLimitReached, setAccountLimitReached] = useState(false);

    // ดึงข้อมูลบัญชีจาก API
    useEffect(() => {
        const fetchAccounts = async () => {
            setLoading(true);
            const data = await getAllAccounts();
            if (data) {
                setAccounts(data);
                setAccountLimitReached(data.length >= 20); // Check if the account limit is reached
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
            const fiCode = selectedAccount.fiCode || '';
            const isDeleted = await deleteAccount(selectedAccount.accountNumber, fiCode);
            if (isDeleted) {
                // อัปเดต state โดยการกรองบัญชีที่ลบออก
                setAccounts(accounts.filter(acc => acc.account_number !== selectedAccount.accountNumber));
                setIsModalVisible(false);
                setAccountLimitReached(accounts.length - 1 >= 20); // Update the account limit status

                // ดึงข้อมูลบัญชีใหม่จาก API
                const updatedAccounts = await getAllAccounts();
                if (updatedAccounts) {
                    setAccounts(updatedAccounts);
                    setAccountLimitReached(updatedAccounts.length >= 20); // Update the account limit status
                }
            } else {
                alert('Failed to delete account. Please try again.');
            }
        }
    };

    return (
        <View style={styles.container}>
            {/* ปุ่มย้อนกลับ */}
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>

            {/* เนื้อหาหลัก */}
            <View style={styles.content}>
                <TouchableOpacity
                    style={[styles.addButton, accountLimitReached && styles.disabledButton]}
                    onPress={() => !accountLimitReached && router.push("/AddAccountDetail")}
                    disabled={accountLimitReached}
                >
                    <View style={styles.addButtonContent}>
                        <Image source={require("../assets/images/bank_icon.png")} style={styles.addButtonIcon} />
                        <Text style={styles.addButtonText}>Add New Bank Account</Text>
                    </View>
                </TouchableOpacity>

                {accountLimitReached && (
                    <Text style={styles.limitMessage}>Maximum number of accounts (20) reached. Please delete an account to add a new one.</Text>
                )}

                <Text style={styles.sectionTitle}>Existing Bank Accounts</Text>

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
                                    <Text style={styles.balanceText}>Balance: {parseFloat(item.balance).toFixed(2)} Baht</Text>
                                </View>
                                <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDeleteAccount(item.account_number, item.fi_code)}>
                                    <Image source={require("../assets/images/delete.png")} style={styles.deleteIcon} />
                                </TouchableOpacity>
                            </View>
                        )}
                        contentContainerStyle={styles.flatListContent}
                        style={styles.flatList}
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F0F6FF",
    },
    backButton: {
        position: "absolute",
        top: 50, // ปรับตำแหน่งให้อยู่ด้านบน
        left: 16,
        zIndex: 1,
    },
    content: {
        marginTop: 80, // ให้เนื้อหาทั้งหมดเลื่อนลงมาจากปุ่มย้อนกลับ
        paddingHorizontal: 16,
        flex: 1,
    },
    addButton: {
        backgroundColor: "#4957AA",
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
    },
    disabledButton: {
        backgroundColor: "#A9A9A9", // Change the color when the button is disabled
    },
    addButtonContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    addButtonIcon: {
        width: 30,
        height: 30,
        marginRight: 8,
    },
    addButtonText: {
        color: "#fff",
        fontSize: 16,
    },
    limitMessage: {
        color: "red",
        fontSize: 14,
        marginBottom: 16,
        textAlign: "center",
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 16,
    },
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
    accountInfo: {
        flex: 1,
    },
    accountName: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#333",
        margin: 2,
    },
    accountOwner: {
        fontSize: 14,
        color: "#333",
        margin: 2,
    },
    accountNumber: {
        fontSize: 14,
        color: "#333",
        margin: 2,
    },
    balanceText: {
        fontSize: 14,
        color: "#4957AA",
        margin: 2,
    },
    deleteButton: {
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 10,
    },
    deleteIcon: {
        width: 25,
        height: 25,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
        backgroundColor: "white",
        padding: 20,
        borderRadius: 8,
        width: 300,
        alignItems: "center",
    },
    modalText: {
        fontSize: 16,
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-around",
        width: "100%",
    },
    flatListContent: {
        paddingBottom: 20, // เพิ่ม padding ด้านล่างเพื่อให้เนื้อหาไม่ติดขอบ
    },
    flatList: {
        flex: 1, // ให้ FlatList ขยายเต็มพื้นที่
    },
});