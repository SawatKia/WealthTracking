import React from "react";
import { View, Text, StyleSheet } from "react-native";

import { GestureDetector, Gesture } from 'react-native-gesture-handler';

type AccountCardProps = {
  account: { name: string; balance: number; lastUpdated: string };
  currentIndex: number;
  totalAccounts: number;
  onSwipe: (direction: 'Left' | 'Right') => void;
};

export default function  AccountCard({ account, currentIndex, totalAccounts, onSwipe }: AccountCardProps ){
    const swipeGesture = Gesture.Pan()
    .onEnd((event) => {
    const { velocityX } = event;
    if (velocityX > 0) {
        onSwipe('Right'); // Swipe right
    } else if (velocityX < 0) {
        onSwipe('Left'); // Swipe left
    }
    });
    
  return (
    <GestureDetector gesture={swipeGesture}>

        <View style={styles.card}>
        <Text style={styles.name}>{account.name}</Text>
        <Text style={styles.balance}>฿{account.balance.toLocaleString()}</Text>
        <Text style={styles.updated}>Last Updated: {account.lastUpdated}</Text>
        <Text style={styles.indicator}>{`${currentIndex + 1} / ${totalAccounts}`}</Text>
        </View>
    </GestureDetector>
    
  );
};

const styles = StyleSheet.create({
  card: { padding: 16, backgroundColor: "#4957AA", borderRadius: 8, marginBottom: 16 },
  name: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  balance: { fontSize: 18, color: "#fff", marginVertical: 4 },
  updated: { fontSize: 14, color: "#ddd" },
  indicator: { marginTop: 8, textAlign: "center", color: "#ccc" },
});


