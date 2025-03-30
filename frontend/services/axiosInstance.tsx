import axios from "axios";
import { storeToken, getToken, getRefreshToken, deleteToken } from "./AuthenService"; 

const api = axios.create({
  baseURL: "http://ce67-25.cloud.ce.kmitl.ac.th/api/v0.2",
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

export default api;