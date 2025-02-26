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
    fi_code?: string; // Optional fi_code parameter
}

interface UpdateDebtParams {
    fi_code?: string;
    debt_name?: string;
    start_date?: string;
    current_installment?: number;
    total_installments?: number;
    loan_principle?: number;
    loan_balance?: number;
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
                const debts = response.data.data.debts || [];
                setDebt(debts); // ปรับปรุงสถานะใน state
                return debts;
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
    const createDebt = async (debtDetail: AddDebtDetail): Promise<string | null> => {
        try {
            console.log('Creating debt:', debtDetail);

            // API call to create debt
            const response = await api.post('/debts', debtDetail);

            console.log('Debt creation response:', response.status);

            if (response.status === 201) {
                console.log('Debt created successfully');

                // เรียกดึงข้อมูลหนี้ทั้งหมดอีกครั้งเพื่ออัปเดต state
                await getAllDebts();

                // ส่งค่า debt_id ที่ได้จาก response กลับไป
                return response.data.debt_id || null;
            } else {
                console.error('Failed with status:', response.status);
                return null;
            }
        } catch (err) {
            console.error('Error creating debt:', err);
            setError(`Failed to create Debt: ${err}`);
            return null;
        }
    };

    // ฟังก์ชันลบหนี้สิน
    const deleteDebt = async (debt_id: string): Promise<boolean> => {
        try {
            const response = await api.delete(`/debts/${debt_id}`);
            if (response.status === 200) {
                // อัปเดต state โดยลบหนี้ที่ถูกลบออกไป
                setDebt((prev) => prev.filter((t) => t.debt_id !== debt_id));
                return true;
            }
            return false;
        } catch (err) {
            setError('Failed to delete Debt.');
            console.error('Error deleting debt:', err);
            return false;
        }
    };

    // ฟังก์ชันอัปเดตการชำระหนี้
    const updateDebtPayment = async (debtId: string, paymentDetails: UpdateDebtPaymentParams): Promise<boolean> => {
        try {
            // อัปเดตการชำระหนี้
            const response = await api.put(`/debts/${debtId}/payment`, paymentDetails);

            if (response.status === 200) {
                console.log('Debt payment updated successfully');

                // อัปเดต state ด้วยข้อมูลล่าสุด
                await getAllDebts();

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

    // ฟังก์ชันอัปเดตข้อมูลหนี้
    const updateDebt = async (debtId: string, debtDetails: UpdateDebtParams): Promise<boolean> => {
        try {
            // ส่งคำขอ PATCH เพื่ออัปเดตข้อมูลหนี้
            const response = await api.patch(`/debts/${debtId}`, debtDetails);

            if (response.status === 200) {
                console.log('Debt updated successfully');

                // อัปเดต state ด้วยข้อมูลล่าสุด
                await getAllDebts();

                return true;
            } else {
                setError('Failed to update debt.');
                return false;
            }
        } catch (err) {
            setError('Failed to update debt.');
            console.error('Error updating debt:', err);
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
        updateDebt, // เพิ่มฟังก์ชัน updateDebt ใน return object
    };
};