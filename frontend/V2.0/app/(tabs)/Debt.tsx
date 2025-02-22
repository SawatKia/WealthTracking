import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { VictoryPie, VictoryBar, VictoryChart, VictoryAxis, VictoryTheme, VictoryLabel } from 'victory-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Debt, useDebt } from '../../services/DebtService';

export default function DebtAccountScreen() {
  const [expandedDebt, setExpandedDebt] = useState<string | null>(null);
  const [debtDetails, setDebtDetails] = useState<Debt[]>([]);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { getAllDebts } = useDebt();

  const fetchDebts = async () => {
    try {
      const debts = await getAllDebts();
      setDebtDetails(debts);
    } catch (error) {
      console.error('Error fetching debts:', error);
    }
  };

  useEffect(() => {
    fetchDebts();
  }, []);

  const toggleExpand = (name: string) => {
    setExpandedDebt(expandedDebt === name ? null : name);
  };

  const navigateToAddDebt = () => {
    router.push('/AddDebt');
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16 }}>
        <View style={styles.debtDetailsContainer}>
          <Text style={styles.sectionTitle}>Debt Details</Text>
          {debtDetails.map((debt, index) => (
            <View key={index} style={styles.debtDetail}>
              <TouchableOpacity onPress={() => toggleExpand(debt.debt_name)}>
                <View style={styles.debtHeader}>
                  <Text style={styles.debtName}>{debt.debt_name}</Text>
                  <Icon
                    name={expandedDebt === debt.debt_name ? 'expand-less' : 'expand-more'}
                    size={24}
                    color="#4957AA"
                    style={styles.dropdownIcon}
                  />
                </View>
                <Text style={styles.debtInfo}>
                  {debt.loan_balance.toLocaleString()} Baht remaining, {debt.current_installment}/{debt.total_installments} installments paid
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={{
                      width: `${(debt.current_installment / debt.total_installments) * 100}%`,
                      backgroundColor: '#4957AA',
                      height: 8,
                      borderRadius: 4,
                    }}
                  />
                </View>
              </TouchableOpacity>
              {expandedDebt === debt.debt_name && (
                <View style={styles.dropdown}>
                  <Text style={styles.dropdownText}>
                    Loan Principal: {debt.loan_principle.toLocaleString()} Baht
                  </Text>
                  <Text style={styles.dropdownText}>
                    Financial Institution Code: {debt.fi_code || 'N/A'}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.floatingButton} onPress={navigateToAddDebt}>
        <Ionicons name="add" size={45} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F0F6FF',
    padding: 16,
  },
  debtDetailsContainer: {
    marginTop: 16,
  },
  debtDetail: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  debtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  debtName: {
    fontSize: 14,
    color: '#555',
  },
  debtInfo: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginTop: 8,
  },
  dropdown: {
    marginTop: 8,
  },
  dropdownText: {
    fontSize: 12,
    color: '#555',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#7F8CD9',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    marginTop: 20,
  },
  dropdownIcon: {
    marginLeft: 8,
    color: '#4957AA', // สีของไอคอน
  },
});