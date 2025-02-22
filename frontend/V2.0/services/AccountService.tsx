import { useState, useEffect } from 'react';
import { useRouter } from "expo-router";
import api from "./axiosInstance";

export interface Account {
    account_number: string;
    fi_code: string;
    national_id: string;
    display_name: string;
    account_name: string;
    balance: number;
}

interface AddAccountDetail {
    account_number: string;
    fi_code: string | null;
    display_name: string;
    account_name: string;
    balance: number;
}

export const useAccount = () => {
    const [Accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter()

    const getAllAccounts = async (): Promise<Account[]> => {
        try {
            const response = await api.get('/banks');
            if (response.status === 200) {
                console.log(response.data.data)
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
            const response = await api.delete(`https://api.example.com/banks/${accountNumber}/${fiCode}`);
            if (response.status === 200) {
                setAccounts((prev) => prev.filter((t) => t.account_number !== accountNumber || t.fi_code !== fiCode));
            }
        } catch (err) {
            setError('Failed to delete Account.');
        }
    };

    return { getAllAccounts, createAccount, deleteAccount };

};