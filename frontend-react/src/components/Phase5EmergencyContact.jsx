import { useState, useEffect } from 'react';
import {
  PhoneCall,
  ShieldAlert,
  CheckCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { fetchPublicAlertStatus } from '../lib/api';

const computeRemainingSeconds = (expiresAt) => {
  if (!expiresAt) return 120;
  const diff = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000);
  return Math.max(0, diff);
};

const Phase5EmergencyContact = ({ badgeData, onClose }) => {
  const [polledAssistance, setPolledAssistance] = useState(null);
  const assistance =
    polledAssistance?.alertUuid && polledAssistance.alertUuid === badgeData?.alertUuid
      ? polledAssistance
      : badgeData || {};
  const [timeLeft, setTimeLeft] = useState(() => computeRemainingSeconds(assistance?.expiresAt));

  const alertUuid = assistance?.alertUuid;
  const alertStatus = assistance?.alertStatus || 'ACTIVE';
  const isConfirmed = alertStatus === 'CONFIRMED';
  const isEscalated = alertStatus === 'ESCALATED';

  useEffect(() => {
    if (isConfirmed || isEscalated) return undefined;
    const tick = setInterval(() => {
      setTimeLeft(computeRemainingSeconds(assistance?.expiresAt));
    }, 1000);
    return () => clearInterval(tick);
  }, [assistance?.expiresAt, isConfirmed, isEscalated]);

  useEffect(() => {
    if (!alertUuid || isConfirmed || isEscalated) return undefined;
    let active = true;

    const pollStatus = async () => {
      try {
        const latest = await fetchPublicAlertStatus(alertUuid);
        if (active && latest) {
          setPolledAssistance(latest);
          if (latest.expiresAt) {
            setTimeLeft(computeRemainingSeconds(latest.expiresAt));
          }
        }
      } catch {
        // Keep current view and retry on next interval
      }
    };

    const pollInterval = setInterval(pollStatus, 4000);
    return () => {
      active = false;
      clearInterval(pollInterval);
    };
  }, [alertUuid, isConfirmed, isEscalated]);

  const formatTime = (seconds) => {
    const safe = Math.max(0, Number(seconds) || 0);
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const firstName = assistance?.firstName || 'Familiar';
  const primaryContact = assistance?.primaryContact;
  const auxiliaryContacts = Array.isArray(assistance?.auxiliaryContacts)
    ? assistance.auxiliaryContacts
    : [];
  const emergencyLineUri = assistance?.emergencyLineUri || 'tel:114';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-brand-900/50 p-4 backdrop-blur-md">
      <div className="relative my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-surface-border bg-surface-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-surface-border bg-brand-50 px-6 py-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-brand-500" />
            <div>
              <h3 className="text-lg font-extrabold text-brand-800 md:text-xl">
                ¡Alerta enviada con éxito!
              </h3>
              <p className="text-xs font-semibold text-brand-700">
                Familiar identificado: {firstName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xl font-bold text-text-muted hover:text-text-primary"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 bg-surface-base p-6">
          <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-xs font-medium text-brand-800">
            Se ha notificado al apoderado titular con la ubicación del encuentro.
          </div>

          <div className="rounded-xl border border-brand-200 bg-brand-50 p-5 text-center">
            <h4 className="mb-4 text-2xl font-black text-brand-900">
              {primaryContact?.label || 'Apoderado Titular'}
            </h4>
            {primaryContact?.telUri ? (
              <a
                href={primaryContact.telUri}
                className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-brand-600 px-8 py-4 font-extrabold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-brand-700 active:translate-y-0 md:w-auto"
              >
                <PhoneCall className="h-5 w-5" />
                Llamar al titular
              </a>
            ) : (
              <p className="text-sm font-bold text-red-600">Canal telefónico no disponible</p>
            )}
          </div>

          {isConfirmed ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
              <ShieldCheck className="mx-auto mb-2 h-8 w-8 text-emerald-600" />
              <h4 className="text-base font-extrabold text-emerald-900">
                La familia recibió la notificación y está en camino
              </h4>
              <p className="mt-1 text-xs font-medium text-emerald-800">
                El apoderado confirmó la recepción de la alerta y el escalamiento automático fue detenido.
              </p>
            </div>
          ) : !isEscalated ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-surface-border bg-surface-muted p-5 text-center">
              <Clock className="mb-2 h-8 w-8 animate-pulse text-brand-500" />
              <p className="mb-2 text-sm font-medium text-text-body">
                Si no hay respuesta del apoderado, se revelarán contactos auxiliares y opciones de emergencia en:
              </p>
              <span className="text-3xl font-black tabular-nums text-text-primary">
                {formatTime(timeLeft)}
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-surface-border pb-2">
                <ShieldAlert className="h-5 w-5 text-emergency" />
                <h4 className="font-bold text-text-primary">Contactos de Respaldo y Emergencia</h4>
              </div>

              {auxiliaryContacts.length > 0 && (
                <div className="space-y-3">
                  {auxiliaryContacts.map((contact, index) => (
                    <div
                      key={contact.label || index}
                      className="flex flex-col justify-between gap-3 rounded-lg border border-surface-border bg-surface-base p-4 sm:flex-row sm:items-center"
                    >
                      <div>
                        <p className="font-bold text-text-primary">
                          {contact.label || `Apoderado Auxiliar ${index + 1}`}
                        </p>
                        <p className="text-xs text-text-muted">Línea de respaldo</p>
                      </div>
                      {contact.telUri && (
                        <a
                          href={contact.telUri}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-surface-border bg-surface-muted px-4 py-2 font-bold text-text-primary transition-colors hover:bg-surface-border"
                        >
                          <PhoneCall className="h-4 w-4" />
                          Llamar
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
                <p className="mb-3 text-xs font-bold text-red-700">
                  Si no logras comunicarte con ningún familiar (Protocolo PNP):
                </p>
                <a
                  href={emergencyLineUri}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-4 text-base font-black text-white shadow-md transition-colors hover:bg-red-700"
                >
                  <PhoneCall className="h-5 w-5" />
                  LLAMAR A LA LÍNEA 114
                </a>
                <p className="mt-2 text-xs text-red-600">
                  Línea gratuita de atención de casos de desaparición de personas vulnerables. Reporta la ubicación actual.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Phase5EmergencyContact;
