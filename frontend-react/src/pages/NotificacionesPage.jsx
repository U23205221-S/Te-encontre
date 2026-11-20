import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import {
  confirmMyAlert,
  confirmPublicAlertByToken,
  fetchMyAlerts,
} from '../lib/api';
import { useAuth } from '../context/AuthContext';

const formatTime = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('es-PE', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

const computeRemaining = (expiresAt) => {
  if (!expiresAt) return 0;
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000));
};

const NotificacionesPage = () => {
  const [searchParams] = useSearchParams();
  const { sessionUser } = useAuth();
  const queryAlertUuid = searchParams.get('alert');
  const queryToken = searchParams.get('token');

  const [alerts, setAlerts] = useState([]);
  const [selectedUuid, setSelectedUuid] = useState(queryAlertUuid || null);
  const [tokenConfirmedAlert, setTokenConfirmedAlert] = useState(null);
  const [loading, setLoading] = useState(Boolean(sessionUser));
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [nowSeconds, setNowSeconds] = useState(() => Date.now());
  const isLoading = Boolean(sessionUser) && loading;

  useEffect(() => {
    const timer = setInterval(() => setNowSeconds(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!sessionUser) {
      return undefined;
    }

    let active = true;
    fetchMyAlerts()
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data) ? data : [];
        setAlerts(list);
        if (queryAlertUuid && list.some((a) => a.alertUuid === queryAlertUuid)) {
          setSelectedUuid(queryAlertUuid);
        } else if (list.length > 0) {
          setSelectedUuid((prev) => prev || list[0].alertUuid);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.response?.data?.message || 'No pudimos cargar tu bandeja de notificaciones.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [sessionUser, queryAlertUuid]);

  const selectedAlert =
    alerts.find((a) => a.alertUuid === selectedUuid) ||
    alerts[0] ||
    tokenConfirmedAlert ||
    null;

  const handleConfirm = async (alertUuid) => {
    if (confirming) return;
    try {
      setConfirming(true);
      setError('');
      const updated = sessionUser
        ? await confirmMyAlert(alertUuid, queryToken)
        : await confirmPublicAlertByToken(alertUuid, queryToken);

      setAlerts((prev) => prev.map((a) => (a.alertUuid === updated.alertUuid ? updated : a)));
      setTokenConfirmedAlert(updated);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo confirmar la recepción de la alerta.');
    } finally {
      setConfirming(false);
    }
  };

  if (!sessionUser) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 text-text-body">
        <div className="rounded-card border border-surface-border bg-white p-6 shadow-card md:p-8">
          <div className="mb-4 flex items-center gap-3">
            <Bell className="text-brand-600" size={28} />
            <h1 className="text-xl font-extrabold text-text-primary">Confirmación de Alerta SOS</h1>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {tokenConfirmedAlert ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-2 font-extrabold text-emerald-900">
                  <CheckCircle2 size={20} className="text-emerald-600" />
                  <span>La familia ya está en camino</span>
                </div>
                <p className="mt-1 text-sm text-emerald-800">
                  Confirmaste la recepción a las {formatTime(tokenConfirmedAlert.confirmedAt)}. El temporizador se detuvo y el ciudadano fue informado.
                </p>
              </div>
              {tokenConfirmedAlert.googleMapsLink && (
                <a
                  href={tokenConfirmedAlert.googleMapsLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-module border border-surface-border bg-surface-soft px-4 py-2.5 text-sm font-bold text-brand-700 hover:bg-surface-muted"
                >
                  <MapPin size={16} /> Ver ubicación en Google Maps <ExternalLink size={14} />
                </a>
              )}
            </div>
          ) : queryAlertUuid && queryToken ? (
            <div className="space-y-4">
              <p className="text-sm text-text-body">
                Pulsa el botón para confirmar la recepción de la alerta SOS, detener el escalamiento automático y avisar al ciudadano que estás en camino.
              </p>
              <button
                type="button"
                disabled={confirming}
                onClick={() => handleConfirm(queryAlertUuid)}
                className="w-full rounded-xl bg-emerald-600 px-6 py-3.5 text-base font-extrabold text-white shadow-md hover:bg-emerald-700 disabled:opacity-60"
              >
                {confirming ? 'Confirmando recepción...' : 'Confirmar recepción'}
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              <p className="text-sm text-text-muted">
                Inicia sesión como apoderado para revisar tus alertas SOS y notificaciones recientes.
              </p>
              <Link to="/login" className="ui-btn-primary inline-flex px-6 py-2.5 text-sm font-bold">
                Iniciar sesión
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-text-body">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-surface-border pb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-600">Centro de avisos</p>
          <h1 className="text-2xl font-extrabold text-text-primary md:text-3xl">Notificaciones</h1>
          <p className="mt-1 text-sm text-text-muted">
            Revisa alertas SOS y novedades importantes de tus familiares registrados.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-surface-border bg-white px-3.5 py-1.5 text-xs font-bold text-text-primary shadow-sm">
          <Bell size={14} className="text-brand-600" />
          {alerts.filter((a) => a.status === 'ACTIVE').length} activa(s)
        </span>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center rounded-card border border-surface-border bg-white p-12 shadow-card">
          <Loader2 className="mb-3 animate-spin text-brand-500" size={32} />
          <p className="text-sm text-text-muted">Cargando alertas...</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="rounded-card border border-surface-border bg-white p-10 text-center shadow-card">
          <CheckCircle2 className="mx-auto mb-3 text-emerald-500" size={36} />
          <h2 className="text-lg font-bold text-text-primary">Todo al día</h2>
          <p className="mt-1 text-sm text-text-muted">
            No tienes alertas SOS ni avisos registrados por el momento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <aside className="space-y-2.5 lg:col-span-4">
            <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-text-muted">
              Recientes ({alerts.length})
            </h2>
            {alerts.map((item) => {
              const isSelected = selectedAlert?.alertUuid === item.alertUuid;
              const statusColor =
                item.status === 'ACTIVE'
                  ? 'bg-red-100 text-red-700'
                  : item.status === 'CONFIRMED'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-800';
              return (
                <button
                  key={item.alertUuid}
                  type="button"
                  onClick={() => setSelectedUuid(item.alertUuid)}
                  className={`w-full rounded-xl border p-4 text-left transition-all ${
                    isSelected
                      ? 'border-brand-500 bg-white shadow-md ring-2 ring-brand-500/20'
                      : 'border-surface-border bg-white/80 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-extrabold text-text-primary">
                      {item.dependentFirstName || 'Familiar'}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusColor}`}>
                      {item.status === 'ACTIVE'
                        ? 'Activa'
                        : item.status === 'CONFIRMED'
                        ? 'Confirmada'
                        : 'Escalada'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-text-muted">
                    Recibida el {formatTime(item.scannedAt)}
                  </p>
                </button>
              );
            })}
          </aside>

          {selectedAlert && (
            <section className="rounded-card border border-surface-border bg-white p-6 shadow-card lg:col-span-8">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-surface-border pb-4">
                <div>
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                      selectedAlert.status === 'ACTIVE'
                        ? 'bg-red-100 text-red-700'
                        : selectedAlert.status === 'CONFIRMED'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selectedAlert.status === 'ACTIVE'
                      ? 'Alerta SOS activa'
                      : selectedAlert.status === 'CONFIRMED'
                      ? 'Recepción confirmada'
                      : 'Escalamiento automático ejecutado'}
                  </span>
                  <h2 className="mt-2 text-2xl font-extrabold text-text-primary">
                    {selectedAlert.dependentFullName || selectedAlert.dependentFirstName} fue localizado/a
                  </h2>
                  <p className="text-xs text-text-muted">
                    Recibida el {formatTime(selectedAlert.scannedAt)}
                  </p>
                </div>
                {selectedAlert.googleMapsLink && (
                  <a
                    href={selectedAlert.googleMapsLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-module border border-surface-border bg-surface-soft px-3.5 py-2 text-xs font-bold text-brand-700 hover:bg-surface-muted"
                  >
                    <MapPin size={15} /> Abrir mapa <ExternalLink size={13} />
                  </a>
                )}
              </div>

              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="rounded-xl border border-surface-border bg-surface-soft p-4">
                  <p className="mb-2 text-xs font-bold uppercase text-text-muted">Ubicación compartida</p>
                  <p className="font-mono text-xs text-text-primary">
                    Lat: {selectedAlert.latitude} · Lon: {selectedAlert.longitude}
                  </p>
                  {selectedAlert.reporterPhone && (
                    <div className="mt-4 flex items-center justify-between border-t border-surface-border pt-3">
                      <div>
                        <p className="text-xs text-text-muted">Ciudadano que reportó</p>
                        <p className="text-sm font-bold text-text-primary">
                          {selectedAlert.reporterName || 'Ciudadano solidario'} · {selectedAlert.reporterPhone}
                        </p>
                      </div>
                      <a
                        href={`tel:${selectedAlert.reporterPhone}`}
                        className="rounded-module border border-surface-border bg-white px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-surface-muted"
                      >
                        Llamar
                      </a>
                    </div>
                  )}
                </div>

                {selectedAlert.photoReport && (
                  <div className="overflow-hidden rounded-xl border border-surface-border bg-surface-soft">
                    <img
                      src={selectedAlert.photoReport}
                      alt="Evidencia del hallazgo"
                      className="h-44 w-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="mt-6">
                {selectedAlert.status === 'ACTIVE' && (
                  <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-amber-900">
                        <Clock size={20} className="shrink-0" />
                        <div>
                          <p className="text-sm font-extrabold">Escalamiento automático pendiente</p>
                          <p className="text-xs">
                            Confirma para detener el aviso a contactos auxiliares y autoridades.
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-xl font-black text-amber-900" data-now={nowSeconds}>
                        {(() => {
                          const rem = computeRemaining(selectedAlert.expiresAt);
                          const m = Math.floor(rem / 60);
                          const s = rem % 60;
                          return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                        })()}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={confirming}
                      onClick={() => handleConfirm(selectedAlert.alertUuid)}
                      className="w-full rounded-xl bg-red-600 px-6 py-3.5 text-base font-extrabold text-white shadow-md transition-colors hover:bg-red-700 disabled:opacity-60"
                    >
                      {confirming ? 'Confirmando...' : 'Confirmar recepción'}
                    </button>
                    <p className="text-center text-xs font-medium text-amber-900">
                      Al confirmar, avisaremos a la persona que reportó que ya vas en camino.
                    </p>
                  </div>
                )}

                {selectedAlert.status === 'CONFIRMED' && (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="flex items-center gap-2 font-extrabold text-emerald-900">
                        <ShieldCheck size={20} className="text-emerald-600" />
                        <span>La familia ya está en camino</span>
                      </div>
                      <p className="mt-1 text-xs text-emerald-800">
                        Confirmaste la recepción ({formatTime(selectedAlert.confirmedAt)}). El temporizador se detuvo y el ciudadano fue informado.
                      </p>
                    </div>
                    <div className="rounded-xl border border-surface-border bg-surface-soft px-4 py-3 text-xs font-semibold text-text-body">
                      Escalamiento detenido: no se enviarán avisos adicionales para esta alerta.
                    </div>
                  </div>
                )}

                {selectedAlert.status === 'ESCALATED' && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-center gap-2 font-extrabold text-amber-900">
                      <ShieldAlert size={20} className="text-amber-700" />
                      <span>Escalamiento automático ejecutado</span>
                    </div>
                    <p className="mt-1 text-xs text-amber-800">
                      Transcurrieron 120 segundos sin confirmación del titular ({formatTime(selectedAlert.escalatedAt)}). Se notificó a los contactos auxiliares registrados.
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificacionesPage;
