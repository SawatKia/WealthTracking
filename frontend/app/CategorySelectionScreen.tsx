import { StatusBar } from "expo-status-bar";
import {
  Platform,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import React, { useState } from "react";
import { Link, Stack } from "expo-router";

import EditScreenInfo from "@/components/EditScreenInfo";
import { Text, View } from "@/components/Themed";

import CategoryList from "../constants/CategoryList";
import CategoryCard from "@/components/CategoryCard";

import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../constants/NavigateType"; 

type CategoryScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Category"
>;

export default function CategoryExpenses({
  route,
}: {
  route: CategoryScreenNavigationProp;
}) {
  const [selectedOption, setSelectedOption] = useState<
    "Expense" | "Income" | "Transfer"
  >("Expense");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const navigation = useNavigation<CategoryScreenNavigationProp>();
  const handleSave = (item: string) => {
    // Set the selected category and navigate to the next screen
    console.log(item);
    setSelectedCategory(item);
  };

  return (
    <ScrollView style={{ backgroundColor: "#F0F6FF" }}>
      <View style={styles.toggleContainer}>
        {/* Expense Button */}
        <TouchableOpacity
          style={[
            styles.toggleButton,
            selectedOption === "Expense" && { backgroundColor: "#FF7D54" },
          ]}
          onPress={() => setSelectedOption("Expense")}
        >
          <Text
            style={[
              styles.toggleText,
              selectedOption === "Expense" && styles.selectedText,
            ]}
          >
            Expense
          </Text>
        </TouchableOpacity>

        {/* Income Button */}
        <TouchableOpacity
          style={[
            styles.toggleButton,
            selectedOption === "Income" && { backgroundColor: "#84FA89" },
          ]}
          onPress={() => setSelectedOption("Income")}
        >
          <Text
            style={[
              styles.toggleText,
              selectedOption === "Income" && styles.selectedText,
            ]}
          >
            Income
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            selectedOption === "Transfer" && { backgroundColor: "#f8d641" },
          ]}
          onPress={() => setSelectedOption("Transfer")}
        >
          <Text
            style={[
              styles.toggleText,
              selectedOption === "Transfer" && styles.selectedText,
            ]}
          >
            Transfer
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.categoryContainer}>
        {CategoryList[selectedOption].map((item) => (
          <Link
            key={item}
            href={{
              pathname: "/CreateTransaction",
              params: { category: item },
            }} // Pass the selected category as a parameter
          >
            <CategoryCard
              key={item}
              title={item}
              isSelected={selectedCategory == item}
              onPress={() => handleSave(item)}
            />
          </Link>
        ))}
      </View>

      {/* <CategoryCard title='Food'></CategoryCard> */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  toggleContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 25,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    marginTop: 10,

    marginHorizontal: 20,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleText: {
    color: "#7F8CD9", 
    fontWeight: "bold",
  },
  selectedText: {
    color: "#FFFFFF", 
  },

  categoryContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",

    flexDirection: "row",
    flexWrap: "wrap", 
    marginHorizontal: 10,
    backgroundColor: "#F0F6FF",
  },
});