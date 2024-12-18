import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:3000/api/v0.2', // Replace with your backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

export const login = async (username: string, password: string) => {
  return api.post('/auth/login', { username, password });
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

export default api;