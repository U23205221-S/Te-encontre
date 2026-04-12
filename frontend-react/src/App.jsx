import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import PaginaGafete from './pages/PaginaGafete';
import PaginaReconocimiento from './pages/PaginaReconocimiento';
import Home from './pages/Home';
import Header from './components/Header';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import './index.css';

const AUTH_STORAGE_KEY = 'qr-utp.simulated-session';
const DEMO_LOGIN_EMAIL = 'prueba@gmail.com';

const readStoredSession = () => {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    if (!parsed || !parsed.fullName || !parsed.email) {
      return null;
    }

    return {
      fullName: parsed.fullName,
      email: parsed.email,
    };
  } catch {
    return null;
  }
};

function AppShell({
  openAuth,
  sessionUser,
  handleLogout,
  isAuthModalOpen,
  authMode,
  setAuthMode,
  closeAuth,
  handleLogin,
  handleRegister,
  demoEmail,
}) {
  const location = useLocation();
  const shouldShowGlobalFooter = location.pathname !== '/';

  return (
    <div className="flex min-h-screen flex-col bg-surface-base text-slate-100">
      <Header onOpenAuth={openAuth} sessionUser={sessionUser} onLogout={handleLogout} />
      <main className="w-full flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/gafete/:id" element={<PaginaGafete />} />
          <Route path="/reconocimiento" element={<PaginaReconocimiento />} />
        </Routes>
      </main>
      <AuthModal
        isOpen={isAuthModalOpen}
        mode={authMode}
        onModeChange={setAuthMode}
        onClose={closeAuth}
        onLogin={handleLogin}
        onRegister={handleRegister}
        demoEmail={demoEmail}
      />
      {shouldShowGlobalFooter ? <Footer /> : null}
    </div>
  );
}

function App() {
  const [sessionUser, setSessionUser] = useState(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    return readStoredSession();
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  useEffect(() => {
    document.body.style.overflow = isAuthModalOpen ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [isAuthModalOpen]);

  const openAuth = (mode) => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuth = () => {
    setIsAuthModalOpen(false);
  };

  const startSession = (userData) => {
    const payload = {
      fullName: userData.fullName,
      email: userData.email,
    };

    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
    setSessionUser(payload);
    setIsAuthModalOpen(false);
  };

  const handleLogin = ({ email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (password.length < 6) {
      return {
        ok: false,
        error: 'La contraseña debe tener al menos 6 caracteres.',
      };
    }

    const storedSession = readStoredSession();

    if (storedSession && storedSession.email.toLowerCase() !== normalizedEmail) {
      return {
        ok: false,
        error: 'El correo no coincide con la cuenta simulada registrada.',
      };
    }

    if (!storedSession && normalizedEmail !== DEMO_LOGIN_EMAIL) {
      return {
        ok: false,
        error: `Para el acceso demo usa ${DEMO_LOGIN_EMAIL}.`,
      };
    }

    startSession({
      fullName: storedSession?.fullName ?? normalizedEmail.split('@')[0],
      email: normalizedEmail,
    });

    return { ok: true };
  };

  const handleRegister = ({ fullName, email, password }) => {
    if (password.length < 6) {
      return {
        ok: false,
        error: 'La contraseña debe tener al menos 6 caracteres.',
      };
    }

    startSession({ fullName, email });
    return { ok: true };
  };

  const handleLogout = () => {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    setSessionUser(null);
  };

  return (
    <Router>
      <AppShell
        openAuth={openAuth}
        sessionUser={sessionUser}
        handleLogout={handleLogout}
        isAuthModalOpen={isAuthModalOpen}
        authMode={authMode}
        setAuthMode={setAuthMode}
        closeAuth={closeAuth}
        handleLogin={handleLogin}
        handleRegister={handleRegister}
        demoEmail={DEMO_LOGIN_EMAIL}
      />
    </Router>
  );
}

export default App
