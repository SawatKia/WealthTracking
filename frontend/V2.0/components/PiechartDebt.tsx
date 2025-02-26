import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { VictoryPie, VictoryTheme, VictoryLabel } from 'victory-native';

interface DebtPieChartProps {
    debts: { debt_name: string; loan_balance: number }[];
}

const DebtPieChart: React.FC<DebtPieChartProps> = ({ debts }) => {
    const [chartData, setChartData] = useState<{ x: string; y: number; label: string }[]>([]);
    const [totalDebt, setTotalDebt] = useState<number>(0);

    // ฟังก์ชันสำหรับแปลงข้อมูลหนี้โดยใช้ remaining balance
    const transformDebtData = (debts: { debt_name: string; loan_balance: number }[]) => {
        // เรียงลำดับข้อมูลตามยอดหนี้จากมากไปน้อย
        const sortedDebts = [...debts].sort((a, b) => b.loan_balance - a.loan_balance);

        // คำนวณยอดหนี้รวมทั้งหมด
        const total = sortedDebts.reduce((sum, debt) => sum + debt.loan_balance, 0);
        setTotalDebt(total);

        return sortedDebts.map((debt) => {
            const percentage = ((debt.loan_balance / total) * 100).toFixed(1);
            return {
                x: debt.debt_name,
                y: debt.loan_balance,
                label: `${debt.debt_name}`,
            };
        });
    };

    // แปลงข้อมูลหนี้เมื่อได้รับ props
    useEffect(() => {
        if (debts && debts.length > 0) {
            const transformedData = transformDebtData(debts);
            setChartData(transformedData);
        }
    }, [debts]);

    // แสดง Loading Indicator ขณะรอข้อมูล
    if (!debts || debts.length === 0) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#4957AA" />
            </View>
        );
    }

    // แสดง Pie Chart พร้อมข้อมูลเพิ่มเติม
    return (
        <View style={styles.container}>

            <VictoryPie
                data={chartData}
                theme={VictoryTheme.material}
                colorScale={['#4957AA', '#7F8CD9', '#9AC9F3', '#FF8C00', '#FF6347']}
                labelRadius={({ datum }) => 130 + datum.y / 20} // ปรับระยะห่างของป้ายชื่อตามขนาดของส่วน
                labels={({ datum }) => datum.label}
                style={{
                    labels: {
                        fontSize: 12,
                        fill: '#000',
                        lineHeight: 1.5
                    },
                    data: {
                        fillOpacity: 0.9,
                        stroke: "#fff",
                        strokeWidth: 1
                    }
                }}
                animate={{
                    duration: 1000,
                    easing: "bounce"
                }}
                sortKey="y"
                sortOrder="descending"
            />

            <View style={styles.legendContainer}>
                {chartData.map((item, index) => (
                    <View key={index} style={styles.legendItem}>
                        <View
                            style={[
                                styles.legendColor,
                                {
                                    backgroundColor: ['#4957AA', '#7F8CD9', '#9AC9F3', '#FF8C00', '#FF6347'][index % 5]
                                }
                            ]}
                        />
                        <Text style={styles.legendText}>
                            {item.x}: {item.y.toLocaleString()} บาท
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F0F6FF',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#333',
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 16,
        color: '#666',
    },
    errorText: {
        fontSize: 16,
        color: 'red',
        textAlign: 'center',
    },
    legendContainer: {
        marginTop: 20,
        alignSelf: 'stretch',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    legendColor: {
        width: 16,
        height: 16,
        borderRadius: 8,
        marginRight: 8,
    },
    legendText: {
        fontSize: 12,
        color: '#333',
    },
});

export default DebtPieChart;