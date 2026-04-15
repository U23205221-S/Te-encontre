import { createContext, useContext, useState } from 'react';

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

  const startSession = (userData) => {
    const payload = { fullName: userData.fullName, email: userData.email };
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
    setSessionUser(payload);
  };

  const handleLogin = ({ email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (password.length < 6) {
      return { ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
    }

    const storedSession = readStoredSession();

    if (storedSession && storedSession.email.toLowerCase() !== normalizedEmail) {
      return { ok: false, error: 'El correo no coincide con la cuenta simulada registrada.' };
    }

    if (!storedSession && normalizedEmail !== 'prueba@gmail.com') {
      return { ok: false, error: 'Para el acceso demo usa prueba@gmail.com.' };
    }

    startSession({
      fullName: storedSession?.fullName ?? normalizedEmail.split('@')[0],
      email: normalizedEmail,
    });

    return { ok: true };
  };

  const handleRegister = ({ fullName, email, password }) => {
    if (password.length < 6) {
      return { ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
    }

    startSession({ fullName, email });
    return { ok: true };
  };

  const logout = () => {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    setSessionUser(null);
  };

  return (
    <AuthContext.Provider value={{ sessionUser, login: handleLogin, register: handleRegister, logout, startSession }}>
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