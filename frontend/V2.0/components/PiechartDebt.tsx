import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { VictoryPie, VictoryTheme } from 'victory-native';
import { useDebt } from '../services/DebtService'; // เปลี่ยน path ตามโครงสร้างโปรเจค

const DebtPieChart = () => {
    const { getAllDebts, loading, error } = useDebt();
    const [chartData, setChartData] = useState<{ x: string; y: number }[]>([]);
    console.log(chartData);

    // ฟังก์ชันสำหรับแปลงข้อมูลหนี้โดยใช้ remaining balance
    const transformDebtData = (debts: any[]) => {
        return debts.map((debt) => {
            // คำนวณ total paid และ remaining balance
            const totalPaid = debt.current_installment * (debt.loan_principle / debt.total_installments);
            const remainingBalance = debt.loan_principle - totalPaid;

            return {
                x: debt.debt_name, // แสดงเฉพาะชื่อหนี้
                y: remainingBalance, // ใช้ remaining balance เป็นค่าสัดส่วน
            };
        });
    };

    // ดึงข้อมูลหนี้และแปลงข้อมูล
    useEffect(() => {
        const fetchDebts = async () => {
            try {
                const debts = await getAllDebts();
                if (debts) {
                    const transformedData = transformDebtData(debts);
                    setChartData(transformedData);
                }
            } catch (err) {
                console.error('Error fetching debts:', err);
            }
        };

        fetchDebts();
    }, []);

    // แสดง Loading Indicator ขณะรอข้อมูล
    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#4957AA" />
            </View>
        );
    }

    // แสดงข้อความผิดพลาดหากมี
    if (error) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Error: {error}</Text>
            </View>
        );
    }

    // แสดง Pie Chart
    return (
        <View style={styles.container}>
            {/* ลบหัวข้อ Debt by Category ออกแล้ว */}
            <VictoryPie
                data={chartData}
                theme={VictoryTheme.material}
                colorScale={['#4957AA', '#7F8CD9', '#9AC9F3', '#FF8C00', '#FF6347']} // กำหนดสีสำหรับแต่ละหมวดหมู่
                labelRadius={160} // ระยะห่างของป้ายชื่อ
                labels={({ datum }) => `${datum.x}`} // แสดงเฉพาะชื่อหนี้ ไม่แสดงจำนวนเงิน
                style={{
                    labels: { fontSize: 12, fill: '#000' }, // สไตล์ของป้ายชื่อ
                }}
            />
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
    errorText: {
        fontSize: 16,
        color: 'red',
        textAlign: 'center',
    },
    // ลบ title style ที่ไม่ได้ใช้แล้ว
});

export default DebtPieChart;