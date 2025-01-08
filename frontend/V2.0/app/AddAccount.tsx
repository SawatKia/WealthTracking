import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Modal, Button } from "react-native";
import { useRouter } from "expo-router";

const initialAccounts = [
    { name: "Kasikorn", owner: "Miss Jane Cooper", accountNumber: "645-8-23195-9", balance: 25890.0 },
    { name: "Krungthai", owner: "Miss Jane Cooper", accountNumber: "217-1-65465-3", balance: 50000.0 },
];

export default function BankAccountScreen() {
    const [accounts, setAccounts] = useState(initialAccounts);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [accountToDelete, setAccountToDelete] = useState<number | null>(null); // Set the type of accountToDelete to number | null
    const router = useRouter();

    // ฟังก์ชันที่ใช้แสดงป๊อบอัพยืนยันการลบ
    const confirmDeleteAccount = (index: number) => { // Explicitly specify the type of index
        setAccountToDelete(index); // เก็บบัญชีที่ต้องการลบ
        setIsModalVisible(true); // แสดง modal
    };

    // ฟังก์ชันลบบัญชี
    const deleteAccount = () => {
        if (accountToDelete !== null) {
            const updatedAccounts = accounts.filter((_, i) => i !== accountToDelete);
            setAccounts(updatedAccounts);
            setIsModalVisible(false); // ซ่อน modal หลังจากลบ
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

            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#333' }}> Existing Bank Accounts</Text>
            <FlatList
                data={accounts}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }: { item: typeof initialAccounts[0]; index: number }) => ( // Specify the types of item and index
                    <View style={styles.accountCard}>
                        <View style={styles.accountInfo}>
                            <Text style={styles.accountName}>{item.name}</Text>
                            <Text style={styles.accountOwner}>{item.owner}</Text>
                            <Text style={styles.accountNumber}>Account Number : {item.accountNumber}</Text>
                            <Text style={styles.balanceText}>Balance : {item.balance.toFixed(2)} Baht</Text>
                        </View>
                        <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDeleteAccount(index)}>
                            <Image source={require("../assets/images/delete.png")} style={styles.deleteIcon} />
                        </TouchableOpacity>
                    </View>
                )}
            />

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
                            <Button title="Delete" color="red" onPress={deleteAccount} />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: "#F0F6FF" },
    addButton: {
        backgroundColor: "#4957AA",
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
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
    accountName: { fontSize: 14, fontWeight: "bold", color: "#333333", margin: 2 },
    accountOwner: { fontSize: 14, color: "#333333", margin: 2 },
    accountNumber: { fontSize: 14, color: "#333333", margin: 2 },
    balanceText: { fontSize: 14, color: "#4957AA", margin: 2 },
    deleteButton: { justifyContent: "center", alignItems: "center", marginLeft: 10 },
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
});
