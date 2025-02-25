import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { useRouter } from "expo-router";
import { useAccount } from '../services/AccountService';

const AddAccountDetail = () => {
    const [fi_code, setFi_code] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const [display_name, setDisplay_name] = useState<string>("");
    const [account_name, setAccount_name] = useState<string>("");
    const [account_number, setAccount_number] = useState<string>("");
    const [balance, setBalance] = useState<string>("");
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [bankList, setBankList] = useState<{ label: string; value: string }[]>([]);
    const { createAccount, getAllAccounts, getAllfi_code } = useAccount();
    const router = useRouter();

    useEffect(() => {
        const fetchBankData = async () => {
            const fiCodes = await getAllfi_code();
            const bankOptions = fiCodes.map(bank => ({
                label: bank.name_en, // หรือ name_th ตามที่คุณต้องการ
                value: bank.fi_code
            }));
            setBankList(bankOptions); // เก็บข้อมูลธนาคารใน state
        };

        fetchBankData();
    }, []);

    const validateInputs = () => {
        const newErrors: { [key: string]: string } = {};

        if (!fi_code) newErrors.fi_code = "Bank Name is required";
        if (!display_name) newErrors.display_name = "Display Name is required";
        if (!account_name) newErrors.account_name = "Account Name is required";
        if (!account_number) newErrors.account_number = "Account Number is required";
        if (!balance) newErrors.balance = "Remaining Balance is required";

        if (display_name.length > 30) {
            newErrors.display_name = "Display Name must be no more than 30 characters";
        }

        // New validation for account_name - only letters and spaces allowed
        if (!/^[a-zA-Z\s]+$/.test(account_name)) {
            newErrors.account_name = "Account Name must contain only letters and spaces";
        }

        if (!/^\d{10}$/.test(account_number)) {
            newErrors.account_number = "Account Number must be exactly 10 digits";
        }

        if (!/^\d+(\.\d{1,2})?$/.test(balance)) {
            newErrors.balance = "Remaining Balance must be a valid number";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateInputs()) return;

        const accountDetails = {
            account_number,
            fi_code,
            display_name,
            account_name,
            balance: balance.toString(),
        };

        await createAccount(accountDetails);
        await getAllAccounts();
        router.push("/(tabs)/Account");
    };

    const handleCancel = () => {
        router.push("/(tabs)/Account");
    };

    return (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            <View style={styles.container}>
                <View style={styles.inputWrapper}>
                    <Text style={styles.title}>Bank Account Details</Text>

                    {/* Bank Name Picker */}
                    <View style={[styles.inputContainer, { zIndex: 5000 }]}>
                        <Text style={styles.label}>Bank Name</Text>
                        <DropDownPicker
                            open={open}
                            value={fi_code}
                            items={bankList} // ใช้ bankList ที่ได้จาก API
                            setOpen={setOpen}
                            setValue={setFi_code}
                            placeholder="Select Bank..."
                            searchable={true}
                            style={styles.dropdown}
                            dropDownContainerStyle={styles.dropdownContainer}
                            zIndex={5000}
                            zIndexInverse={4000}
                        />
                        {errors.fi_code && <Text style={styles.errorText}>{errors.fi_code}</Text>}
                    </View>

                    {/* Display Name Input */}
                    <View style={[styles.inputContainer, { zIndex: 4000 }]}>
                        <Text style={styles.label}>Display Name</Text>
                        <TextInput
                            style={styles.input}
                            value={display_name}
                            onChangeText={setDisplay_name}
                            placeholder="Enter Display Name"
                            maxLength={30}
                        />
                        {errors.display_name && <Text style={styles.errorText}>{errors.display_name}</Text>}
                    </View>

                    {/* Account Name Input */}
                    <View style={[styles.inputContainer, { zIndex: 3000 }]}>
                        <Text style={styles.label}>Account Name</Text>
                        <TextInput
                            style={styles.input}
                            value={account_name}
                            onChangeText={setAccount_name}
                            placeholder="Enter Account Name"
                        />
                        {errors.account_name && <Text style={styles.errorText}>{errors.account_name}</Text>}
                    </View>

                    {/* Account Number Input */}
                    <View style={[styles.inputContainer, { zIndex: 2000 }]}>
                        <Text style={styles.label}>Account Number</Text>
                        <TextInput
                            style={styles.input}
                            value={account_number}
                            onChangeText={setAccount_number}
                            placeholder="Enter Account Number"
                            keyboardType="numeric"
                            maxLength={10}
                        />
                        {errors.account_number && <Text style={styles.errorText}>{errors.account_number}</Text>}
                    </View>

                    {/* Balance Input */}
                    <View style={[styles.inputContainer, { zIndex: 1000 }]}>
                        <Text style={styles.label}>Remaining Balance</Text>
                        <TextInput
                            style={styles.input}
                            value={balance}
                            onChangeText={setBalance}
                            placeholder="Enter Balance"
                            keyboardType="numeric"
                        />
                        {errors.balance && <Text style={styles.errorText}>{errors.balance}</Text>}
                    </View>

                    {/* Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
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
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#F0F6FF",
        justifyContent: "flex-start",
    },
    inputWrapper: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        marginTop: 20,
    },
    title: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        textAlign: "center",
        marginBottom: 20,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        color: "#333",
        marginBottom: 8,
    },
    input: {
        height: 45,
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: 12,
        paddingLeft: 15,
        fontSize: 14,
        color: "#333",
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
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    cancelButton: {
        backgroundColor: "#E2E2E2",
        paddingVertical: 12,
        paddingHorizontal: 35,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#ddd",
    },
    saveButton: {
        backgroundColor: "#9AC9F3",
        paddingVertical: 12,
        paddingHorizontal: 50,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#9AC9F3",
    },
    buttonText: {
        color: "#333333",
        fontSize: 16,
        fontWeight: "600",
    },
    errorText: {
        color: "red",
        fontSize: 12,
        marginTop: 5,
    },
});

export default AddAccountDetail;