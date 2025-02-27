//หนี้โว้ยยยยยยยยยย
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Button, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Debt, useDebt } from '../../services/DebtService';
import DebtPieChart from '../../components/PiechartDebt';

export default function DebtAccountScreen() {
  const [expandedDebt, setExpandedDebt] = useState<string | null>(null);
  const [debtDetails, setDebtDetails] = useState<Debt[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);
  const router = useRouter();
  const { getAllDebts, deleteDebt, fi_codes, getAllfi_code } = useDebt();

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
    getAllfi_code();
  }, []);

  // เพิ่ม useFocusEffect ตรงนี้เพื่อให้โหลดข้อมูลใหม่เมื่อกลับมาที่หน้านี้
  useFocusEffect(
    useCallback(() => {
      fetchDebts();
      return () => {
        // ส่วนของ cleanup ถ้าจำเป็น
      };
    }, [])
  );

  const toggleExpand = (name: string) => {
    setExpandedDebt(expandedDebt === name ? null : name);
  };

  const navigateToAddDebt = () => {
    router.push('/AddDebt');
  };

  const handleUpdateDebt = (debtId: string) => {
    router.push({
      pathname: '/DebtPayment',
      params: { debtId },
    });
  };

  const confirmDeleteDebt = (debtId: string) => {
    setSelectedDebtId(debtId);
    setIsModalVisible(true);
  };

  const handleDeleteDebt = async () => {
    if (selectedDebtId) {
      try {
        const isDeleted = await deleteDebt(selectedDebtId);
        if (isDeleted) {
          setDebtDetails((prev) => prev.filter((debt) => debt.debt_id !== selectedDebtId));
          setIsModalVisible(false);
          const updatedDebts = await getAllDebts();
          if (updatedDebts) {
            setDebtDetails(updatedDebts);
          }
        } else {
          Alert.alert('Error', 'Failed to delete debt. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting debt:', error);
        Alert.alert('Error', 'An error occurred while deleting the debt.');
      }
    }
  };

  const getBankName = (fi_code: string | null) => {
    const bank = fi_codes.find((bank) => bank.fi_code === fi_code);
    return bank ? bank.name_en : 'N/A';
  };

  // Calculate total debt and total monthly payment
  const totalDebt = debtDetails.reduce((sum, debt) => {
    const loanPrinciple = parseFloat(String(debt.loan_principle) || '0');
    return sum + loanPrinciple;
  }, 0);

  const totalMonthlyPayment = debtDetails.reduce((sum, debt) => {
    const loanPrinciple = parseFloat(String(debt.loan_principle) || '0');
    const totalInstallments = parseFloat(String(debt.total_installments) || '1');
    return sum + (loanPrinciple / totalInstallments);
  }, 0);

  return (
    <View style={styles.mainContainer}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16 }}>
        {/* Total debt and monthly payment moved to top */}
        <View style={styles.summaryContainer}>
          <Text style={styles.totalInfoText}>Total Debt : {totalDebt.toLocaleString()} Baht</Text>
          <Text style={styles.totalInfoText}>Total Monthly Payment : {totalMonthlyPayment.toLocaleString()} Baht/Month</Text>
        </View>

        <View style={styles.pieChartContainer}>
          <DebtPieChart />
        </View>

        <View style={styles.debtDetailsContainer}>
          <Text style={styles.sectionTitle}>Debt Details</Text>
          {debtDetails.map((debt, index) => {
            const remainingBalance = debt.loan_balance; // Get remaining balance directly from API
            const totalPaid = debt.loan_principle - remainingBalance; // Calculate totalPaid based on remainingBalance
            const progressPercentage = (totalPaid / debt.loan_principle) * 100;
            const monthlyPayment = debt.loan_principle / debt.total_installments;

            return (
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
                    {monthlyPayment.toLocaleString()} Baht/Month
                  </Text>
                  <Text style={styles.debtInfo}>
                    {debt.current_installment}/{debt.total_installments} Installments Paid
                  </Text>
                  <View style={styles.progressContainer}>
                    <Text style={styles.progressText}>{`${progressPercentage.toFixed(2)}%`}</Text>
                    <View style={styles.progressBar}>
                      <View
                        style={{
                          width: `${progressPercentage}%`,
                          backgroundColor: '#4957AA',
                          height: 8,
                          borderRadius: 4,
                        }}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
                {expandedDebt === debt.debt_name && (
                  <View style={styles.dropdown}>
                    <Text style={styles.dropdownText}>
                      Loan Principal : {debt.loan_principle.toLocaleString()} Baht
                    </Text>
                    <Text style={styles.dropdownText}>
                      Total Paid : {totalPaid.toLocaleString()} Baht
                    </Text>
                    <Text style={styles.dropdownText}>
                      Remaining Balance : {remainingBalance.toLocaleString()} Baht
                    </Text>
                    <Text style={styles.dropdownText}>
                      Payment Channel : {getBankName(debt.fi_code)}
                    </Text>
                    <View style={styles.buttonContainer}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleUpdateDebt(debt.debt_id)}
                      >
                        <Text style={styles.buttonText}>Update Debt</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => confirmDeleteDebt(debt.debt_id)}
                      >
                        <Text style={styles.buttonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.floatingButton} onPress={navigateToAddDebt}>
        <Ionicons name="add" size={45} color="#ffffff" />
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Are you sure you want to delete this debt?</Text>
            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={() => setIsModalVisible(false)} />
              <Button title="Delete" color="red" onPress={handleDeleteDebt} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F0F6FF',
    padding: 16,
  },
  summaryContainer: {
    marginBottom: 16,
    alignItems: 'flex-end', // Align to right side
  },
  totalInfoText: {
    fontSize: 14,
    color: '#555',
  },
  pieChartContainer: {
    marginBottom: 20,
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
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#4957AA',
    marginBottom: 4,
    textAlign: 'right',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  dropdown: {
    marginTop: 8,
  },
  dropdownText: {
    fontSize: 12,
    color: '#555',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  editButton: {
    backgroundColor: '#4957AA',
    padding: 8,
    borderRadius: 4,
    flex: 1,
    marginRight: 5,
  },
  deleteButton: {
    backgroundColor: '#FF4444',
    padding: 8,
    borderRadius: 4,
    flex: 1,
    marginLeft: 5,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
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
    color: '#4957AA',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    width: 300,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
});