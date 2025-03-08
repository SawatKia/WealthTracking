import { useState } from 'react';
import { useRouter } from "expo-router";
import api from "./axiosInstance";

export interface UserProfile {
    national_id: string;
    username: string;
    email: string;
    date_of_birth: string;
    profile_picture_url: string;
    profile_picture_data?: string;
}

export interface UpdateProfileData {
    username?: string;
    email?: string;
    date_of_birth?: string;
    password?: string; // Required when updating user information
    newPassword?: string;
    newConfirmPassword?: string;
    profilePicture?: File | null; // For handling file uploads
}

export const useProfile = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const getUserProfile = async (): Promise<UserProfile | null> => {
        try {
            setLoading(true);
            const response = await api.get('/users');

            if (response.status === 200) {
                const userData = response.data.data;
                setProfile(userData);
                return userData;
            } else {
                setError(response.data.message || 'Failed to retrieve user profile.');
                return null;
            }
        } catch (err) {
            setError('Failed to load user profile data.');
            console.error('Error fetching profile:', err);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const updateUserProfile = async (updateData: UpdateProfileData): Promise<UserProfile | null> => {
        try {
            setLoading(true);

            // Create FormData if there's a profile picture to upload
            let requestData: UpdateProfileData | FormData = updateData;

            if (updateData.profilePicture) {
                const formData = new FormData();

                // Add all text fields to FormData
                Object.keys(updateData).forEach(key => {
                    if (key !== 'profilePicture' && updateData[key as keyof UpdateProfileData] !== undefined) {
                        formData.append(key, updateData[key as keyof UpdateProfileData] as string);
                    }
                });

                // Add the profile picture file
                formData.append('profilePicture', updateData.profilePicture);

                requestData = formData;
            }

            const response = await api.patch('/users', requestData, {
                headers: updateData.profilePicture ? {
                    'Content-Type': 'multipart/form-data',
                } : undefined
            });

            if (response.status === 200) {
                const updatedProfile = response.data.data;
                setProfile(updatedProfile);
                return updatedProfile;
            } else {
                setError(response.data.message || 'Failed to update user profile.');
                return null;
            }
        } catch (err) {
            setError('Failed to update user profile.');
            console.error('Error updating profile:', err);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const deleteUserAccount = async (password: string): Promise<boolean> => {
        try {
            setLoading(true);

            const response = await api.delete('/users', {
                data: { password }
            });

            if (response.status === 200) {
                setProfile(null);
                // Redirect to login or home page after successful deletion
                router.push('/Login');
                return true;
            } else {
                setError(response.data.message || 'Failed to delete user account.');
                return false;
            }
        } catch (err) {
            setError('Failed to delete user account.');
            console.error('Error deleting account:', err);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const getProfilePicture = (): string => {
        return profile?.profile_picture_url || '';
    };

    return {
        profile,
        loading,
        error,
        getUserProfile,
        updateUserProfile,
        deleteUserAccount,
        getProfilePicture
    };
};