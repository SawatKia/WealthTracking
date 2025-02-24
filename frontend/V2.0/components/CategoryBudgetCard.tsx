import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface CategoryBudgetCardProps {
  category: string;
  amount: number;
  left: number | null;
  overspent: number | null;
}

const CategoryBudgetCard: React.FC<CategoryBudgetCardProps> = ({ 
  category, 
  amount, 
  left, 
  overspent 
}) => {
  return (
    <View style={styles.card}>
      <Text style={styles.category}>{category}</Text>
      <Text style={styles.amount}>${amount.toFixed(2)}</Text>
      {overspent ? (
        <Text style={styles.overspent}>Overspent ${overspent}</Text>
      ) : (
        <Text style={styles.left}>Left ${left}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { 
    padding: 16, 
    backgroundColor: "white", 
    borderRadius: 10, 
    marginBottom: 10 
  },
  category: { fontSize: 16, fontWeight: "bold" },
  amount: { fontSize: 14, fontWeight: "600" },
  left: { color: "green" },
  overspent: { color: "red" },
});

export default CategoryBudgetCard;
