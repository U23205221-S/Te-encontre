import { useState } from 'react';
import { api } from '../lib/api';
import { Loader2 } from 'lucide-react';

const ReporterStepModal = ({ alertUuid, onClose, onSuccess }) => {
  const [form, setForm] = useState({ dniReporter: '', phoneReporter: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submitData = async (isOmitted) => {
    setError('');
    setLoading(true);

    try {
      let payload = {};

      if (!isOmitted) {
        if (!form.dniReporter && !form.phoneReporter) {
          setError('Completa al menos un dato de contacto (DNI o teléfono).');
          setLoading(false);
          return;
        }
        payload = {
          ...(form.dniReporter && { dniReporter: form.dniReporter }),
          ...(form.phoneReporter && { phoneReporter: form.phoneReporter }),
        };
      }

      const res = await api.post(`/api/v1/badge/scan/${alertUuid}`, payload);

      // Limpiar el alertUuid pendiente
      window.sessionStorage.removeItem('pendingAlertUuid');

      // Pasar la información del gafete (BadgeResponseDTO) para la Fase 5
      onSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitData(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/40 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-surface-border bg-surface-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-surface-border bg-brand-50 px-6 py-4">
          <div className="flex items-center gap-2">
             <span className="relative flex h-3 w-3">
                 <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-75"></span>
                 <span className="relative inline-flex h-3 w-3 rounded-full bg-brand-500"></span>
             </span>
             <h3 className="text-xl font-extrabold text-brand-800">¡Tu ayuda salva vidas!</h3>
          </div>
        </div>

        <div className="bg-surface-base p-6">
          <p className="mb-6 text-sm text-text-body font-medium leading-relaxed bg-surface-muted p-4 rounded-xl shadow-inner border border-surface-border">
            Para proteger tu seguridad y establecer una conexión directa con los familiares, te invitamos a compartir un dato de contacto. Esto activará una doble alerta y facilitará el reencuentro.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="dniReporter" className="mb-1 block text-sm font-bold text-text-primary">
                Tu DNI (Para validar tu identidad)
              </label>
              <input
                id="dniReporter"
                type="text"
                inputMode="numeric"
                className="w-full rounded-xl border-2 border-surface-border bg-surface-base py-3 px-4 text-text-body placeholder:text-text-muted focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/20 transition-all font-medium"
                value={form.dniReporter}
                onChange={(e) => setForm({ ...form, dniReporter: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                placeholder="Ej. 12345678"
                maxLength={8}
              />
            </div>

            <div>
              <label htmlFor="phoneReporter" className="mb-1 block text-sm font-bold text-text-primary">
                Número de Celular
              </label>
              <input
                id="phoneReporter"
                type="tel"
                inputMode="tel"
                className="w-full rounded-xl border-2 border-surface-border bg-surface-base py-3 px-4 text-text-body placeholder:text-text-muted focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/20 transition-all font-medium"
                value={form.phoneReporter}
                onChange={(e) => setForm({ ...form, phoneReporter: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                placeholder="Ej. 987654321"
                maxLength={9}
              />
            </div>

            {error && (
              <p className="rounded-lg border border-emergency-light bg-red-50 px-3 py-2 text-sm font-bold text-emergency" role="alert">
                {error}
              </p>
            )}

            <div className="pt-2 flex flex-col gap-3">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3.5 font-bold text-white shadow-md hover:bg-brand-600 hover:shadow-lg transition-all"
                disabled={loading}
              >
                {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                {loading ? 'Procesando...' : 'Confirmar mis datos'}
              </button>

              <button
                type="button"
                onClick={() => submitData(true)}
                disabled={loading}
                className="w-full rounded-xl py-3 font-bold text-text-body hover:bg-surface-muted transition-colors border-2 border-transparent hover:border-surface-border"
              >
                Prefiero omitir y ver sus teléfonos
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReporterStepModal;