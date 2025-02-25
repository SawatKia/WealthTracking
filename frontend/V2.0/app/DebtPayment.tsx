//DebtPayment.tsx Original From Dao
import { StatusBar } from "expo-status-bar";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Button,
    TouchableOpacity,
    SafeAreaView,
    Pressable,
    Modal,
} from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useState, useEffect } from "react";
import { useNavigation, useRouter, useLocalSearchParams } from "expo-router";

import DateTimePicker from "react-native-ui-datepicker";
import DropDownPicker from "react-native-dropdown-picker";

import dayjs, { Dayjs } from "dayjs";

import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../constants/NavigateType";
import SelectCategoryModal from "./SelectCategoryModal";

type CreateTransactionRouteProp = RouteProp<
    RootStackParamList,
    "CreateTransaction"
>;

const options = {
    bank_accounts: [
        {
            account_number: "1234567890",
            fi_code: "001",
            national_id: "1234567890123",
            display_name: "Main Account",
            account_name: "John Doe",
            balance: 50000.0,
        },
        {
            account_number: "9876543210",
            fi_code: "002",
            national_id: "1234567890123",
            display_name: "Savings",
            account_name: "John Doe",
            balance: 100000.0,
        },
        {
            account_number: "5555555555",
            fi_code: "001",
            national_id: "9876543210123",
            display_name: "Personal Account",
            account_name: "Jane Smith",
            balance: 75000.0,
        },
    ],
};
export default function CreateTransaction({
    route,
}: {
    route: CreateTransactionRouteProp;
}) {
    const router = useRouter()
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [isAccountPickerVisible, setAccountPickerVisibility] = useState(false);
    const [isCategoryPickerVisible, setCategoryPickerVisibility] = useState(false);
    const [date, setDate] = useState<Dayjs>(dayjs());
    const [amount, setAmount] = useState("");

    const [selectedCategory, setSelectedCategory] = useState({
        category: null as string | null,
        type: null as string | null,
    });
    const [selectedAccountValue, setSelectedAccountValue] = useState<string | null>(null);
    const [selectedAccountItem, setSelectedAccountItem] = useState<
        { label: string; value: string }[]
    >([]);

    const handleSelectCategory = (category: string, type: string) => {
        setSelectedCategory({ category, type });
        setCategoryPickerVisibility(false);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const accountItems = options.bank_accounts.map((item) => ({
                    label: item.display_name,
                    value: item.display_name,
                }));

                setSelectedAccountItem(accountItems);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, []);

    const onChangeDate = (params: any) => {
        setDate(params.date);
        console.log(date);
    };

    return (
        <SafeAreaView>
            <View style={styles.container}>
                <View style={styles.rowTile}>
                    <Ionicons
                        name="calendar-clear"
                        style={styles.iconTitle}
                        size={20}
                        color="#fff"
                    />
                    <Text style={styles.title}>Date and time</Text>
                </View>

                <View style={styles.rowInput}>
                    <View style={styles.inputsContainer}>
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

                            {date ? <Text>{dayjs(date).format("DD MMM YYYY ")}</Text> : "..."}
                            <Ionicons
                                name="time"
                                size={20}
                                style={styles.iconInput}
                                color="#9AC9F3"
                            />
                            {date ? <Text>{dayjs(date).format("HH:mm")}</Text> : "..."}
                        </TouchableOpacity>

                        {isDatePickerVisible && (
                            <DateTimePicker
                                mode="single"
                                date={date}
                                onChange={onChangeDate}
                                timePicker={true}
                            />
                        )}
                    </View>
                </View>
            </View>

            <View style={styles.container}>
                <View style={styles.rowTile}>
                    <Ionicons
                        name="shapes"
                        style={styles.iconTitle}
                        size={20}
                        color="#fff"
                    />
                    <Text style={styles.title}>Category</Text>
                </View>

                <View style={styles.rowInput}>
                    <View style={styles.inputsContainer}>
                        <TouchableOpacity onPress={() => { setCategoryPickerVisibility(false) }} style={styles.inputButton}>
                            <Text>{`${selectedCategory.type || 'Expense'} : ${selectedCategory.category || 'Debt Payment'}`}</Text>

                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <Modal
                visible={isCategoryPickerVisible}
                animationType="slide"
                onRequestClose={() => setCategoryPickerVisibility(false)}
            >
                <SelectCategoryModal selected={selectedCategory.category ?? ''} onSelect={handleSelectCategory} />
            </Modal>

            <View style={styles.container}>
                <View style={styles.rowTile}>
                    <Ionicons
                        name="briefcase"
                        style={styles.iconTitle}
                        size={20}
                        color="#fff"
                    />
                    <Text style={styles.title}>Debt ID</Text>
                </View>

                <View style={styles.rowInput}>
                    <View
                        style={[
                            styles.inputsContainer,
                            { height: isAccountPickerVisible ? 150 : null },
                        ]}
                    >
                        <DropDownPicker
                            open={isAccountPickerVisible}
                            value={selectedAccountValue}
                            items={selectedAccountItem}
                            setOpen={setAccountPickerVisibility}
                            setValue={setSelectedAccountValue}
                            setItems={setSelectedAccountItem}
                            placeholder="[Select Debt ID]"
                            style={styles.inputButton}
                            disableBorderRadius={true}
                            textStyle={{ textAlign: "center" }}
                            dropDownContainerStyle={styles.dropdownContainer}
                        />
                    </View>
                </View>
            </View>

            <View style={styles.container}>
                <View style={styles.rowTile}>
                    <Ionicons
                        name="cash"
                        style={styles.iconTitle}
                        size={20}
                        color="#fff"
                    />
                    <Text style={styles.title}>Amount</Text>
                </View>

                <View style={styles.rowInput}>
                    <View style={styles.inputsContainer}>
                        <TextInput
                            placeholder="0.00"
                            onChangeText={setAmount}
                            keyboardType="numeric"
                            value={amount}
                            returnKeyType="done"
                            style={[styles.inputButton, { width: "65%" }]}
                        />

                        <Text style={styles.textInput}>THB</Text>
                    </View>
                </View>
            </View>

            <View style={styles.container}>
                <View style={styles.rowTile}>
                    <Ionicons
                        name="shapes"
                        style={[styles.iconTitle, { backgroundColor: "#9AC9F3" }]}
                        size={20}
                        color="#fff"
                    />
                    <Text style={styles.title}>Detail</Text>
                    <Text style={{ color: "#00000040" }}> *Optional</Text>
                </View>

                <View style={styles.rowInput}>
                    <View style={styles.inputsContainer}>
                        <TextInput
                            style={[styles.inputButton, { backgroundColor: "#9AC9F357" }]}
                            returnKeyType="done"
                        />
                    </View>
                </View>
            </View>

            <View style={styles.sumbitContainer}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => router.push('/(tabs)/IncomeExpense')}><Text>Cancel</Text></TouchableOpacity>

                <TouchableOpacity style={styles.saveButton}><Text>Save</Text></TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        margin: 10,
        padding: 16,
        backgroundColor: "#f9f9f9",
        borderRadius: 8,
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    rowTile: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    iconTitle: {
        backgroundColor: "#4957AA",
        padding: 8,
        borderRadius: 25,
        marginRight: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: "600",
        marginLeft: 5,
    },
    rowInput: {
        flexDirection: "row",
        alignItems: "center",
    },

    inputsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        width: "90%",
        marginLeft: 40,
    },
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
    textInput: {
        backgroundColor: "#4957AA40",
        borderRadius: 8,
        width: "25%",
        textAlign: "center",
        paddingVertical: 8,
        marginLeft: 20,
    },
    iconInput: {
        marginHorizontal: 10,
        backgroundColor: "white",
        borderRadius: 5,
        padding: 3,
    },
    dropdownContainer: {
        borderRadius: 8,
        backgroundColor: "#BEC2E0",
        borderWidth: 0,
        zIndex: 1,
    },

    sumbitContainer: {
        flexDirection: "row",
        display: "flex",
        justifyContent: "space-around",
        marginTop: 10,
    },

    cancelButton: {
        backgroundColor: "#E2E2E2",
        paddingHorizontal: 30,
        paddingVertical: 10,
        borderRadius: 8,
        fontSize: 16,
    },

    saveButton: {
        backgroundColor: "#9AC9F3",
        paddingHorizontal: 60,
        paddingVertical: 10,
        borderRadius: 8,
        fontSize: 16,
    },
});
