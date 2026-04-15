import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEMO_LOGIN_EMAIL = 'prueba@gmail.com';

const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

const LoginPage = () => {
  const navigate = useNavigate();
  const { login: handleLogin } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.email || !form.password) {
      setError('Completa tu correo y contraseña para continuar.');
      return;
    }

    if (!isValidEmail(form.email)) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }

    const result = handleLogin({ email: form.email, password: form.password });

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
          <h1 className="mb-2 text-3xl font-extrabold text-slate-100">Acceder</h1>
          <p className="text-slate-300">
            Ingresa con tu cuenta para gestionar tus registros.
            <br />
            <span className="text-sm text-slate-400">Demo: {DEMO_LOGIN_EMAIL}</span>
          </p>
        </div>

        <div className="rounded-3xl border border-brand-200/15 bg-surface-soft p-6 shadow-[0_24px_48px_rgba(0,0,0,0.35)]">
          <form className="space-y-4" autoComplete="off" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-semibold text-slate-200">
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
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-semibold text-slate-200">
                Contraseña
              </label>
              <input
                id="password"
                name="current-password"
                type="password"
                autoComplete="current-password"
                className="ui-input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-emergency-dark/40 bg-emergency-dark/20 px-3 py-2 text-sm text-slate-100" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="ui-btn-primary w-full">
              Acceder
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-300">
              ¿No tienes cuenta?{' '}
              <Link to="/registro" className="font-semibold text-accent-400 hover:text-accent-300">
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