import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { VictoryPie, VictoryTheme, VictoryLabel } from "victory-native";
import { useDebt } from "../services/DebtService";
import { all } from "axios";

const ReportByCategory = () => {
    const { getAllDebts, loading, error } = useDebt();
    const [chartData, setChartData] = useState<any[]>([]);

    useEffect(() => {
        const fetchDebt = async () => {
            try {
                const data = await getAllDebts();
                if (data) {

                    const allDebt = data.map((debt: any) => ({
                        x: debt.debt_name,
                        y: parseFloat(debt.loan_balance),
                    }));
                    console.log("Data", allDebt);
                    setChartData(allDebt);
                }
            }
            catch (err) {
                console.log(err);
            }
        };

        fetchDebt();
    }, []);

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#4957AA" />
            </View>
        );
    }

    // Check if there's no debt data
    if (chartData.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.noDataText}>
                    No debt data. Please add your debt to see the debt overview in pie chart.
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <VictoryPie
                data={chartData}
                theme={VictoryTheme.clean}
                labelRadius={150}
                colorScale={['#4957AA', '#7F8CD9', '#9AC9F3', '#FF8C00', '#FF6347']}
                style={{
                    labels: {
                        fontSize: 10,
                        fill: "#000",
                    },
                    data: {
                        fillOpacity: 0.9,
                        borderWidth: 20,
                        borderRadius: 20,
                    },
                    parent: {
                        backgroundColor: "transparent",
                        borderRadius: 20,
                        padding: 2,
                    },
                }}
            />
            <VictoryLabel
                textAnchor="middle"
                style={{ fontSize: 14 }}
                x={200}
                y={200}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 16
    },
    noDataText: {
        fontSize: 16,
        textAlign: "center",
        color: "#4957AA",
        fontWeight: "500",
        marginHorizontal: 20,
        lineHeight: 24
    }
});

export default ReportByCategory;