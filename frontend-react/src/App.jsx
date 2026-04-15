import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import PaginaGafete from './pages/PaginaGafete';
import PaginaReconocimiento from './pages/PaginaReconocimiento';
import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import RegistroPage from './pages/RegistroPage';
import Header from './components/Header';
import Footer from './components/Footer';
import RequireAuth from './components/RequireAuth';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

function AppShell() {
  const location = useLocation();
  const { sessionUser, logout } = useAuth();
  const shouldShowGlobalFooter = location.pathname !== '/';

  return (
    <div className="flex min-h-screen flex-col bg-surface-base text-slate-100">
      <Header sessionUser={sessionUser} onLogout={logout} />
      <main className="w-full flex-grow">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegistroPage />} />
          <Route
            path="/"
            element={
              <Home />
            }
          />
          <Route
            path="/gafete/:id"
            element={
              <RequireAuth>
                <PaginaGafete />
              </RequireAuth>
            }
          />
          <Route
            path="/reconocimiento"
            element={
              <RequireAuth>
                <PaginaReconocimiento />
              </RequireAuth>
            }
          />
        </Routes>
      </main>
      {shouldShowGlobalFooter ? <Footer /> : null}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </Router>
  );
}

export default App;