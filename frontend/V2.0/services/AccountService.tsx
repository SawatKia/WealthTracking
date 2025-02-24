import { useState, useEffect } from 'react';
import { useRouter } from "expo-router";
import api from "./axiosInstance";

export interface fi_code {
    fi_code: string;
    name_th: string;
    name_en: string;
}

export interface Account {
    account_number: string;
    fi_code: string;
    national_id: string;
    display_name: string;
    account_name: string;
    balance: string;
}

interface AddAccountDetail {
    account_number: string;
    fi_code: string | null;
    display_name: string;
    account_name: string;
    balance: string;
}

export const useAccount = () => {
    const [Accounts, setAccounts] = useState<Account[]>([]);
    const [fi_codes, setFi_codes] = useState<fi_code[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter()

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

    const getAllAccounts = async (): Promise<Account[]> => {
        try {
            const response = await api.get('/banks', { params: { limit: 20 } });
            console.log(response.data.data.bankAccounts.length);
            if (response.status === 200) {
                console.log(response.data.data.bankAccounts)
                return response.data.data.bankAccounts || [];  // Ensure it always returns an array
            } else {
                setError(response.data.statusText);
                return [];
            }
        } catch (err) {
            setError('Failed to load Account data.');
            return [];  // Return an empty array on failure
        } finally {
            setLoading(false);
        }
    };

    const createAccount = async (AddAccountDetail: AddAccountDetail) => {
        try {
            console.log('create')
            console.log(AddAccountDetail)
            const response = await api.post('/banks', AddAccountDetail);
            console.log('respond create', response.status)
            if (response.status === 201) {
                router.push('/(tabs)/Account')
                console.log('create Account successfully')

            }
            else {
                console.log(response.status)
            }
        } catch (err) {
            setError(`Failed to create Account. ${err}`);
            console.log(error)
        }
    };
    const deleteAccount = async (accountNumber: string, fiCode: string) => {
        try {
            const response = await api.delete(`/banks/${accountNumber}/${fiCode}`);
            if (response.status === 200) {
                setAccounts((prev) => prev.filter((t) => t.account_number !== accountNumber || t.fi_code !== fiCode));
                return true; // ส่งค่า true เพื่อบอกว่าลบสำเร็จ
            }
        } catch (err) {
            setError('Failed to delete Account.');
            console.error('Error deleting account:', err);
            return false; // ส่งค่า false เพื่อบอกว่าลบไม่สำเร็จ
        }
    };

    return { getAllfi_code, getAllAccounts, createAccount, deleteAccount };

};
