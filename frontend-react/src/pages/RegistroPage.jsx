import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

const passwordRequirements = [
  { key: 'minLength', label: 'Mínimo 6 caracteres', test: (p) => p.length >= 6 },
  { key: 'hasLetter', label: 'Al menos una letra', test: (p) => /[a-zA-Z]/.test(p) },
  { key: 'hasNumber', label: 'Al menos un número', test: (p) => /[0-9]/.test(p) },
];

const RegistroPage = () => {
  const navigate = useNavigate();
  const { register: handleRegister, isLoading } = useAuth();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.fullName || !form.email || !form.password || !form.confirmPassword) {
      setError('Completa todos los campos para crear tu cuenta.');
      return;
    }

    if (!isValidEmail(form.email)) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }

    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('La confirmación de contraseña no coincide.');
      return;
    }

    const result = await handleRegister({
      fullName: form.fullName,
      email: form.email,
      password: form.password,
    });

    if (!result.ok) {
      setError(result.error);
      return;
    }

    navigate('/');
  };

  const checkRequirement = (req) => req.test(form.password);

  return (
    <div className="flex min-h-[calc(100vh-var(--header-height))] items-center justify-center bg-surface-base px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-extrabold text-slate-100">Crear cuenta</h1>
          <p className="text-slate-300">Regístrate para gestionar los registros de tu familia.</p>
        </div>

        <div className="rounded-3xl border border-brand-200/15 bg-surface-soft p-6 shadow-[0_24px_48px_rgba(0,0,0,0.35)]">
          <form className="space-y-4" autoComplete="off" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="fullName" className="mb-1 block text-sm font-semibold text-slate-200">
                Nombre completo
              </label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                className="ui-input"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Ej. María López"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-semibold text-slate-200">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className="ui-input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="nombre@correo.com"
                spellCheck={false}
                disabled={isLoading}
              />
            </div>

            <div className="relative">
              <label htmlFor="password" className="mb-1 block text-sm font-semibold text-slate-200">
                Contraseña
              </label>
              <input
                id="password"
                name="new-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className="ui-input pr-10"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-200"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {form.password && (
              <div className="space-y-1 rounded-lg bg-surface-base p-3">
                {passwordRequirements.map((req) => (
                  <div key={req.key} className="flex items-center gap-2 text-sm">
                    {checkRequirement(req) ? (
                      <CheckCircle size={14} className="text-emerald-400" />
                    ) : (
                      <XCircle size={14} className="text-slate-500" />
                    )}
                    <span className={checkRequirement(req) ? 'text-emerald-400' : 'text-slate-500'}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="relative">
              <label htmlFor="confirmPassword" className="mb-1 block text-sm font-semibold text-slate-200">
                Confirmar contraseña
              </label>
              <input
                id="confirmPassword"
                name="confirm-new-password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className="ui-input pr-10"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Repite tu contraseña"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-200"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {form.confirmPassword && form.password && (
              <p
                className={`text-sm ${
                  form.password === form.confirmPassword ? 'text-emerald-400' : 'text-emergency-dark'
                }`}
              >
                {form.password === form.confirmPassword
                  ? 'Las contraseñas coinciden'
                  : 'Las contraseñas no coinciden'}
              </p>
            )}

            {error && (
              <p className="rounded-lg border border-emergency-dark/40 bg-emergency-dark/20 px-3 py-2 text-sm text-slate-100" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="ui-btn-primary w-full flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-300">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="font-semibold text-accent-400 hover:text-accent-300">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistroPage;