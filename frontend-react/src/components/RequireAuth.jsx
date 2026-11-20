import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AUTH_STORAGE_KEY = 'qr-utp.simulated-session';

const RequireAuth = ({ children }) => {
  const { sessionUser } = useAuth();
  const location = useLocation();

  // Fallback: verificar localStorage si el context está vacío
  let user = sessionUser;
  if (!user) {
    try {
      const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.accessToken || (parsed.fullName && parsed.email))) {
          user = parsed;
        }
      }
    } catch {
      // Ignore parse errors
    }
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
};

export default RequireAuth;