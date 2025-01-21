import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import IconMap from "../constants/IconMap"
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';


interface CategoryItemProps {
  title: string;
  isSelected: boolean;
  onPress: (item: string) => void; // Correct function signature
}
export default function  CategoryCard ({ title, isSelected, onPress }: CategoryItemProps) {

  const iconName = IconMap[title.toLowerCase()] || 'alert-circle-outline';
  
  return (
    <TouchableOpacity
      style={[styles.button,isSelected && styles.selectedButton]}
      onPress={() => onPress(title)}
    >
      
      <MaterialCommunityIcons name={iconName} size={35} color='#9AC9F3'/>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({

      button: {
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 15,
        backgroundColor: '#fff',
        margin: 10,
      },
      selectedButton: {
        borderColor:'#4957AA',
        borderWidth:2
      },
      text: {
        marginTop: 8,
        fontSize: 16,
        color:'#4957AA'
        
      },
      selectedText: {
        color: '#4957AA',
      },
});

