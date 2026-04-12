import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, ShieldAlert, X } from 'lucide-react';

const navigationItems = [
  {
    to: '/?action=registro',
    label: 'Registrar a mi hijo/a',
    isActive: (location) =>
      location.pathname === '/' && new URLSearchParams(location.search).get('action') === 'registro',
  },
  {
    to: '/?action=scanner',
    label: 'Escanear o ingresar enlace',
    isActive: (location) =>
      location.pathname === '/' && new URLSearchParams(location.search).get('action') === 'scanner',
  },
  {
    to: '/?action=reconocimiento',
    label: 'Buscar por reconocimiento facial',
    isActive: (location) =>
      location.pathname === '/' && new URLSearchParams(location.search).get('action') === 'reconocimiento',
  },
  {
    to: '/#como-funciona',
    label: 'Cómo funciona',
    isActive: (location) => location.pathname === '/' && location.hash === '#como-funciona',
  },
];

const Header = ({ onOpenAuth, sessionUser, onLogout }) => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isLoggedIn = Boolean(sessionUser);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen((current) => !current);
  };

  return (
    <header className="sticky top-0 z-50 bg-brand-900/80 text-slate-100 shadow-[0_24px_48px_rgba(0,0,0,0.4)] backdrop-blur-xl">
      <div className="ui-header-height relative flex w-full items-center px-3 md:px-4 lg:px-5">
        <Link to="/" className="inline-flex h-10 items-center gap-2.5 transition-opacity hover:opacity-90" aria-label="Inicio CodeQR Alerta">
          <ShieldAlert size={24} className="text-brand-200" aria-hidden="true" />
          <span className="inline-flex items-baseline gap-1 text-xl font-extrabold tracking-tight text-brand-200 md:text-[1.4rem] md:leading-none">
            ¡ Te encontré !
          </span>
        </Link>

        <nav
          id="main-navigation-desktop"
          aria-label="Accesos rápidos"
          className="absolute left-1/2 hidden -translate-x-1/2 md:block"
        >
          <ul className="flex items-center gap-7 font-bold tracking-tight">
            {navigationItems.map((item) => {
              const isActive = item.isActive(location);

              return (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className={`inline-flex items-center border-b-2 pb-1 text-[0.95rem] transition-colors duration-300 ${
                      isActive
                        ? 'border-accent-300 text-accent-300'
                        : 'border-transparent text-slate-300 hover:text-brand-200'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center gap-3 md:flex">
            {isLoggedIn ? (
              <>
                <span className="inline-flex items-center rounded-full border border-brand-200/20 bg-surface-soft px-3 py-1 text-xs font-semibold text-slate-200">
                  {sessionUser.fullName}
                </span>
                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex items-center rounded-lg border border-brand-200/20 bg-surface-soft px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-brand-800"
                  aria-label="Cerrar sesión"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="inline-flex items-center px-2 py-2 text-sm font-semibold text-slate-300 hover:text-slate-100"
                  onClick={() => onOpenAuth('login')}
                  aria-label="Acceder a una cuenta"
                >
                  Acceder
                </button>
                <button
                  type="button"
                  className="inline-flex items-center rounded-xl bg-accent-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-accent-400"
                  onClick={() => onOpenAuth('register')}
                  aria-label="Registrar una cuenta"
                >
                  Registrar ahora
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg border border-brand-200/20 bg-surface-soft p-2 text-slate-100 transition-colors hover:bg-brand-800 md:hidden"
            onClick={toggleMenu}
            aria-label={isMenuOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
            aria-expanded={isMenuOpen}
            aria-controls="main-navigation"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <nav
        id="main-navigation"
        aria-label="Accesos rápidos"
        className={`overflow-hidden border-t border-brand-200/15 bg-brand-900/95 transition-all duration-300 ease-out md:hidden ${
          isMenuOpen ? 'max-h-96 translate-y-0 opacity-100' : 'max-h-0 -translate-y-2 opacity-0'
        }`}
      >
        <div className="mx-auto w-full max-w-7xl px-6 py-4">
          <ul className="flex flex-col gap-2">
            {navigationItems.map((item) => {
              const isActive = item.isActive(location);

              return (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    onClick={() => setIsMenuOpen(false)}
                    className={`inline-flex w-full items-center rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                      isActive
                        ? 'border-accent-400 bg-accent-500 text-slate-950 shadow-sm'
                        : 'border-brand-200/15 bg-surface-soft text-slate-200 hover:border-brand-200/30 hover:bg-brand-800 hover:text-slate-100'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 grid grid-cols-1 gap-2 border-t border-brand-200/15 pt-4">
            {isLoggedIn ? (
              <>
                <p className="rounded-lg border border-brand-200/20 bg-surface-soft px-3 py-2 text-sm font-semibold text-slate-200">
                  Sesión iniciada: {sessionUser.fullName}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    setIsMenuOpen(false);
                  }}
                  className="inline-flex w-full items-center justify-center rounded-xl border border-brand-200/20 bg-surface-soft px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-brand-800"
                  aria-label="Cerrar sesión"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onOpenAuth('login');
                    setIsMenuOpen(false);
                  }}
                  className="inline-flex w-full items-center justify-center rounded-xl border border-brand-200/20 bg-surface-soft px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-brand-800"
                  aria-label="Acceder a una cuenta"
                >
                  Acceder
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onOpenAuth('register');
                    setIsMenuOpen(false);
                  }}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-accent-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-accent-400"
                  aria-label="Registrar una cuenta"
                >
                  Registrar ahora
                </button>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
