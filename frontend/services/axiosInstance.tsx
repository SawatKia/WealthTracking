// src/api/axiosInstance.ts
import axios from "axios";
import { storeToken, getToken, deleteToken } from "./AuthenService"; 

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  async (config) => {
    console.log("Checking token...");
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

// Response interceptor to handle 401 and refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn("Token expired. Attempting refresh...");
      try {
        const refreshResponse = await api.post("/refresh?platform=mobile");
        const newToken = refreshResponse.data.token;

        if (newToken) {
          await storeToken(newToken); // Store the new token
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return api(error.config); // Retry the failed request
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        await deleteToken(); // Clear the invalid token
      }
    }
    return Promise.reject(error);
  }
);

export default api;
