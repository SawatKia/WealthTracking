import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import DropdownPicker from "react-native-dropdown-picker"; // Import the dropdown picker
import { useTransactions } from "../services/TransactionService";

const IncomeTransactionList = () => {
  const { fetchIncomeSummary } = useTransactions();
  const [year, setYear] = useState(new Date().getFullYear());
  const [incomeData, setIncomeData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadIncomeData(year);
  }, [year]);

  const loadIncomeData = async (selectedYear: number) => {
    setLoading(true);
    const data = await fetchIncomeSummary(selectedYear);
    if (data) setIncomeData(data.data);
    setLoading(false);
  };

  const renderCategory = ({ item }: { item: any }) => (
    <View style={styles.categoryContainer}>
      <Text style={styles.categoryTitle}>{item.type_name}</Text>
      <Text style={styles.categoryAmount}>
        Total: {parseFloat(item.total_amount || "0").toLocaleString()}
      </Text>
    </View>
  );

  // Calculate the total income
  const calculateTotalIncome = () => {
    if (!incomeData?.summary) return 0;

    const totalIncome = incomeData.summary.reduce(
      (total: number, item: any) => {
        return total + parseFloat(item.total_amount || "0");
      },
      0
    );

    return totalIncome;
  };

  return (
    <View style={styles.container}>
      {/* Header with Year Selector */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Yearly Income Summary</Text>
        
        {/* Dropdown Picker */}
        <DropdownPicker
          open={open}
          setOpen={setOpen}
          value={year}
          items={[...Array(5)].map((_, index) => {
            const yearOption = new Date().getFullYear() - index;
            return { label: `${yearOption}`, value: yearOption };
          })}
          setValue={setYear}
          placeholder="Select Year"
          style={styles.picker}
          containerStyle={styles.pickerContainer}
          dropDownContainerStyle={styles.dropDownContainerStyle}
        />
      </View>
      {/* Display Total Income*/}
      <View style={styles.totalIncomeContainer}>
        <Text style={styles.totalIncomeText}>
          Total Annual Income: {calculateTotalIncome().toLocaleString()}
        </Text>
      </View>
      {/* Loading Indicator */}
      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" style={styles.loader} />
      ) : (
        <FlatList
          data={incomeData?.summary || []}
          renderItem={renderCategory}
          keyExtractor={(item) => item.type_name}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  pickerContainer: {
    width: 100, 
    height: 40,
    marginLeft: 10,
    zIndex: 10,
  },
  picker: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 5,
    color: "#555",
  },
  dropDownContainerStyle: {
    backgroundColor: "#f0f4f8", 
  },
  loader: {
    marginTop: 20,
  },
  listContainer: {
    paddingBottom: 0,
  },
  categoryContainer: {
    flex: 1,
    padding: 10,
    marginBottom: 10,
    marginRight: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  categoryAmount: {
    fontSize: 16,
    color: "#555",
    marginTop: 5,
  },
  totalIncomeContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    alignItems: "center",
  },
  totalIncomeText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2ecc71",
    marginTop: 5,
    marginBottom: 5,
  },
});

export default IncomeTransactionList;
