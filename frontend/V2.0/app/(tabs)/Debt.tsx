import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { VictoryPie, VictoryBar, VictoryChart, VictoryAxis, VictoryTheme, VictoryLabel } from 'victory-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // เพิ่ม Ionicons

interface DebtData {
  name: string;
  value: number;
  color: string;
}

interface DebtDetail {
  name: string;
  totalDebt: number;
  monthlyPayment: number;
  installmentsPaid: number;
  totalInstallments: number;
  outstandingDebt: number;
  payThrough: string;
}

export default function DebtAccountScreen() {
  const [expandedDebt, setExpandedDebt] = useState<string | null>(null);
  const router = useRouter();
  const { width } = useWindowDimensions();

  const data: DebtData[] = [
    { name: 'Credit Card', value: 35, color: '#4957AA' },
    { name: 'Housing', value: 30, color: '#7F8CD9' },
    { name: 'Car', value: 20, color: '#9AC9F3' },
    { name: 'Other', value: 15, color: '#BDBDBD' },
  ];

  const monthlyPayments = [4000, 4200, 4100, 4050, 4150, 4200, 4250, 4300, 4350, 4400, 4450, 4500];

  const debtDetails: DebtDetail[] = [
    {
      name: 'Home Installment',
      totalDebt: 2544000,
      monthlyPayment: 10600,
      installmentsPaid: 120,
      totalInstallments: 240,
      outstandingDebt: 1272000,
      payThrough: 'Kasikorn Credit Card',
    },
    {
      name: 'Car Loan',
      totalDebt: 1200000,
      monthlyPayment: 8000,
      installmentsPaid: 24,
      totalInstallments: 60,
      outstandingDebt: 960000,
      payThrough: 'Bangkok Bank',
    },
  ];

  const totalDebt = 2589500;
  const monthlyPayment = 4000;
  const budget = 10000;

  const toggleExpand = (name: string) => {
    setExpandedDebt(expandedDebt === name ? null : name);
  };

  const navigateToAddDebt = () => {
    router.push('/AddDebt');
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16 }}>
        {/* Pie Chart Section */}
        <View style={styles.chartContainer}>
          <VictoryPie
            data={data}
            x="name"
            y="value"
            colorScale={data.map((item) => item.color)}
            innerRadius={0}
            labelRadius={80}
            labels={({ datum }) => `${datum.name}\n${datum.value}%`}
            labelComponent={
              <VictoryLabel
                style={{ fontSize: 18, fill: 'white' }}
                textAnchor="middle"
                verticalAnchor="middle"
                lineHeight={1.5}
              />
            }
          />
          <View style={styles.chartOverlay}>
            <Text style={styles.overlayText1}>
              Total Debt : {totalDebt.toLocaleString()} Baht
            </Text>
            <Text style={styles.overlayText2}>
              Total Installment : {monthlyPayment} from {budget} Baht/Month
            </Text>
          </View>
        </View>

        {/* Bar Chart Section */}
        <View style={styles.graph}>
          <Text style={styles.sectionTitle}>Annual Debt Overview</Text>
          <VictoryChart
            theme={VictoryTheme.material}
            domainPadding={10}
            width={width - 32}
            height={200}
            padding={{ top: 20, bottom: 50, left: 50, right: 20 }}
          >
            <VictoryAxis
              tickValues={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]}
              tickFormat={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
              style={{
                tickLabels: { fontSize: 12, angle: -45, textAnchor: 'end' },
                grid: { stroke: '#E0E0E0', strokeWidth: 1 },
              }}
            />
            <VictoryAxis
              dependentAxis
              style={{
                tickLabels: { fontSize: 12 },
                grid: { stroke: '#E0E0E0', strokeWidth: 1 },
              }}
            />
            <VictoryBar
              data={monthlyPayments.map((payment, index) => ({ x: index + 1, y: payment }))}
              style={{ data: { fill: '#4957AA', width: 15 } }}
            />
          </VictoryChart>
        </View>

        {/* Debt Details Section */}
        <View style={styles.debtDetailsContainer}>
          <Text style={styles.sectionTitle}>Debt Details</Text>
          {debtDetails.map((debt, index) => (
            <View key={index} style={styles.debtDetail}>
              <TouchableOpacity onPress={() => toggleExpand(debt.name)}>
                <View style={styles.debtHeader}>
                  <Text style={styles.debtName}>{debt.name}</Text>
                  <Icon
                    name={expandedDebt === debt.name ? 'expand-less' : 'expand-more'}
                    size={24}
                    color="#4957AA"
                    style={styles.dropdownIcon}
                  />
                </View>
                <Text style={styles.debtInfo}>
                  {debt.monthlyPayment.toLocaleString()} Baht/month, {debt.installmentsPaid}/{debt.totalInstallments} installments paid
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={{
                      width: `${(debt.installmentsPaid / debt.totalInstallments) * 100}%`,
                      backgroundColor: '#4957AA',
                      height: 8,
                      borderRadius: 4,
                    }}
                  />
                </View>
              </TouchableOpacity>
              {expandedDebt === debt.name && (
                <View style={styles.dropdown}>
                  <Text style={styles.dropdownText}>
                    Outstanding Debt : {debt.outstandingDebt.toLocaleString()}/{debt.totalDebt.toLocaleString()}
                  </Text>
                  <Text style={styles.dropdownText}>
                    Pay In Installments Through : {debt.payThrough}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Floating Button */}
      <TouchableOpacity style={styles.floatingButton} onPress={navigateToAddDebt}>
        <Ionicons name="add" size={45} color="#ffffff" /> {/* เปลี่ยนจาก Text เป็น Ionicons */}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#F0F6FF',
    padding: 16,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    position: 'relative',
  },
  chartOverlay: {
    position: 'absolute',
    top: -15,
    right: 0,
    padding: 8,
  },
  overlayText1: {
    fontSize: 14,
    color: '#555',
    textAlign: 'right',
  },
  overlayText2: {
    fontSize: 12,
    color: '#555',
    textAlign: 'right',
  },
  graph: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginTop: -15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    marginTop: 20,
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
  dropdownIcon: {
    marginLeft: 8,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#7F8CD9', // สีพื้นหลัง
    width: 60,
    height: 60,
    borderRadius: 30, // ทำให้เป็นวงกลม
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5, // สำหรับ Android
  },
});