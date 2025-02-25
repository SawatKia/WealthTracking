import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { VictoryChart, VictoryBar, VictoryTheme } from 'victory-native';
import api from '../services/axiosInstance';

// Interface for monthly debt payment data
interface MonthlyDebtPayment {
    x: string;  // Month name (Jan, Feb, etc.)
    y: number;  // Payment amount
}

const DebtYearlyPaymentsChart = () => {
    const [monthlyData, setMonthlyData] = useState<MonthlyDebtPayment[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Get current year
    const currentYear = new Date().getFullYear();

    // Fetch the monthly debt payment data
    const fetchMonthlyDebtPayments = async () => {
        try {
            setLoading(true);
            // Make API call to get transactions related to debt payments
            const response = await api.get('/transactions/summary/monthly');

            if (response.status === 200) {
                const data = response.data.data.summary;

                // Filter transactions for current year and only debt payments
                const filteredData = data.filter((item: any) => {
                    const itemYear = new Date(item.month).getFullYear();
                    return itemYear === currentYear;
                });

                // Transform data for the chart
                const formattedData = filteredData.map((item: any) => {
                    // Extract debt payment amounts from transactions
                    // Assuming debt payments are categorized as "Expense : Debt Payment"
                    const debtPayments = item.transactions
                        ? item.transactions.filter((t: any) => t.category === "Expense : Debt Payment")
                        : [];

                    // Sum the debt payment amounts
                    const totalDebtPayment = debtPayments.reduce(
                        (sum: number, transaction: any) => sum + transaction.amount,
                        0
                    );

                    return {
                        x: new Date(item.month).toLocaleString('default', { month: 'short' }),
                        y: totalDebtPayment
                    };
                });

                setMonthlyData(formattedData);
            } else {
                setError('Failed to fetch debt payment data');
            }
        } catch (err) {
            console.error('Error fetching debt payment data:', err);
            setError('An error occurred while fetching debt payment data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMonthlyDebtPayments();
    }, []);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Loading debt payment data...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Error: {error}</Text>
            </View>
        );
    }

    // If no data, display a message
    if (monthlyData.length === 0) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>No debt payment data available for {currentYear}</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10, alignSelf: 'flex-start' }}>
                Annual Debt Overview
            </Text>
            <VictoryChart domainPadding={{ x: 10 }} theme={VictoryTheme.material}>
                <VictoryBar
                    data={monthlyData}
                    style={{
                        data: {
                            fill: '#4957AA',
                            width: 15
                        }
                    }}
                />
            </VictoryChart>
        </View>
    );
};

export default DebtYearlyPaymentsChart;