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

export default function SelectCategoryModal({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (category: string, type: string) => void;
}) {
  const [selectedOption, setSelectedOption] = useState<
    "Expense" | "Income" | "Transfer"
  >("Expense");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  console.log(selected);

  const handleSelect = (category: string, type: string) => {
    setSelectedCategory(category); // Update the selected category
    onSelect(category, type); // Call the parent callback
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
          <CategoryCard
            key={item}
            title={item}
            isSelected={selected === item}
            onPress={() => handleSelect(item, selectedOption)}
          />
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
    marginTop: 50,
    marginHorizontal: 20,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleText: {
    color: "#7F8CD9", // Grey for unselected text
    fontWeight: "bold",
  },
  selectedText: {
    color: "#FFFFFF", // White color for selected text
  },

  categoryContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",

    flexDirection: "row", // Arrange buttons in a row
    flexWrap: "wrap", // Allow wrapping to the next line
    marginHorizontal: 10,
    backgroundColor: "#F0F6FF",
  },
});