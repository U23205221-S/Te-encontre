import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

const AUTH_STORAGE_KEY = 'qr-utp.simulated-session';

const readStoredSession = () => {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.accessToken) return null;

    // Decode JWT payload to get user identity (DNI in subject)
    const tokenPayload = JSON.parse(atob(parsed.accessToken.split('.')[1]));
    const dni = tokenPayload.sub;

    return { fullName: parsed.fullName || dni || 'Usuario', email: parsed.email, accessToken: parsed.accessToken, refreshToken: parsed.refreshToken };
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
    let nameToSave = userData.fullName || userData.dni;

    // Fallback to extract DNI from access token if neither fullName nor DNI was provided
    if (!nameToSave && accessToken) {
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        if (payload && payload.sub) {
          nameToSave = payload.sub;
        }
      } catch {
        // Ignorar
      }
    }

    const payload = {
      fullName: nameToSave || 'Usuario',
      email: userData.email || ''
    };

    if (accessToken) {
      payload.accessToken = accessToken;
    }
    if (refreshToken) {
      payload.refreshToken = refreshToken;
    }
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
    setSessionUser(payload);
  };

  const login = async ({ dni, passwordHash }) => {
    setIsLoading(true);
    try {
      const response = await api.post('/api/auth/login', { dni, passwordHash });
      const { accessToken, refreshToken, fullName } = response.data;
      startSession({ fullName, email: response.data.email }, accessToken, refreshToken);
      return { ok: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al iniciar sesión';
      return { ok: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async ({ dni, email, passwordHash, confirmPasswordHash }) => {
    setIsLoading(true);
    try {
      const response = await api.post('/api/auth/register', { 
        dni, 
        email, 
        passwordHash,
        confirmPasswordHash
      });
      const { accessToken, refreshToken, fullName } = response.data;
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
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      startSession({ fullName: stored.fullName, email: stored.email }, accessToken, newRefreshToken);
      return true;
    } catch {
      // Refresh failed, logout
      logout();
      return false;
    }
  };

  useEffect(() => {
    const handleRefresh = (e) => setSessionUser(e.detail);
    window.addEventListener('auth:refresh', handleRefresh);
    return () => window.removeEventListener('auth:refresh', handleRefresh);
  }, []);

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