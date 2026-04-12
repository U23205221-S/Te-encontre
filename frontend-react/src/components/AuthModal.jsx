import { useEffect, useState } from 'react';

const initialLoginForm = {
  email: '',
  password: '',
};

const initialRegisterForm = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

const AuthModal = ({
  isOpen,
  mode,
  onModeChange,
  onClose,
  onLogin,
  onRegister,
  demoEmail,
}) => {
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const closeModal = () => {
    setLoginForm(initialLoginForm);
    setRegisterForm(initialRegisterForm);
    setErrorMessage('');
    onClose();
  };

  const switchMode = (nextMode) => {
    setErrorMessage('');
    onModeChange(nextMode);
  };

  const submitLogin = (event) => {
    event.preventDefault();

    if (!loginForm.email || !loginForm.password) {
      setErrorMessage('Completa tu correo y contraseña para continuar.');
      return;
    }

    if (!isValidEmail(loginForm.email)) {
      setErrorMessage('Ingresa un correo electrónico válido.');
      return;
    }

    const result = onLogin({
      email: loginForm.email,
      password: loginForm.password,
    });

    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }

    setLoginForm(initialLoginForm);
    setErrorMessage('');
  };

  const submitRegister = (event) => {
    event.preventDefault();

    if (!registerForm.fullName || !registerForm.email || !registerForm.password || !registerForm.confirmPassword) {
      setErrorMessage('Completa todos los campos para crear tu cuenta.');
      return;
    }

    if (!isValidEmail(registerForm.email)) {
      setErrorMessage('Ingresa un correo electrónico válido.');
      return;
    }

    if (registerForm.password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setErrorMessage('La confirmación de contraseña no coincide.');
      return;
    }

    const result = onRegister({
      fullName: registerForm.fullName,
      email: registerForm.email,
      password: registerForm.password,
    });

    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }

    setRegisterForm(initialRegisterForm);
    setErrorMessage('');
  };

  return (
    <div
      data-home-ignore-snap
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={closeModal}
    >
      <section
        className="ui-glass w-full max-w-md rounded-3xl p-6 shadow-[0_24px_48px_rgba(0,0,0,0.4)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 id="auth-modal-title" className="text-2xl font-extrabold text-slate-100">
              {mode === 'login' ? 'Acceder' : 'Registrar ahora'}
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              {mode === 'login'
                ? `Ingresa con tu cuenta para gestionar tus registros. Demo: ${demoEmail}.`
                : 'Crea una cuenta simulada para continuar en el frontend.'}
            </p>
          </div>
          <button
            type="button"
            className="ui-modal-close"
            onClick={closeModal}
            aria-label="Cerrar ventana de autenticación"
          >
            ✕
          </button>
        </header>

        <div className="mb-5 grid grid-cols-2 rounded-xl border border-brand-200/20 bg-surface-soft p-1">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              mode === 'login' ? 'bg-brand-200 text-brand-900' : 'text-slate-300 hover:text-slate-100'
            }`}
            aria-pressed={mode === 'login'}
          >
            Acceder
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              mode === 'register' ? 'bg-accent-500 text-slate-950' : 'text-slate-300 hover:text-slate-100'
            }`}
            aria-pressed={mode === 'register'}
          >
            Registrar ahora
          </button>
        </div>

        {mode === 'login' ? (
          <form className="space-y-4" autoComplete="off" onSubmit={submitLogin}>
            <div>
              <label htmlFor="login-email" className="mb-1 block text-sm font-semibold text-slate-200">
                Correo electrónico
              </label>
              <input
                id="login-email"
                name="username"
                type="email"
                autoComplete="username"
                className="ui-input"
                value={loginForm.email}
                onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
                placeholder={demoEmail}
                spellCheck={false}
              />
            </div>
            <div>
              <label htmlFor="login-password" className="mb-1 block text-sm font-semibold text-slate-200">
                Contraseña
              </label>
              <input
                id="login-password"
                name="current-password"
                type="password"
                autoComplete="current-password"
                className="ui-input"
                value={loginForm.password}
                onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            {errorMessage && (
              <p className="rounded-lg border border-emergency-dark/40 bg-emergency-dark/20 px-3 py-2 text-sm text-slate-100" role="alert">
                {errorMessage}
              </p>
            )}

            <button type="submit" className="ui-btn-primary w-full">
              Acceder
            </button>
          </form>
        ) : (
          <form className="space-y-4" autoComplete="off" onSubmit={submitRegister}>
            <div>
              <label htmlFor="register-name" className="mb-1 block text-sm font-semibold text-slate-200">
                Nombre completo
              </label>
              <input
                id="register-name"
                type="text"
                autoComplete="name"
                className="ui-input"
                value={registerForm.fullName}
                onChange={(event) => setRegisterForm({ ...registerForm, fullName: event.target.value })}
                placeholder="Ej. María López"
              />
            </div>

            <div>
              <label htmlFor="register-email" className="mb-1 block text-sm font-semibold text-slate-200">
                Correo electrónico
              </label>
              <input
                id="register-email"
                name="email"
                type="email"
                autoComplete="email"
                className="ui-input"
                value={registerForm.email}
                onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })}
                placeholder="nombre@correo.com"
                spellCheck={false}
              />
            </div>

            <div>
              <label htmlFor="register-password" className="mb-1 block text-sm font-semibold text-slate-200">
                Contraseña
              </label>
              <input
                id="register-password"
                name="new-password"
                type="password"
                autoComplete="new-password"
                className="ui-input"
                value={registerForm.password}
                onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label htmlFor="register-confirm-password" className="mb-1 block text-sm font-semibold text-slate-200">
                Confirmar contraseña
              </label>
              <input
                id="register-confirm-password"
                name="confirm-new-password"
                type="password"
                autoComplete="new-password"
                className="ui-input"
                value={registerForm.confirmPassword}
                onChange={(event) => setRegisterForm({ ...registerForm, confirmPassword: event.target.value })}
                placeholder="Repite tu contraseña"
              />
            </div>

            {errorMessage && (
              <p className="rounded-lg border border-emergency-dark/40 bg-emergency-dark/20 px-3 py-2 text-sm text-slate-100" role="alert">
                {errorMessage}
              </p>
            )}

            <button type="submit" className="ui-btn-primary w-full">
              Registrar ahora
            </button>
          </form>
        )}
      </section>
    </div>
  );
};

export default AuthModal;
