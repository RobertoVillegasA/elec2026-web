// frontend/src/services/api.js
import axios from 'axios';

// URL de la API - se configura según el entorno
const API_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname.includes('pythonanywhere.com') 
    ? window.location.origin 
    : 'http://localhost:8000');

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para agregar el token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;