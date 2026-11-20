import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import { checkPublicQr } from '../lib/api';
import ScannerQR from '../components/ScannerQR';
import ReporterStepModal from '../components/ReporterStepModal';
import Phase5EmergencyContact from '../components/Phase5EmergencyContact';

const PaginaGafete = () => {
  const { id } = useParams();
  const [qrCheck, setQrCheck] = useState({ loading: true, valid: false, firstName: null, message: '' });
  const [pendingAlertUuid, setPendingAlertUuid] = useState(null);
  const [assistanceData, setAssistanceData] = useState(null);

  useEffect(() => {
    if (!id) return undefined;
    let active = true;

    checkPublicQr(id)
      .then((data) => {
        if (active) {
          setQrCheck({
            loading: false,
            valid: Boolean(data?.valid),
            firstName: data?.firstName || null,
            message: data?.message || '',
          });
        }
      })
      .catch((err) => {
        if (active) {
          setQrCheck({
            loading: false,
            valid: false,
            firstName: null,
            message:
              err.response?.data?.message ||
              'Este código QR fue desactivado, revocado o no es válido.',
          });
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (qrCheck.loading) {
    return (
      <div className="mx-auto flex h-[60vh] max-w-sm flex-col items-center justify-center px-4 text-center">
        <Loader2 size={44} className="mb-3 animate-spin text-brand-500" />
        <p className="text-sm font-semibold text-text-body">Verificando credencial QR...</p>
      </div>
    );
  }

  if (!qrCheck.valid) {
    return (
      <div className="mx-auto my-12 max-w-lg rounded-card border border-red-200 bg-white p-8 text-center shadow-card">
        <AlertCircle className="mx-auto mb-4 text-red-500" size={52} />
        <h1 className="mb-2 text-2xl font-extrabold text-text-primary">Código QR inválido o desactivado</h1>
        <p className="mb-6 text-sm text-text-body">
          {qrCheck.message || 'Este código QR fue desactivado o revocado y ya no permite identificar al familiar.'}
        </p>
        <Link to="/" className="ui-btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold">
          <ArrowLeft size={16} /> Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto my-8 max-w-2xl px-4">
      <div className="overflow-hidden rounded-card border border-surface-border bg-white shadow-card">
        <div className="flex items-center justify-center gap-2 bg-brand-700 px-6 py-4 text-white">
          <ShieldCheck size={24} />
          <div className="text-center">
            <h1 className="text-lg font-extrabold uppercase tracking-wide">Identificación segura</h1>
            {qrCheck.firstName && (
              <p className="text-xs font-semibold text-brand-100">
                Familiar: {qrCheck.firstName}
              </p>
            )}
          </div>
        </div>

        <div className="p-6">
          <ScannerQR
            initialQrToken={id}
            onScanSuccess={(alertUuid) => {
              setPendingAlertUuid(alertUuid);
            }}
          />
        </div>
      </div>

      {pendingAlertUuid && (
        <ReporterStepModal
          alertUuid={pendingAlertUuid}
          onClose={() => setPendingAlertUuid(null)}
          onSuccess={(data) => {
            setPendingAlertUuid(null);
            setAssistanceData(data);
          }}
        />
      )}

      {assistanceData && (
        <Phase5EmergencyContact
          badgeData={assistanceData}
          onClose={() => setAssistanceData(null)}
        />
      )}
    </div>
  );
};

export default PaginaGafete;
