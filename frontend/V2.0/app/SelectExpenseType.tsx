import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, TouchableOpacity,SafeAreaView,ScrollView } from 'react-native';
import React, { useState } from "react";
import { Link, Stack } from 'expo-router';

import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';

import CategoryList from "../constants/CategoryList"
import CategoryCard from '@/components/CategoryCard';

import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../constants/NavigateType'; // Import the type definition
// import { ScrollView } from 'react-native-reanimated/lib/typescript/Animated';


type CategoryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Category'>;

export default function SelectCExpenseTypeModal({selected, onSelect }: { selected:string,onSelect: (category: string, type: string) => void }) {
    const [selectedOption, setSelectedOption] = useState<'Expense'>('Expense');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    console.log(selected)

    const handleSelect = (category: string, type: string) => {
        setSelectedCategory(category); // Update the selected category
        // console.log(selectedCategory,category)
        // console.log(selectedCategory == category)
        onSelect(category, type); // Call the parent callback
      };

  return (
    <ScrollView style={{backgroundColor: '#F0F6FF'}}>
        <View style={styles.toggleContainer}>
        {/* Expense Button */}
        <TouchableOpacity
          style={[
            styles.toggleButton,
            selectedOption === 'Expense' && {backgroundColor:'#ffd358'},
          ]}
          onPress={() => setSelectedOption('Expense')}
        >
          <Text
            style={[
              styles.toggleText,
              selectedOption === 'Expense' && styles.selectedText,
            ]}
          >
            Budget
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.categoryContainer}>
      {CategoryList[selectedOption].map((item) => (
      
        <CategoryCard key={item} title={item} isSelected = {selected === item} onPress={() => handleSelect(item, selectedOption)}/>

      ))}
    </View>

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
    marginTop:50,
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
    marginHorizontal: 10,
    backgroundColor:'#F0F6FF'
  }

});