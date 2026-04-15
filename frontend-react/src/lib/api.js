import axios from 'axios';

const API_URL = 'http://localhost:8080';
const AUTH_STORAGE_KEY = 'qr-utp.simulated-session';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token JWT a todas las requests
api.interceptors.request.use(
  (config) => {
    try {
      const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.accessToken) {
          config.headers.Authorization = `Bearer ${parsed.accessToken}`;
        }
      }
    } catch {
      // Ignore
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar 401/403
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;