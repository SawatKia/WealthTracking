import { useState } from 'react';
import { useRouter } from "expo-router";
import api from "./axiosInstance";
import { Platform } from 'react-native';

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
    profilePicture?: {
        uri: string;
        name: string;
        type: string;
    } | null; // For handling file uploads (null allows no upload)
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
    
            const formData = new FormData();
    
            // Loop through all fields in updateData (excluding 'profilePicture')
            Object.keys(updateData).forEach((key) => {
                console.log( 'Form Data:', formData,key, updateData[key as keyof UpdateProfileData]);
                if (key === 'profilePicture') {
                    // Handle the profile picture separately
                    const profilePicture = updateData[key];
                    if (profilePicture) {
                        const file = {
                            uri: Platform.OS === 'android' ? profilePicture.uri : profilePicture.uri.replace('file://', ''),
                            name: profilePicture.name || `slip${Date.now()}.jpg`,
                            type: profilePicture.type || 'image/jpeg',
                        };
                        console.log('File:', file);
                        formData.append('profilePicture', file as any);  // Append image as a file
                    }
                } else {
                    // Append normal fields (like password, name, etc.)
                    const value = updateData[key as keyof UpdateProfileData];  // Fixed the issue: should be updateData[key] not requestData[key]
                    if (value) {
                        formData.append(key, value.toString());
                    }
                }
            });

            // Create FormData if there's a profile picture to upload
            // let requestData: UpdateProfileData | FormData = updateData;
            // console.log(requestData)


            // if (updateData.profilePicture) {
            //     const formData = new FormData();
            //     console.log('Form Data:', requestData);

            //     // Add all text fields to FormData
            //     formData.append('profilePicture', updateData.profilePicture as any);
            //     Object.keys(updateData).forEach(key => {
            //         if (key !== 'profilePicture' && updateData[key as keyof UpdateProfileData] !== undefined) {
            //             console.log('Key:', key, 'Value:', updateData[key as keyof UpdateProfileData]);
            //             formData.append(key, updateData[key as keyof UpdateProfileData] as string);
            //         }
            //     });
            //     // Add the profile picture file
            //     // formData.append('profilePicture', updateData.profilePicture);

            //     requestData = formData;
            // }
            console.log('Request Data:', formData);
            const response = await api.patch('/users', formData, {
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