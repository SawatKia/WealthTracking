import axios from 'axios';

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
// import * as dotenv from 'dotenv';
// import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: 'http://127.0.0.1:3000/api/v0.2', // Replace with your backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});
api.interceptors.request.use(
  async (config) => {
    const token = await getToken(); // Retrieve the token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Add token to Authorization header
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

//refesh when error 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {

      try {
        const refreshResponse = await api.post('/refresh-token');
        const newToken = refreshResponse.data.token;

        if (newToken) {
          await storeToken(newToken); // Store the new token
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return api(error.config); 
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        await deleteToken();
      }
    }
    return Promise.reject(error);
  }
);

export const login = async (email: string, password: string) => {
  const requestData = {
    "email": email,
    "password": password,
  }
  try {
    const response = await api.post('/login', requestData);
    if (response.data.access_token) {
      await storeToken(response.data.access_token); // Store the token securely
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

export default api;
