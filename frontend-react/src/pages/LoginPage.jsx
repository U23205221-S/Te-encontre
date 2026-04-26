import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login: handleLogin, isLoading } = useAuth();
  const [form, setForm] = useState({ dni: '', passwordHash: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.dni || !form.passwordHash) {
      setError('Completa tu DNI y contraseña para continuar.');
      return;
    }

    if (form.dni.length !== 8) {
      setError('El DNI debe tener exactamente 8 dígitos.');
      return;
    }

    const result = await handleLogin({ dni: form.dni, passwordHash: form.passwordHash });

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
            <span className="text-sm text-text-body">Demo DNI: 60751404</span>
          </p>
        </div>

        <div className="rounded-card border border-surface-border bg-surface-card p-6 shadow-card">
          <form className="space-y-4" autoComplete="off" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="dni" className="mb-1 block text-sm font-semibold text-text-heading">
                DNI
              </label>
              <input
                id="dni"
                name="dni"
                type="text"
                inputMode="numeric"
                autoComplete="username"
                className="ui-input"
                value={form.dni}
                onChange={(e) => setForm({ ...form, dni: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                placeholder="8 dígitos"
                maxLength={8}
                spellCheck={false}
                disabled={isLoading}
              />
            </div>

            <div className="relative">
              <label htmlFor="passwordHash" className="mb-1 block text-sm font-semibold text-text-heading">
                Contraseña
              </label>
              <input
                id="passwordHash"
                name="current-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="ui-input pr-10"
                value={form.passwordHash}
                onChange={(e) => setForm({ ...form, passwordHash: e.target.value })}
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
