import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

type DropdownButtonProps = {
  selectedType: "Income" | "Expense";
  onSelect: (type: "Income" | "Expense") => void;
};
const colorMap: Record<string, string> = {
  Expense: '#FF3D00',
  Income: '#08B80F',
};
export default function  DropdownButton ({ selectedType, onSelect } : DropdownButtonProps ) {
  const [isOpen, setIsOpen] = useState(false);
  const backgroundColor = colorMap[selectedType];
  return (
    <View>
      <TouchableOpacity style={[styles.button,{backgroundColor}]} onPress={() => setIsOpen(!isOpen)}>
        <Text style={styles.buttonText}>{selectedType}</Text>
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.dropdown}>
          {["Income", "Expense"].map((type) => (
            <TouchableOpacity key={type} onPress={() => { onSelect(type as "Income" | "Expense"); setIsOpen(false); }}>
              <Text style={styles.option}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  button: { padding: 12, borderRadius: 8, marginBottom: 8 },
  buttonText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
  dropdown: { backgroundColor: "#fff", borderRadius: 8, elevation: 3 },
  option: { padding: 12, textAlign: "center" },
});

