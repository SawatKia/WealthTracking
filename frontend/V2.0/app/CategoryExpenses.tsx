import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, TouchableOpacity,SafeAreaView,ScrollView } from 'react-native';
import React, { useState } from "react";

import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';
import CategoryCard from '@/components/CategoryCard';
// import { ScrollView } from 'react-native-reanimated/lib/typescript/Animated';


export default function CategoryExpenses() {
    const [selectedOption, setSelectedOption] = useState<'Expense' | 'Income'>('Expense');
    const lst = ['Food', 'Transport', 'Travel', 'Groceries', 'House', 'Borrowed',  'Cure', 'Pet', 'Education', 'Clothes', 'Cosmetics', 'Accessories', 'Insurance', 'Hobby', 'Utilities', 'Vehicle', 'Fee', 'Business', 'Game', 'Others'
    ]
  return (
    <ScrollView style={{backgroundColor: '#F5FCFF'}}>
        <View style={styles.toggleContainer}>
        {/* Expense Button */}
        <TouchableOpacity
          style={[
            styles.toggleButton,
            selectedOption === 'Expense' && {backgroundColor:'#FF7D54'},
          ]}
          onPress={() => setSelectedOption('Expense')}
        >
          <Text
            style={[
              styles.toggleText,
              selectedOption === 'Expense' && styles.selectedText,
            ]}
          >
            Expense
          </Text>
        </TouchableOpacity>

        {/* Income Button */}
        <TouchableOpacity
          style={[
            styles.toggleButton,
            selectedOption === 'Income' && {backgroundColor:'#84FA89'},
          ]}
          onPress={() => setSelectedOption('Income')}
        >
          <Text
            style={[
              styles.toggleText,
              selectedOption === 'Income' && styles.selectedText,
            ]}
          >
            Income
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.categoryContainer}>
      {lst.map((item) => (
        <CategoryCard title={item} />
      ))}
    </View>


      {/* <CategoryCard title='Food'></CategoryCard> */}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  toggleContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    marginTop:10,

    marginHorizontal:20
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    
  },
  toggleText: {
    color: '#7F8CD9', // Grey for unselected text
    fontWeight: 'bold',
  },
  selectedText: {
    color: '#FFFFFF', // White color for selected text
  },

  categoryContainer:{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',

    flexDirection: 'row', // Arrange buttons in a row
    flexWrap: 'wrap', // Allow wrapping to the next line
    marginHorizontal: 10
  }

});
