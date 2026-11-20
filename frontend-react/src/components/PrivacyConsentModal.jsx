import { ShieldCheck, X, Fingerprint } from 'lucide-react';

const PrivacyConsentModal = ({ isOpen, onClose, onAccept, version = '1.0' }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-consent-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-card border border-surface-border bg-white text-text-body shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-surface-border bg-surface-soft px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <ShieldCheck size={22} />
            </span>
            <div>
              <span className="inline-block rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-brand-700">
                VERSIÓN {version}
              </span>
              <h2 id="privacy-consent-title" className="text-lg font-extrabold text-text-primary">
                Consentimiento informado de privacidad
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar consentimiento"
            className="rounded-full border border-surface-border bg-white p-2 text-text-muted hover:bg-surface-muted hover:text-text-primary"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-6 text-sm leading-relaxed">
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-amber-900">
            <Fingerprint size={20} className="mt-0.5 shrink-0 text-amber-700" />
            <p className="font-medium">
              Este registro utiliza datos personales, una fotografía y un descriptor biométrico facial para identificar al familiar en situaciones de emergencia.
            </p>
          </div>

          <section>
            <h3 className="mb-1 font-bold text-text-primary">Datos que serán tratados</h3>
            <ul className="list-disc space-y-1 pl-5 text-text-body">
              <li>Nombre, DNI, fecha de nacimiento y género del familiar.</li>
              <li>Fotografía y patrón matemático de reconocimiento facial.</li>
              <li>Datos de contacto de los apoderados autorizados.</li>
            </ul>
          </section>

          <section>
            <h3 className="mb-1 font-bold text-text-primary">Finalidad</h3>
            <p>
              Generar un identificador QR, permitir la búsqueda facial y facilitar que un ciudadano que encuentre a tu familiar notifique y contacte a los apoderados durante una emergencia.
            </p>
          </section>

          <section>
            <h3 className="mb-1 font-bold text-text-primary">Información visible para el ciudadano</h3>
            <p>
              Solo se mostrará el nombre de pila (primer nombre) del familiar y acciones de ayuda para enviar una alerta SOS o llamar al contacto genérico correspondiente. No se mostrarán DNI, correos, domicilios, números telefónicos visibles, nombres completos de apoderados ni datos biométricos.
            </p>
          </section>

          <section>
            <h3 className="mb-1 font-bold text-text-primary">Conservación y revocación</h3>
            <p>
              El consentimiento permanecerá vigente mientras el perfil esté activo. El apoderado podrá revocarlo desde «Mis familiares»; al hacerlo se desactivarán inmediatamente el código QR y el reconocimiento facial. La revocación no afecta tratamientos realizados legítimamente con anterioridad.
            </p>
          </section>

          <section>
            <h3 className="mb-1 font-bold text-text-primary">Derechos sobre los datos</h3>
            <p>
              El titular o su representante puede solicitar acceso, rectificación, cancelación u oposición al tratamiento, conforme a la Ley N.° 29733 de Protección de Datos Personales.
            </p>
          </section>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-surface-border bg-surface-soft px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-module border border-surface-border bg-white px-4 py-2 text-sm font-semibold text-text-body hover:bg-surface-muted"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="ui-btn-primary px-5 py-2 text-sm font-bold"
          >
            He leído y acepto
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyConsentModal;
