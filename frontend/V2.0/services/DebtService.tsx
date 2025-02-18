import { useState, useEffect } from 'react';
import { useRouter } from "expo-router";
import api from "./axiosInstance";

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

export const useDebt = () => {
    const [Accounts, setAccounts] = useState<Debt[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter()

    const createDebt = async (AddDebtDetail: AddDebtDetail) => {
        try {
            console.log('create')
            console.log(AddDebtDetail)
            const response = await api.post('/debts', AddDebtDetail);
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

    return { createDebt };

};