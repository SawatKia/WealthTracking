import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { useRouter } from "expo-router";
import { useAccount } from '../services/AccountService';

const bankList = [
    { name: "Bank of Thailand", fi_code: "001" },
    { name: "Bangkok Bank", fi_code: "002" },
    { name: "Kasikorn Bank", fi_code: "003" },
    { name: "Krungthai Bank", fi_code: "004" },
    { name: "JPMorgan Chase", fi_code: "005" },
    { name: "Oversea-Chinese Banking Corporation", fi_code: "006" },
    { name: "TMB Thanachart Bank", fi_code: "007" },
    { name: "Siam Commercial Bank", fi_code: "008" },
    { name: "Citibank", fi_code: "009" },
    { name: "Sumitomo Mitsui Banking Corporation", fi_code: "010" },
    { name: "Standard Chartered Bank (Thai)", fi_code: "011" },
    { name: "CIMB Thai Bank", fi_code: "012" },
    { name: "RHB Bank", fi_code: "013" },
    { name: "United Overseas Bank (Thai)", fi_code: "014" },
    { name: "Bank of Ayudhya", fi_code: "015" },
    { name: "Mega International Commercial Bank", fi_code: "016" },
    { name: "Bank of America", fi_code: "017" },
    { name: "Indian Overseas Bank", fi_code: "018" },
    { name: "Government Savings Bank", fi_code: "019" },
    { name: "Hongkong and Shanghai Banking Corporation", fi_code: "020" },
    { name: "Deutsche Bank Bangkok Branch", fi_code: "021" },
    { name: "Government Housing Bank", fi_code: "022" },
    { name: "Bank for Agriculture and Agricultural Cooperatives", fi_code: "023" },
    { name: "Export-Import Bank of Thailand", fi_code: "024" },
    { name: "Mizuho Bank Bangkok Branch", fi_code: "025" },
    { name: "BNP Paribas", fi_code: "026" },
    { name: "Bank of China (Thai)", fi_code: "027" },
    { name: "Islamic Bank of Thailand", fi_code: "028" },
    { name: "Tisco Bank", fi_code: "029" },
    { name: "Kiatnakin Phatra Bank", fi_code: "030" },
    { name: "ICBC (Thai)", fi_code: "031" },
    { name: "Thai Credit Bank", fi_code: "032" },
    { name: "Land and Houses Bank", fi_code: "033" },
    { name: "Sumitomo Mitsui Trust Bank (Thai)", fi_code: "034" },
    { name: "SME Development Bank", fi_code: "035" }
];

const AddAccountDetail = () => {
    const [fi_code, setFi_code] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const [display_name, setDisplay_name] = useState<string>("");
    const [account_name, setAccount_name] = useState<string>("");
    const [account_number, setAccount_number] = useState<string>("");
    const [balance, setBalance] = useState<number | string>("");
    const { createAccount } = useAccount(); // Destructure the createAccount function
    const router = useRouter();

    const handleSave = () => {
        const accountDetails = {
            account_number,
            fi_code,
            display_name,
            account_name,
            balance: parseFloat(balance as string),
        };

        console.log("Saved Account Details:", accountDetails);
        // Call createAccount to save the account
        createAccount(accountDetails);

        // Optionally navigate back to the Account page after saving
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
                            items={bankList.map(bank => ({
                                label: bank.name,
                                value: bank.fi_code
                            }))}
                            setOpen={setOpen}
                            setValue={setFi_code}
                            placeholder="Select Bank..."
                            searchable={true}
                            style={styles.dropdown}
                            dropDownContainerStyle={styles.dropdownContainer}
                            zIndex={5000}
                            zIndexInverse={4000}
                        />
                    </View>

                    {/* Display Name Input */}
                    <View style={[styles.inputContainer, { zIndex: 4000 }]}>
                        <Text style={styles.label}>Display Name</Text>
                        <TextInput
                            style={styles.input}
                            value={display_name}
                            onChangeText={setDisplay_name}
                            placeholder="Enter Display Name"
                        />
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
                        />
                    </View>

                    {/* Balance Input */}
                    <View style={[styles.inputContainer, { zIndex: 1000 }]}>
                        <Text style={styles.label}>Remaining Balance</Text>
                        <TextInput
                            style={styles.input}
                            value={balance.toString()}
                            onChangeText={(text) => setBalance(text)}
                            placeholder="Enter Balance"
                            keyboardType="numeric"
                        />
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
});

export default AddAccountDetail;