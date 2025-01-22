import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import IconMap from "../constants/IconMap"
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
type TransactionCardProps = {
  transaction: {
    type: string;
    category: string;
    description: string;
    amount: number;
    date: string;
    time: string;
    fromAccount: string;
    endBalance: number;
  };
};

const colorMap: Record<string, string> = {
  Expense: '#FF3D00',
  Income: '#08B80F',
  Transfer: '#f8d641',
};

// export default function EditScreenInfo({ path }: { path: string }) {
export default function TransactionCard({ transaction } : TransactionCardProps) {
  const color = colorMap[transaction.type];
  const iconName = IconMap[transaction.category.toLowerCase()] || 'alert-circle-outline';
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <View style={styles.card}>
       <View style={styles.mainContent}>

        {/* Image on the left */}
        <MaterialCommunityIcons name={iconName} style={styles.icon} color="#4a4a8e" />

        {/* Description and Date in the center */}
        <View style={styles.infoContainer}>
          <Text style={styles.description}>{transaction.description}</Text>
          <Text style={styles.date}>{transaction.date}</Text>
        </View>

        {/* Amount on the right */}
        <View style={styles.rightContainer}>
        
          <Text style={[styles.amount, { color }]}>
              {transaction.type === "Income" ? "+" : transaction.type === "Expense"? "-" : ""}฿{transaction.amount.toLocaleString()}
          </Text>
          <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
            <Ionicons name = {isExpanded ? 'chevron-up-outline' : 'chevron-down-outline'} size = {24} color="#4a4a8e" />
          </TouchableOpacity>
          
        </View>
       </View>
      {isExpanded && (
        <View style={styles.additionalDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>From Account</Text>
            <Text style={styles.detailValue}>{transaction.fromAccount}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>End Balance</Text>
            <Text style={styles.detailValue}>฿{transaction.endBalance.toLocaleString()}</Text>
          </View>
        </View>
      )}
    </View>
    // <View style={styles.card}>
    //   <Text style={styles.category}>{transaction.category}</Text>

      // <Text style={[styles.amount, { color }]}>
      //   {transaction.type === "Income" ? "+" : "-"}฿{transaction.amount.toLocaleString()}
      // </Text>
    //   <Text style={styles.description}>{transaction.description}</Text>
    //   <Text style={styles.date}>{transaction.date} {transaction.time}</Text>
    // </View>
  );
};

// const styles = StyleSheet.create({
//   card: { padding: 16, backgroundColor: "#fff", borderRadius: 8, marginBottom: 8, elevation: 2 },
//   category: { fontSize: 18, fontWeight: "bold" },
//   amount: { fontSize: 16},
//   description: { color: "#555" },
//   date: { color: "#999", marginTop: 4 },
// });
const styles = StyleSheet.create({
  card: {
    // flexDirection: 'row',
    // alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 7,
    marginVertical: 5,
    // iOS Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    // Android Shadow
    elevation: 6,
    
  },

  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  icon: {
    fontSize: 24,
    borderRadius: 20,
    marginRight: 10,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  rightContainer: {
    alignItems: 'flex-end',
  },
  description: {
    fontSize: 21,
    fontWeight: 'semibold',
    color: '#333',
  },
  date: {
    fontSize: 12,
    color: '#666',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'semibold',
  },
  additionalDetails: {
    marginTop: 10,
    marginLeft: 50, // Indent to align with main content
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    // marginRight: 30
  },
  detailLabel: {
    fontSize: 14,
    color: '#555',
    flex: 1, // Left column (static text)
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1, // Right column (dynamic value)
    textAlign: 'right',
  },
});