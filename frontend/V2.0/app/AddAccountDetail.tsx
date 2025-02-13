import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { useRouter } from "expo-router";

const bankList = [
    "Bank of Thailand", "Bangkok Bank", "Kasikorn Bank", "Krungthai Bank",
    "JPMorgan Chase", "Oversea-Chinese Banking Corporation", "TMB Thanachart Bank",
    "Siam Commercial Bank", "Citibank", "Sumitomo Mitsui Banking Corporation",
    "Standard Chartered Bank (Thai)", "CIMB Thai Bank", "RHB Bank", "United Overseas Bank (Thai)",
    "Bank of Ayudhya", "Mega International Commercial Bank", "Bank of America", "Indian Overseas Bank",
    "Government Savings Bank", "Hongkong and Shanghai Banking Corporation", "Deutsche Bank Bangkok Branch",
    "Government Housing Bank", "Bank for Agriculture and Agricultural Cooperatives", "Export-Import Bank of Thailand",
    "Mizuho Bank Bangkok Branch", "BNP Paribas", "Bank of China (Thai)", "Islamic Bank of Thailand", "Tisco Bank",
    "Kiatnakin Phatra Bank", "ICBC (Thai)", "Thai Credit Bank", "Land and Houses Bank", "Sumitomo Mitsui Trust Bank (Thai)",
    "SME Development Bank"
];

const AddAccountDetail = () => {
    const [bankName, setBankName] = useState(null);
    const [open, setOpen] = useState(false);
    const [accountName, setAccountName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [remainingBalance, setRemainingBalance] = useState("");
    const router = useRouter();

    const handleSave = () => {
        console.log("Saved Account Details:", { bankName, accountName, accountNumber, remainingBalance });
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
                            value={bankName}
                            items={bankList.map(bank => ({ label: bank, value: bank }))}
                            setOpen={setOpen}
                            setValue={setBankName}
                            placeholder="Select Bank..."
                            searchable={true}
                            style={styles.dropdown}
                            dropDownContainerStyle={styles.dropdownContainer}
                            zIndex={5000}
                            zIndexInverse={4000}
                        />
                    </View>

                    {/* Account Name Input */}
                    <View style={[styles.inputContainer, { zIndex: 4000 }]}>
                        <Text style={styles.label}>Account Name</Text>
                        <TextInput
                            style={styles.input}
                            value={accountName}
                            onChangeText={setAccountName}
                            placeholder="Enter Account Name"
                        />
                    </View>

                    {/* Account Number Input */}
                    <View style={[styles.inputContainer, { zIndex: 3000 }]}>
                        <Text style={styles.label}>Account Number</Text>
                        <TextInput
                            style={styles.input}
                            value={accountNumber}
                            onChangeText={setAccountNumber}
                            placeholder="Enter Account Number"
                            keyboardType="numeric"
                        />
                    </View>

                    {/* Remaining Balance Input */}
                    <View style={[styles.inputContainer, { zIndex: 2000 }]}>
                        <Text style={styles.label}>Remaining Balance</Text>
                        <TextInput
                            style={styles.input}
                            value={remainingBalance}
                            onChangeText={setRemainingBalance}
                            placeholder="Enter Remaining Balance"
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
