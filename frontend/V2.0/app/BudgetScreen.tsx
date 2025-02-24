import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
const VictoryPie = require("victory-native").VictoryPie;
import RNPickerSelect from 'react-native-picker-select';
import CategoryList from './constants/CategoryList';
import { Button } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const BudgetApp = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState('');
  const [currency, setCurrency] = useState('THB');
  const [categoryType, setCategoryType] = useState('Expense');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const savedCategories = await AsyncStorage.getItem('categories');
        if (savedCategories) {
          setCategories(JSON.parse(savedCategories));
        }
      } catch (error) {
        console.error('Failed to load categories', error);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const saveCategories = async () => {
      try {
        await AsyncStorage.setItem('categories', JSON.stringify(categories));
      } catch (error) {
        console.error('Failed to save categories', error);
      }
    };
    saveCategories();
  }, [categories]);

  const addCategory = () => {
    if (!selectedCategory || !newAmount || !newDate || !currency || !categoryType) {
      alert('Please fill in all fields');
      return;
    }

    // แปลง newAmount เป็น number และตรวจสอบ
    const amount = parseFloat(newAmount);
    if (isNaN(amount)) {
      alert('Amount must be a valid number');
      return;
    }
    if (amount < 0) {
      alert('Amount cannot be negative');
      return;
    }

    const dateRegex = /^\d{2}-\d{2}-\d{4}$/;
    if (!dateRegex.test(newDate)) {
      alert('Date must be in the format dd-mm-yyyy');
      return;
    }

    const validCurrencies = ['THB', 'USD', 'EUR'];
    if (!validCurrencies.includes(currency)) {
      alert('Invalid currency selected');
      return;
    }

    const newBudget = {
      category: selectedCategory,
      amount: amount,
      spent: 0,
      date: newDate,
      currency,
      type: categoryType,
    };

    setCategories([...categories, newBudget]);
    setSelectedCategory('');
    setNewAmount('');
    setNewDate('');
  };

  const deleteCategory = (index) => {
    Alert.alert(
      "Delete Category",
      "Are you sure you want to delete this category?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: () => {
            const updatedCategories = categories.filter((_, i) => i !== index);
            setCategories(updatedCategories);
            alert('Category deleted successfully');
          },
        },
      ]
    );
  };

  const editCategory = (index, newAmount) => {
    const amount = parseFloat(newAmount);
    if (isNaN(amount)) {
      alert('Amount must be a number');
      return;
    }
    const updatedCategories = [...categories];
    updatedCategories[index].amount = amount;
    setCategories(updatedCategories);
    alert('Category updated successfully');
  };

  const updateSpent = (index, amountSpent) => {
    const updatedCategories = [...categories];
    updatedCategories[index].spent += parseFloat(amountSpent);
    setCategories(updatedCategories);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Credit Budgets</Text>
      </View>

      <View style={styles.categoryList}>
        {categories.length === 0 ? (
          <Text style={styles.emptyText}>No budgets found. Add a new budget to get started.</Text>
        ) : (
          categories.map((category, index) => (
            <View key={index} style={styles.categoryCard}>
              <VictoryPie
                data={[
                  { x: "Spent", y: category.spent },
                  { x: "Remaining", y: category.amount - category.spent },
                ]}
                colorScale={["#7f56d9", "#e6e6e6"]}
                width={120}
                height={120}
                innerRadius={40}
                labelRadius={60}
                style={{
                  labels: { fill: "#333", fontSize: 14, fontWeight: "bold" },
                }}
              />
              <Text style={styles.categoryTitle}>{category.category}</Text>
              <Text style={styles.amount}>
                {category.currency} {category.amount.toFixed(2)}
              </Text>
              <Text style={styles.categoryText}>
                Spent: {category.currency} {category.spent.toFixed(2)}
              </Text>
              <Text style={styles.categoryText}>Type: {category.type}</Text>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => deleteCategory(index)}>
                  <Icon name="trash" size={24} color="#ff4444" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  const newAmount = prompt("Enter new amount");
                  if (newAmount !== null) {
                    editCategory(index, newAmount);
                  }
                }}>
                  <Icon name="pencil" size={24} color="#333" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.addCategoryForm}>
        <Text style={styles.sectionTitle}>Create Budget</Text>
        <RNPickerSelect
          onValueChange={(value) => setCategoryType(value)}
          items={[
            { label: 'Expense', value: 'Expense' },
            { label: 'Income', value: 'Income' },
            { label: 'Transfer', value: 'Transfer' },
          ]}
          value={categoryType}
          placeholder={{ label: 'Select a type', value: null }}
        />
        <RNPickerSelect
          onValueChange={(value) => setSelectedCategory(value)}
          items={CategoryList[categoryType].map(category => ({
            label: category,
            value: category,
          }))}
          value={selectedCategory}
          placeholder={{ label: 'Select a category', value: null }}
        />
        <TextInput
          style={styles.input}
          placeholder="Amount"
          value={newAmount}
          keyboardType="numeric"
          onChangeText={setNewAmount}
        />
        <TextInput
          style={styles.input}
          placeholder="Date (dd-mm-yyyy)"
          value={newDate}
          onChangeText={setNewDate}
        />
        <RNPickerSelect
          onValueChange={(value) => setCurrency(value)}
          items={[
            { label: 'THB', value: 'THB' },
            { label: 'USD', value: 'USD' },
            { label: 'EUR', value: 'EUR' },
          ]}
          value={currency}
        />
        <Button title="Save" onPress={addCategory} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  categoryList: {
    marginBottom: 20,
  },
  categoryCard: {
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  amount: {
    fontSize: 16,
    color: '#888',
    marginVertical: 5,
  },
  categoryText: {
    fontSize: 14,
    color: '#333',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    marginTop: 20,
  },
  addCategoryForm: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  input: {
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 5,
    marginBottom: 10,
    paddingLeft: 10,
  },
});