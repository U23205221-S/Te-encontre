import { createContext, useContext, useState } from 'react';
import { api } from '../lib/api';

const AUTH_STORAGE_KEY = 'qr-utp.simulated-session';

const readStoredSession = () => {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.fullName || !parsed.email) return null;

    return { fullName: parsed.fullName, email: parsed.email };
  } catch {
    return null;
  }
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [sessionUser, setSessionUser] = useState(() => {
    if (typeof window === 'undefined') return null;
    return readStoredSession();
  });

  const [isLoading, setIsLoading] = useState(false);

  const startSession = (userData, accessToken, refreshToken) => {
    const payload = { fullName: userData.fullName, email: userData.email };
    if (accessToken) {
      payload.accessToken = accessToken;
    }
    if (refreshToken) {
      payload.refreshToken = refreshToken;
    }
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
    setSessionUser(payload);
  };

  const login = async ({ email, password }) => {
    setIsLoading(true);
    try {
      const response = await api.post('/api/auth/login', { userName: email, passwordHash: password });
      const { fullName, accessToken, refreshToken } = response.data;
      startSession({ fullName, email }, accessToken, refreshToken);
      return { ok: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al iniciar sesión';
      return { ok: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async ({ fullName, email, password, dni }) => {
    setIsLoading(true);
    try {
      const response = await api.post('/api/auth/register', { 
        userName: email, 
        passwordHash: password,
        confirmPasswordHash: password,
        fullName,
        dni
      });
      const { accessToken, refreshToken } = response.data;
      startSession({ fullName, email }, accessToken, refreshToken);
      return { ok: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al registrar';
      return { ok: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Ignore errors - logout locally anyway
    }
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    setSessionUser(null);
  };

  const refreshToken = async () => {
    const stored = readStoredSession();
    if (!stored?.refreshToken) return false;

    try {
      const response = await api.post('/api/auth/refresh', { refreshToken: stored.refreshToken });
      const { fullName, accessToken, refreshToken: newRefreshToken } = response.data;
      startSession({ fullName, email: stored.email }, accessToken, newRefreshToken);
      return true;
    } catch {
      // Refresh failed, logout
      logout();
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ sessionUser, login, register, logout, refreshToken, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};