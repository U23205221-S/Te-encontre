import { Globe, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const footerLinks = [
  { label: 'Privacidad', to: '/#privacidad' },
  { label: 'Términos de uso', to: '/#terminos' },
  { label: 'Contacto', to: '/#contacto' },
  { label: 'Preguntas frecuentes', to: '/#preguntas' },
];

const footerActions = [
  { label: 'Compartir ¡ Te encontré !', icon: Share2 },
  { label: 'Sitio público de ¡ Te encontré !', icon: Globe },
];

const Footer = ({ className = '' }) => {
  return (
    <footer className={`border-t border-brand-200/15 bg-surface-base ${className}`}>
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-8 px-6 py-12 text-center md:flex-row md:px-8 md:text-left">
        <div className="space-y-2">
          <p className="text-lg font-bold text-brand-200">¡ Te encontré !</p>
          <p className="text-sm text-slate-300">© 2026 ¡ Te encontré !. Protegemos lo que más importa.</p>
        </div>

        <nav aria-label="Enlaces legales" className="w-full md:w-auto">
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm md:justify-start">
            {footerLinks.map((link) => (
              <li key={link.label}>
                <Link
                  to={link.to}
                  className="text-slate-300/85 transition-colors hover:text-slate-100"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-4">
          {footerActions.map((action) => {
            const Icon = action.icon;

            return (
              <button
                key={action.label}
                type="button"
                aria-label={action.label}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-soft text-slate-200 transition-colors hover:bg-brand-800 hover:text-brand-100"
              >
                <Icon size={18} aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
