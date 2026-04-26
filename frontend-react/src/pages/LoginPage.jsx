import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, Eye, EyeOff } from 'lucide-react';

const DEMO_LOGIN_EMAIL = 'prueba@gmail.com';

const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

const LoginPage = () => {
  const navigate = useNavigate();
  const { login: handleLogin, isLoading } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.email || !form.password) {
      setError('Completa tu correo y contraseña para continuar.');
      return;
    }

    if (!isValidEmail(form.email)) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }

    const result = await handleLogin({ email: form.email, password: form.password });

    if (!result.ok) {
      setError(result.error);
      return;
    }

    navigate('/');
  };

  return (
    <div className="flex min-h-[calc(100vh-var(--header-height))] items-center justify-center bg-surface-base px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-extrabold text-text-primary">Acceder</h1>
          <p className="text-text-body">
            Ingresa con tu cuenta para gestionar tus registros.
            <br />
            <span className="text-sm text-text-body">Demo: {DEMO_LOGIN_EMAIL}</span>
          </p>
        </div>

        <div className="rounded-card border border-surface-border bg-surface-card p-6 shadow-card">
          <form className="space-y-4" autoComplete="off" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-semibold text-text-heading">
                Correo electrónico
              </label>
              <input
                id="email"
                name="username"
                type="email"
                autoComplete="username"
                className="ui-input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder={DEMO_LOGIN_EMAIL}
                spellCheck={false}
                disabled={isLoading}
              />
            </div>

            <div className="relative">
              <label htmlFor="password" className="mb-1 block text-sm font-semibold text-text-heading">
                Contraseña
              </label>
              <input
                id="password"
                name="current-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="ui-input pr-10"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[34px] text-text-body hover:text-brand-500"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <p className="rounded-module border border-emergency-light bg-red-50 px-3 py-2 text-sm text-emergency" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="ui-btn-primary w-full flex items-center justify-center gap-2" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? 'Iniciando sesión...' : 'Acceder'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-text-body">
              ¿No tienes cuenta?{' '}
              <Link to="/registro" className="font-semibold text-brand-500 hover:text-brand-600">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
