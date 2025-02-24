import { useState, useEffect } from 'react';
import { useRouter } from "expo-router";
import api from "./axiosInstance";

export interface fi_code {
    fi_code: string;
    name_th: string;
    name_en: string;
}

export interface Debt {
    debt_id: string;
    fi_code: string | null;
    national_id: string;
    debt_name: string;
    start_date: string;
    current_installment: number;
    total_installments: number;
    loan_principle: number;
    loan_balance: number;
}

interface AddDebtDetail {
    fi_code: string | null;
    debt_name: string;
    start_date: string;
    current_installment: number;
    total_installments: number;
    loan_principle: number;
    loan_balance: number;
}

interface UpdateDebtPaymentParams {
    date: string;
    paymentAmount: number;
    detail: string;
}

export const useDebt = () => {
    const [Debt, setDebt] = useState<Debt[]>([]);
    const [fi_codes, setFi_codes] = useState<fi_code[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    // ฟังก์ชันดึงข้อมูล fi_code
    const getAllfi_code = async (): Promise<fi_code[]> => {
        try {
            const response = await api.get('/fis');
            console.log(response.data); // ตรวจสอบโครงสร้างข้อมูล
            if (response.status === 200) {
                const fis = response.data.data.data || []; // แก้ไขเป็น response.data.data.data
                console.log(fis); // ตรวจสอบข้อมูลธนาคารที่ได้
                setFi_codes(fis);
                return fis;
            } else {
                setError(response.data.statusText);
                return [];
            }
        } catch (err) {
            setError('Failed to load fi_code data.');
            return [];
        } finally {
            setLoading(false);
        }
    };

    // ฟังก์ชันดึงข้อมูลหนี้สิน
    const getAllDebts = async (): Promise<Debt[]> => {
        try {
            const response = await api.get('/debts');
            if (response.status === 200) {
                console.log(response.data.data.debts);
                return response.data.data.debts || [];  // Ensure it always returns an array
            } else {
                setError(response.data.statusText);
                return [];
            }
        } catch (err) {
            setError('Failed to load Debts data.');
            return [];  // Return an empty array on failure
        } finally {
            setLoading(false);
        }
    };

    // ฟังก์ชันสร้างหนี้สิน
    const createDebt = async (AddDebtDetail: AddDebtDetail) => {
        try {
            console.log('create');
            console.log(AddDebtDetail);
            const response = await api.post('/debts', AddDebtDetail);
            console.log('respond create', response.status);
            if (response.status === 201) {
                console.log('create Debt successfully');

                // สร้าง Transaction เมื่อบันทึกหนี้สิน
                const transactionData = {
                    transaction_datetime: new Date().toISOString(), // วันที่ปัจจุบัน
                    category: "Expense : Debt Payment", // หมวดหมู่
                    type: "expense", // ประเภท (รายจ่าย)
                    amount: AddDebtDetail.loan_principle, // จำนวนเงิน
                    note: `Payment for debt: ${AddDebtDetail.debt_name}`, // หมายเหตุ
                    debt_id: response.data.debt_id, // ID ของหนี้สินที่สร้าง
                    sender: null, // หรือข้อมูลบัญชีผู้ใช้
                    receiver: null, // หรือข้อมูลบัญชีเจ้าหนี้
                };

                // ส่งข้อมูล Transaction ไปยัง API
                const transactionResponse = await api.post('/transactions', transactionData);
                if (transactionResponse.status === 201) {
                    console.log('Transaction created successfully');
                } else {
                    console.error('Failed to create transaction');
                }

                router.push('/(tabs)/Debt');
            } else {
                console.log(response.status);
            }
        } catch (err) {
            setError(`Failed to create Debt. ${err}`);
            console.log(error);
        }
    };

    // ฟังก์ชันลบหนี้สิน
    const deleteDebt = async (debt_id: string) => {
        try {
            const response = await api.delete(`/debts/${debt_id}`);
            if (response.status === 200) {
                setDebt((prev) => prev.filter((t) => t.debt_id !== debt_id));
                return true; // ส่งค่า true เพื่อบอกว่าลบสำเร็จ
            }
        } catch (err) {
            setError('Failed to delete Debt.');
            console.error('Error deleting debt:', err);
            return false; // ส่งค่า false เพื่อบอกว่าลบไม่สำเร็จ
        }
    };

    // ฟังก์ชันอัปเดตหนี้สิน
    const updateDebtPayment = async (debtId: string, paymentDetails: UpdateDebtPaymentParams) => {
        try {
            // อัปเดตการชำระหนี้
            const response = await api.put(`/debts/${debtId}/payment`, paymentDetails);
            if (response.status === 200) {
                console.log('Debt payment updated successfully');

                // สร้างรายการ Transaction
                const transactionData = {
                    transaction_datetime: paymentDetails.date,
                    category: "Expense : Debt Payment",
                    type: "expense",
                    amount: paymentDetails.paymentAmount,
                    note: paymentDetails.detail,
                    debt_id: debtId,
                    sender: null, // หรือข้อมูลบัญชีผู้ใช้
                    receiver: null, // หรือข้อมูลบัญชีเจ้าหนี้
                };

                // ส่งข้อมูล Transaction ไปยัง API
                const transactionResponse = await api.post('/transactions', transactionData);
                if (transactionResponse.status === 201) {
                    console.log('Transaction created successfully');
                } else {
                    console.error('Failed to create transaction');
                }

                return true;
            } else {
                setError('Failed to update debt payment.');
                return false;
            }
        } catch (err) {
            setError('Failed to update debt payment.');
            console.error('Error updating debt payment:', err);
            return false;
        }
    };

    return {
        loading,
        error,
        fi_codes,
        Debt,
        getAllfi_code,
        createDebt,
        getAllDebts,
        deleteDebt,
        updateDebtPayment,
    };
};