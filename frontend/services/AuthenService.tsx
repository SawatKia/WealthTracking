import axios from 'axios';

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
// import * as dotenv from 'dotenv';
// import Cookies from 'js-cookie';
import api from "./axiosInstance";
import { router } from 'expo-router';

export const login = async (email: string, password: string) => {
  const requestData = {
    "email": email,
    "password": password,
  }
  try {
    const data = await api.post('/login?platform=mobile', requestData);
    console.log('login',data.data.data)
    if (data.status === 200) {
      const accessToken = data.data.data.tokens.access_token;
      const refreshToken = data.data.data.tokens.refresh_token;
    
      await storeToken(accessToken); // Store access token
      await storeRefreshToken(refreshToken); // Store refresh token
    
      return true;
    }else {
      // If the status is not 200, show an error
      const errorMessage = data.data?.message || 'Login failed, please try again.';
      return errorMessage;
    }

  }
  catch (error) {
    console.error('Login error:', error);
    return "Incorrect email or password";
  }
};

export const signUp = async (nationalId:string, username: string, email:string, password: string, confirmPassword:string) => {
  const requestData = {
    "national_id": nationalId,
    "username": username,
    "email": email,
    "password": password,
    "confirm_password": confirmPassword,
  }

  try {
    console.log(requestData)
    const response =await api.post('/users', requestData);
    if (response.status === 201) {
      console.log( response.data.data)
      router.push('/Login')

      return response.status; 
    } else {
      throw new Error('Failed to create account');
    }
  } catch (err) {
    throw new Error(`Failed ${err}`)
  }
};


export const signUpGoogle = async() =>{
  const response = await api.post('/google/login?action=register&platform=mobile')
  return response.data
}

export const loginGoogle = async() =>{
  const response = await api.post('/google/login?action=login&platform=mobile')
  console.log(response.data.data)
  // const responseGoogle = await api.get(response.data.data)
  // console.log(responseGoogle)
  return response.data
}


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
    if (Platform.OS === 'web') {
 // Store token in browser storage
    }
    else{

      await SecureStore.deleteItemAsync('rememberedPassword');
      await SecureStore.deleteItemAsync('rememberedEmail');
    }
  } catch (error) {
    console.error('Error clearing credentials:', error);
  }
};


const TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export const storeToken = async (token: string) => {
  console.log('storeToken')
  if (Platform.OS === 'web') {
    console.log('storeToken web')
    localStorage.setItem(TOKEN_KEY, token); // Store token in browser storage
  } else {
    console.log('storeToken mobile')
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  }
};

// Retrieve Token
export const getToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(TOKEN_KEY); // Get token from browser storage
  } else {
  return await SecureStore.getItemAsync(TOKEN_KEY);
  }
};

export const storeRefreshToken = async (token: string) => {
  console.log('storeRefreshToken');
  if (Platform.OS === 'web') {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  }
};

// Retrieve Refresh Token
export const getRefreshToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } else {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  }
};

// Delete Token
export const deleteToken = async () => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(TOKEN_KEY);
  } else {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
};


