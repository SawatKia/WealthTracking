import React from "react";
import { SafeAreaView } from "react-native";
import BudgetApp from "./BudgetScreen"; // นำเข้า BudgetApp

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <BudgetApp />
    </SafeAreaView>
  );
}
