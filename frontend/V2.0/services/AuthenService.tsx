import axios from 'axios';

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
// import * as dotenv from 'dotenv';
// import Cookies from 'js-cookie';
import api from "./axiosInstance";

export const login = async (email: string, password: string) => {
  const requestData = {
    "email": email,
    "password": password,
  }
  try {
    const response = await api.post('/login?platform=mobile', requestData);
    // console.log('login',response.data.data.tokens.access_token)
    const token = response.data.data.tokens.access_token
    if (token) {
      await storeToken(token); // Store the token securely
      return true;
    }
  }
  catch(error) {
    console.error('Login error:', error);
    return false
  }
  return false;
};

export const signUp = async (nationalId:string, username: string, email:string, password: string, confirmPassword:string) => {
  const requestData = {
    "national_id": nationalId,
    "username": username,
    "email": email,
    "password": password,
    "confirm_password": confirmPassword,
    "date_of_birth": "1990-01-01"//not use

  }
  return api.post('/users', requestData);
};


export const saveCredentials = async (email: string, password: string) => {
  try {
    await SecureStore.setItemAsync('rememberedEmail', email);
    await SecureStore.setItemAsync('rememberedPassword', password);
  } catch (error) {
    console.error('Error saving credentials:', error);
  }
};

export const getCredentials = async () => {
  try {
    const email = await SecureStore.getItemAsync('rememberedEmail');
    const password = await SecureStore.getItemAsync('rememberedPassword');
    return { email, password };
  } catch (error) {
    console.error('Error retrieving credentials:', error);
    return { email: null, password: null };
  }
};

export const clearCredentials = async () => {
  try {
    await SecureStore.deleteItemAsync('rememberedEmail');
    await SecureStore.deleteItemAsync('rememberedPassword');
  } catch (error) {
    console.error('Error clearing credentials:', error);
  }
};


const TOKEN_KEY = 'authToken';

export const storeToken = async (token: string) => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

// Retrieve Token
export const getToken = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync(TOKEN_KEY);
};

// Delete Token
export const deleteToken = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};


