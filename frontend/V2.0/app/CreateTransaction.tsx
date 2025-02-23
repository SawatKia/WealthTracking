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
  FlatList
} from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useState, useEffect } from "react";
import { useNavigation, useRouter, useLocalSearchParams } from "expo-router";

import DateTimePicker from "react-native-ui-datepicker";
import DropDownPicker from "react-native-dropdown-picker";

import dayjs, { Dayjs } from "dayjs";

import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../constants/NavigateType"; // Import the type definition
import SelectCategoryModal from "./SelectCategoryModal";

import { newSenderReceiver,useTransactions } from '../services/TransactionService';
import { useAccount } from '../services/AccountService';
import { ScrollView } from "react-native-gesture-handler";

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
  const { createTransaction } = useTransactions();
  const { getAllAccounts } = useAccount();
  const router = useRouter()
  // const CreateTransaction = ({ route, navigation }: { route: any; navigation: any }) =>{
  const [sizeOption, setsizeOption] = useState(0);

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isAccountPickerVisible, setAccountPickerVisibility] = useState(false);
  const [isAccountTransPickerVisible, setAccountTransPickerVisibility] = useState(false);
  const [isCategoryPickerVisible, setCategoryPickerVisibility] = useState(false);
  // const { category } = route.params ?? {};
  // const [date, setDate]= useState<Dayjs | null>(null);

  const [date, setDate] = useState<Dayjs>(dayjs()); // Initialize state as Dayjs object
  const [amount, setAmount] = useState("");
  
  const [selectedCategory, setSelectedCategory] = useState({
    category: null as string | null,
    type: null as string | null,
  });
  const [selectedAccountItem, setSelectedAccountItem] = useState<string | null>(null);


  const [accountItems, setAccountItems] =  useState<
  { label: string; value: string}[]
>([]);
const [selectedAccount, setSelectedAccount] = useState<{ account_number: string; fi_code: string } | null>(null);
const [selectedAccountValue, setSelectedAccountValue] = useState<string | null>(null); // Holds string value for DropDownPicker
const [selectedAccountTransValue, setSelectedAccountTransValue] = useState<string | null>(null); 

  const [note, setNote] = useState("");
  
  const handleSelectCategory = (category: string,type: string) => {
    setSelectedCategory({ category, type });
    setCategoryPickerVisibility(false); // Close the modal
  };
  // {
  //   "transaction_datetime": "2024-03-15T10:30:00Z",
  //   "category": "Expense",
  //   "type": "Food",
  //   "amount": 100,
  //   "note": "Monthly salary",
  //   "sender": {
  //     "account_number": "1234567890",
  //     "fi_code": "004"
  //   }
  
  // }
  const handleCreateTransaction = async () => {
    // let senderReceiver: { sender?: any; receiver?: any } = {}; 
    let sender : newSenderReceiver | null = null;
    let receiver : newSenderReceiver| null = null;
    console.log(selectedAccountValue)
    console.log(selectedAccountTransValue)

    
    if (selectedCategory.type == 'Income') {
      receiver = JSON.parse(selectedAccountValue || "")
  }
    else if(selectedCategory.type == 'Expense'){
      sender =  JSON.parse(selectedAccountValue || "")
    }
  else{
    sender =  JSON.parse(selectedAccountValue || "")
    receiver = JSON.parse(selectedAccountTransValue || "")
  }
    const requestBody = {
      "transaction_datetime": dayjs(date).toString(),
      "category": selectedCategory.type ?? "" , //for arrai ko mai ru
      "type": selectedCategory.category ?? "",
      "amount": parseFloat(parseFloat(amount).toFixed(2)),
      "debt_id" : null,
      "note": note,
      sender,
      receiver
    }
    // console.log(requestBody)
    createTransaction(requestBody)
    // console.log('send data :', respond)
  }

  // Extract the setCategory function passed as a prop
  // const setCategory = params.setCategory as (category: string) => void;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Transform API data into items format for the dropdown
        const data = await getAllAccounts()
        console.log('account : ',data)
        setsizeOption(data.length)
        const items = data.map((item) => ({
          label: item.display_name,
          value: JSON.stringify({ account_number: item.account_number, fi_code: item.fi_code }), // Store object as string
        }));
        setAccountItems(items);
        
        console.log(items);
        
        // Example: Selecting the first item from the list
        // if (accountItems.length > 0) {
        //   setSelectedAccountItem(accountItems[0].label); // Set the first label
        //   setSelectedAccountValue(accountItems[0].value); // Set the first value
        // }

        if (selectedCategory.type == 'Transfer'){

          // setSelectedAccountTransItem(accountItems);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const onChangeDate = (params: any) => {
    setDate(params.date);
    // console.log(route.params)
    console.log(date);
    // setDatePickerVisibility(false)
  };

  // useEffect(() => {
  // Check if route and route.params are available before trying to access them

  // console.log(categoryParam)
  // if (route.params?) {

  // if (categoryParam) {
  //   setSelectedCategory(categoryParam);
  // }
  // }
  // }, [route.params?.category]); // Re-run the effect when route.params changes
  // const handleInputChange = (text: string) => {
  //   const formattedValue = parseFloat(text); // Parse input to float
  //   if (!isNaN(formattedValue)) {
  //     setAmount(formattedValue); // Update state with the float value
  //   } else {
  //     setAmount('0.0');
  //   }
  // };
  return (
    <KeyboardAwareScrollView>
      {/* date & time */}
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
              {/* <Text>{date.toString()}</Text> */}
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
            {/* {selectedDate && <Text>Selected Date: {selectedDate.toString()}</Text>} */}

            {isDatePickerVisible && (
              <DateTimePicker
                mode="single"
                date={date} // Pass formatted string date to the picker
                onChange={onChangeDate} // Update state on change
                timePicker={true}
              // onChange={(params) => setDate(params.date)}
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
            {/* <TouchableOpacity 
            onPress={() =>
              router.push({
                pathname: '/CategoryExpenses',
                params: {
                  // params: { postData: JSON.stringify(post) },
                  // setCategory: (category: string) => setSelectedCategory(category),
                },
              })}
            >

            </TouchableOpacity> */}

            <TouchableOpacity  onPress={() =>{setCategoryPickerVisibility(true)}} style={styles.inputButton}>
              <Text>{selectedCategory.category ? `${selectedCategory.type} : ${selectedCategory.category}` : 'Select Catagory'}</Text>
            </TouchableOpacity>

            {/* <TouchableOpacity onPress={()=>{}}>
                <Text></Text>
              </TouchableOpacity> */}
          </View>
        </View>
      </View>

      <Modal
        visible={isCategoryPickerVisible}
        animationType="slide"
        onRequestClose={() => setCategoryPickerVisibility(false)} // Allow modal to close on back press
      >
        <SelectCategoryModal selected={selectedCategory.category ?? ''} onSelect={handleSelectCategory} />
      </Modal>

      <View style={styles.container}>
        <View style={styles.rowTile}>
          <Ionicons
            name="albums"
            style={styles.iconTitle}
            size={20}
            color="#fff"
          />
          <Text style={styles.title}>{selectedCategory.type == 'Transfer' ? 'Sender Account':'Account'}</Text>
        </View>

        <View style={styles.rowInput}>
          <View
            style={[
              styles.inputsContainer,
              { height: isAccountPickerVisible ? 50 * sizeOption : null },
            ]}
          >
       <DropDownPicker
  open={isAccountPickerVisible}
  multiple={false}  // Ensure single-select mode
  value={selectedAccountValue} // Use string value
  items={accountItems}
  setOpen={setAccountPickerVisibility}
  setValue={setSelectedAccountValue}
  setItems={setAccountItems}
  placeholder="[Select Account]"
  style={styles.inputButton}
  disableBorderRadius={true}
  textStyle={{ textAlign: "center" }}
  dropDownContainerStyle={styles.dropdownContainer}
/>


          </View>

          {/* <Text>Select an Option:</Text> */}
        </View>
      </View>
      {selectedCategory.type == 'Transfer' && 
      <View style={styles.container}>
      <View style={styles.rowTile}>
        <Ionicons
          name="albums"
          style={styles.iconTitle}
          size={20}
          color="#fff"
        />
        <Text style={styles.title}>Reciver Account</Text>
      </View>

      <View style={styles.rowInput}>
        <View
          style={[
            styles.inputsContainer,
            { height: isAccountTransPickerVisible ? 50 * sizeOption : null },
          ]}
        >
        <DropDownPicker
  open={isAccountTransPickerVisible}
  multiple={false}  // Ensure single-select mode
  value={selectedAccountTransValue} // Use string value
  items={accountItems}
  setOpen={setAccountTransPickerVisibility}
  setValue={setSelectedAccountTransValue}
  setItems={setAccountItems}
  placeholder="[Select Account]"
  style={styles.inputButton}
  disableBorderRadius={true}
  textStyle={{ textAlign: "center" }}
  dropDownContainerStyle={styles.dropdownContainer}
/>
        </View>

        {/* <Text>Select an Option:</Text> */}
      </View>
    </View>

      }

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
              onChangeText={setNote}
              value={note}
            />
          </View>
        </View>
      </View>

      <View style={styles.sumbitContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.push('/(tabs)/IncomeExpense')}><Text>Cancel</Text></TouchableOpacity>

        <TouchableOpacity style={styles.saveButton} onPress={handleCreateTransaction}><Text>Save</Text></TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 10,
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    elevation: 2, // Adds shadow on Android
    shadowColor: "#000", // Adds shadow on iOS
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  rowTile: {
    flexDirection: "row", // Aligns icon and title horizontally
    alignItems: "center",
    marginBottom: 8, // Spacing between rows
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
    flexDirection: "row", // Aligns blank space and inputs horizontally
    alignItems: "center",
  },

  inputsContainer: {
    flexDirection: "row", // Arrange items in a row
    flexWrap: "wrap",
    width: "90%", // Allow items to wrap to the next row
    marginLeft: 40,
  },
  inputButton: {
    flexDirection: "row",
    backgroundColor: "#4957AA40",
    borderRadius: 8,
    // padding:3,
    minHeight: 35,
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",

    width: "100%",

    borderWidth: 0,
    // zIndex:100
    // zIndex: 9999,

    // textAlign:'center'
  },
  textInput: {
    backgroundColor: "#4957AA40",
    borderRadius: 8,
    // paddingHorizontal:15,
    width: "25%",
    textAlign: "center",
    paddingVertical: 8,
    marginLeft: 20,
  },
  iconInput: {
    marginHorizontal: 10,
    backgroundColor: "white",
    // fontWeight:'bold
    borderRadius: 5,
    padding: 3,
  },
  dropdownContainer: {
    borderRadius: 8,
    backgroundColor: "#BEC2E0",
    borderWidth: 0,
    // marginTop:5,
    // position: "relative", // Positioning dropdown above other components
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

// export default function App() {
//     const [date, setDate] = useState<Dayjs>(dayjs()); // Initialize state as Dayjs object
//     const onChange = (params:any) => {
//         setDate(params.date);
//       };
//     // const onChange = (
//     //     (params:any) => {
//     //       if (mode === 'single') {
//     //         setDate(params.date);
//     //       }
//     //     },
//     //     [mode]
//     //   );

//     return (
//       <View style={styles.container}>
//         <Text>Selected Date: {date.format('YYYY-MM-DD')}</Text>
//         <DateTimePicker
//           mode="single"
//           date={date.format('YYYY-MM-DD')}  // Pass formatted string date to the picker
//           onChange={(onChange)}// Update state on change
//             // onChange={(params) => setDate(params.date)}
//         />
//       </View>
//     );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F5FCFF',
//   },
// });
