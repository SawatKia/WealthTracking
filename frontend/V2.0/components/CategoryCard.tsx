import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import IconMap from "../constants/IconMap"
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function  CategoryCard ({ title }: { title: string }) {

  const iconName = IconMap[title.toLowerCase()] || 'alert-circle-outline';
  return (
    <TouchableOpacity
      style={[styles.button]}
    //   onPress={handlePress}
    >
      <MaterialCommunityIcons name={iconName} size={35} color='#9AC9F3'/>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5FCFF',
        flexDirection: 'row', // Arrange buttons in a row
        flexWrap: 'wrap', // Allow wrapping to the next line
      },
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
        backgroundColor: '#4F8EF7',
      },
      text: {
        marginTop: 8,
        fontSize: 16,
        
      },
      selectedText: {
        color: '#fff',
      },
});

