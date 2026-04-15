import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

const RegistroPage = () => {
  const navigate = useNavigate();
  const { register: handleRegister } = useAuth();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();

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

    const result = handleRegister({
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

  return (
    <div className="flex min-h-[calc(100vh-var(--header-height))] items-center justify-center bg-surface-base px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-extrabold text-slate-100">Crear cuenta</h1>
          <p className="text-slist-300">
            Regístrate para gestionar los registros de tu familia.
          </p>
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
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-semibold text-slate-200">
                Contraseña
              </label>
              <input
                id="password"
                name="new-password"
                type="password"
                autoComplete="new-password"
                className="ui-input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1 block text-sm font-semibold text-slate-200">
                Confirmar contraseña
              </label>
              <input
                id="confirmPassword"
                name="confirm-new-password"
                type="password"
                autoComplete="new-password"
                className="ui-input"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Repite tu contraseña"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-emergency-dark/40 bg-emergency-dark/20 px-3 py-2 text-sm text-slate-100" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="ui-btn-primary w-full">
              Crear cuenta
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