import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  QrCode,
  RefreshCw,
  ShieldOff,
  ShieldCheck,
  AlertTriangle,
  Ban,
  Loader2,
  X,
} from 'lucide-react';
import {
  fetchMyFamilies,
  regenerateBadgeQr,
  deactivateBadgeQr,
  revokeBadgeConsent,
  grantBadgeConsent,
} from '../lib/api';
import QRGenerado from '../components/QRGenerado';
import PrivacyConsentModal from '../components/PrivacyConsentModal';

const formatDate = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
};

const shortToken = (token) => (token ? String(token).slice(0, 13) : 'sin-qr');

const MisFamiliaresPage = () => {
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [confirmAction, setConfirmAction] = useState(null); // { type: 'regenerate' | 'deactivate' | 'revoke', member }
  const [consentTarget, setConsentTarget] = useState(null);
  const [qrPreviewMember, setQrPreviewMember] = useState(null);

  useEffect(() => {
    let active = true;
    fetchMyFamilies()
      .then((data) => {
        if (active) {
          setFamilies(Array.isArray(data) ? data : []);
          setError('');
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.response?.data?.message || 'No pudimos cargar tus familiares registrados.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const replaceMember = (updated) => {
    setFamilies((prev) => prev.map((item) => (item.badgeUuid === updated.badgeUuid ? updated : item)));
  };

  const handleConfirmedAction = async () => {
    if (!confirmAction || submitting) return;
    const { type, member } = confirmAction;
    try {
      setSubmitting(true);
      setError('');
      let updated;
      if (type === 'regenerate') {
        updated = await regenerateBadgeQr(member.badgeUuid);
      } else if (type === 'deactivate') {
        updated = await deactivateBadgeQr(member.badgeUuid);
      } else if (type === 'revoke') {
        updated = await revokeBadgeConsent(member.badgeUuid);
      }
      if (updated) {
        replaceMember(updated);
      }
      setConfirmAction(null);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo completar la acción solicitada.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGrantConsent = async () => {
    if (!consentTarget || submitting) return;
    try {
      setSubmitting(true);
      setError('');
      const updated = await grantBadgeConsent(consentTarget.badgeUuid, '1.0');
      replaceMember(updated);
      setConsentTarget(null);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo registrar el nuevo consentimiento.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-text-body">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-surface-border pb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-600">Gestión de perfiles y privacidad</p>
          <h1 className="text-2xl font-extrabold text-text-primary md:text-3xl">Mis familiares</h1>
          <p className="mt-1 text-sm text-text-muted">
            Administra los códigos QR activos y el consentimiento informado de tus familiares registrados.
          </p>
        </div>
        <Link to="/?action=registro" className="ui-btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold">
          <Users size={16} /> Registrar familiar
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-card border border-surface-border bg-white p-12 shadow-card">
          <Loader2 className="mb-3 animate-spin text-brand-500" size={32} />
          <p className="text-sm text-text-muted">Cargando perfiles asociados a tu cuenta...</p>
        </div>
      ) : families.length === 0 ? (
        <div className="rounded-card border border-surface-border bg-white p-10 text-center shadow-card">
          <Users className="mx-auto mb-3 text-text-muted" size={36} />
          <h2 className="text-lg font-bold text-text-primary">Aún no tienes familiares registrados</h2>
          <p className="mt-1 text-sm text-text-muted">
            Registra un perfil con consentimiento informado para generar su credencial QR y protección facial.
          </p>
          <Link to="/?action=registro" className="ui-btn-primary mt-5 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold">
            Registrar a mi familiar
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {families.map((member) => {
            const hasActiveQr = Boolean(member.activeQrToken) && member.qrStatus === 'ACTIVE';
            const displayToken = member.activeQrToken || member.latestQrToken;

            return (
              <article
                key={member.badgeUuid}
                className="flex flex-col justify-between rounded-card border border-surface-border bg-white p-6 shadow-card"
              >
                <div>
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-surface-border bg-brand-50 font-bold text-brand-700">
                      {member.photoUrl ? (
                        <img src={member.photoUrl} alt={member.firstName} className="h-full w-full object-cover" />
                      ) : (
                        member.firstName?.charAt(0) || 'F'
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-lg font-extrabold text-text-primary">{member.fullName}</h2>
                      <p className="text-xs font-medium text-text-muted">DNI {member.maskedDni}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                        member.consentActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {member.consentActive ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
                      {member.consentActive ? 'Consentimiento vigente' : 'Consentimiento revocado'}
                    </span>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-y-2 rounded-xl border border-surface-border bg-surface-soft p-3.5 text-xs">
                    <div>
                      <dt className="text-text-muted">Nacimiento</dt>
                      <dd className="font-semibold text-text-primary">{formatDate(member.dateOfBirth)}</dd>
                    </div>
                    <div>
                      <dt className="text-text-muted">Género</dt>
                      <dd className="font-semibold text-text-primary">{member.gender}</dd>
                    </div>
                    <div>
                      <dt className="text-text-muted">Contactos</dt>
                      <dd className="font-semibold text-text-primary">{member.guardiansCount}</dd>
                    </div>
                    <div>
                      <dt className="text-text-muted">Versión / Aceptación</dt>
                      <dd className="font-semibold text-text-primary">
                        v{member.consentVersion || '1.0'} · {formatDate(member.consentAcceptedAt)}
                      </dd>
                    </div>
                  </dl>

                  <div
                    className={`mt-4 flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-semibold ${
                      hasActiveQr
                        ? 'border-brand-200 bg-brand-50/70 text-brand-800'
                        : 'border-slate-200 bg-slate-100 text-slate-600'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <QrCode size={14} />
                      {hasActiveQr ? 'QR activo' : 'QR desactivado'} · {shortToken(displayToken)}
                    </span>
                    {hasActiveQr && (
                      <button
                        type="button"
                        onClick={() => setQrPreviewMember(member)}
                        className="font-bold text-brand-700 underline hover:text-brand-900"
                      >
                        Ver / Descargar
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2 border-t border-surface-border pt-4">
                  {member.consentActive ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setConfirmAction({ type: 'regenerate', member })}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-module bg-brand-600 px-3 py-2 text-xs font-bold text-white hover:bg-brand-700"
                      >
                        <RefreshCw size={14} /> Regenerar QR
                      </button>
                      {hasActiveQr && (
                        <button
                          type="button"
                          onClick={() => setConfirmAction({ type: 'deactivate', member })}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-module border border-surface-border bg-white px-3 py-2 text-xs font-bold text-text-primary hover:bg-surface-muted"
                        >
                          <Ban size={14} /> Desactivar QR
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setConfirmAction({ type: 'revoke', member })}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-module border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
                      >
                        <ShieldOff size={14} /> Revocar consentimiento
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConsentTarget(member)}
                      className="ui-btn-primary inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold"
                    >
                      <ShieldCheck size={15} /> Otorgar nuevo consentimiento
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {confirmAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
          onClick={() => !submitting && setConfirmAction(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-card border border-surface-border bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center gap-3">
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${
                  confirmAction.type === 'revoke'
                    ? 'bg-red-50 text-red-600'
                    : 'bg-amber-50 text-amber-600'
                }`}
              >
                <AlertTriangle size={20} />
              </span>
              <div>
                <h3 className="text-lg font-extrabold text-text-primary">
                  {confirmAction.type === 'regenerate' && '¿Regenerar este código QR?'}
                  {confirmAction.type === 'deactivate' && '¿Desactivar este código QR?'}
                  {confirmAction.type === 'revoke' && '¿Revocar el consentimiento?'}
                </h3>
                <p className="text-xs font-semibold text-text-muted">Familiar: {confirmAction.member.fullName}</p>
              </div>
            </div>

            {confirmAction.type === 'regenerate' && (
              <div className="space-y-3 text-sm text-text-body">
                <p>
                  Se creará un QR nuevo y el código anterior quedará invalidado. Recomendamos hacerlo solo si el QR actual se perdió, se dañó o pudo quedar expuesto.
                </p>
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                  Asegúrate de reemplazar cualquier copia impresa del QR anterior.
                </p>
              </div>
            )}

            {confirmAction.type === 'deactivate' && (
              <div className="space-y-3 text-sm text-text-body">
                <p>
                  El QR actual dejará de funcionar inmediatamente y no podrá volver a activarse. Para habilitar nuevamente la identificación por QR tendrás que generar un código nuevo.
                </p>
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                  Esta acción no se puede deshacer. Solo podrás recuperar el acceso regenerando el QR.
                </p>
              </div>
            )}

            {confirmAction.type === 'revoke' && (
              <div className="space-y-3 text-sm text-text-body">
                <p>
                  Se desactivarán inmediatamente el código QR y el reconocimiento facial de este perfil. Ya no podrá utilizarse para identificar al familiar.
                </p>
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">
                  Para volver a habilitar el perfil será necesario otorgar un nuevo consentimiento informado.
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setConfirmAction(null)}
                className="rounded-module border border-surface-border bg-white px-4 py-2 text-sm font-semibold text-text-body hover:bg-surface-muted"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmedAction}
                className={`rounded-module px-4 py-2 text-sm font-bold text-white disabled:opacity-60 ${
                  confirmAction.type === 'revoke'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-brand-600 hover:bg-brand-700'
                }`}
              >
                {submitting
                  ? 'Procesando...'
                  : confirmAction.type === 'regenerate'
                  ? 'Sí, regenerar QR'
                  : confirmAction.type === 'deactivate'
                  ? 'Sí, desactivar QR'
                  : 'Sí, revocar consentimiento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {qrPreviewMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
          onClick={() => setQrPreviewMember(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-card border border-surface-border bg-white p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-text-primary">{qrPreviewMember.fullName}</h3>
              <button
                type="button"
                onClick={() => setQrPreviewMember(null)}
                aria-label="Cerrar vista previa QR"
                className="rounded-full p-1 text-text-muted hover:bg-surface-muted"
              >
                <X size={18} />
              </button>
            </div>
            <QRGenerado
              url={`${window.location.origin}/gafete/${qrPreviewMember.activeQrToken}`}
              id={`qr-preview-${qrPreviewMember.activeQrToken}`}
            />
            <p className="mt-3 break-all rounded-lg bg-surface-muted px-3 py-2 font-mono text-[11px] text-text-muted">
              {`${window.location.origin}/gafete/${qrPreviewMember.activeQrToken}`}
            </p>
          </div>
        </div>
      )}

      <PrivacyConsentModal
        isOpen={Boolean(consentTarget)}
        onClose={() => setConsentTarget(null)}
        onAccept={handleGrantConsent}
      />
    </div>
  );
};

export default MisFamiliaresPage;
