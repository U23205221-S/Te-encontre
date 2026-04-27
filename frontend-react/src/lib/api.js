import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
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

// Flag para prevenir loops de refresh
let isRefreshing = false;

// Interceptor para manejar 401/403 y auto-refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si es 401 y no es una petition de refresh y no we've retryado
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Evitar double refresh
      if (isRefreshing) return Promise.reject(error);

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
        if (!stored) {
          throw new Error('No session');
        }

        const parsed = JSON.parse(stored);
        if (!parsed.refreshToken) {
          throw new Error('No refresh token');
        }

        // Llamar al endpoint de refresh
        const response = await axios.post(`${API_URL}/api/auth/refresh`, {
          refreshToken: parsed.refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken, fullName } = response.data;

  // Guardar nuevos tokens y posible actualización de nombre
  const newSession = { fullName: fullName || parsed.fullName, email: parsed.email, accessToken, refreshToken: newRefreshToken };
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newSession));

  // Emitir evento para actualizar el AuthContext
  window.dispatchEvent(new CustomEvent('auth:refresh', { detail: newSession }));

        // Reintentar request original
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        isRefreshing = false;
        return api(originalRequest);
      } catch {
        isRefreshing = false;
        // Refresh falló - logout
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    // Otros errores (no 401) o ya se retryó
    return Promise.reject(error);
  }
);

export default api;