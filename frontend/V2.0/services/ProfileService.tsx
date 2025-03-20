import { useState, useEffect } from 'react';
import { useRouter } from "expo-router";
import api from "./axiosInstance";

export interface Users {
    national_id: string;
    username: string;
    email: string;
    date_of_birth: string;
    profile_picture_url: string;
    profile_picture_data: string;
}

interface editUser {
    national_id: string;
    username: string;
    email: string;
    password: string;
    confirm_password: string;
    date_of_birth: string;
}

export const useUsers = () => {
    const [Users, setUsers] = useState<Users[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const getAllUsers = async (): Promise<Users[]> => {
        try {
            const response = await api.get('/users');
            if (response.status === 200) {
                return response.data.data.Users || [];
            } else {
                setError(response.data.statusText);
                return [];
            }
        } catch (err) {
            setError('Failed to load Users data.');
            return [];
        } finally {
            setLoading(false);
        }
    };

    const editUser = async (userData: editUser): Promise<boolean> => {
        try {
            setLoading(true);
            const response = await api.put(`/users/${userData.national_id}`, userData);
            if (response.status === 200) {
                setUsers((prevUsers) =>
                    prevUsers.map((user) =>
                        user.national_id === userData.national_id ? { ...user, ...userData } : user
                    )
                );
                return true;
            } else {
                setError(response.data.statusText);
                return false;
            }
        } catch (err) {
            setError('Failed to update user data.');
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        Users, loading, error, getAllUsers, editUser,
    };
};