import { useState } from 'react';
import { api } from '../lib/api';
import { Loader2 } from 'lucide-react';

const ReporterStepModal = ({ alertUuid, onClose, onSuccess }) => {
  const [form, setForm] = useState({ dniReporter: '', phoneReporter: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.dniReporter && !form.phoneReporter) {
      setError('Completa al menos un dato de contacto (DNI o teléfono).');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...(form.dniReporter && { dniReporter: form.dniReporter }),
        ...(form.phoneReporter && { phoneReporter: form.phoneReporter }),
      };

      const res = await api.post(`/api/v1/badge/scan/${alertUuid}`, payload);

      // Clear pending alert
      window.sessionStorage.removeItem('pendingAlertUuid');

      onSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al completar los datos del reportante.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/35 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-card border border-surface-border bg-surface-card shadow-card">
        <div className="flex items-center justify-between border-b border-surface-border bg-surface-muted px-6 py-4">
          <h3 className="text-xl font-bold text-text-primary">Datos del reportante</h3>
          <button
            type="button"
            onClick={onClose}
            className="ui-modal-close"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-surface-base p-6">
          <p className="text-sm text-text-body">
            Para completar la alerta, proporciona al menos un dato de contacto.
          </p>

          <div>
            <label htmlFor="dniReporter" className="mb-1 block text-sm font-semibold text-text-heading">
              DNI del reportante (opcional)
            </label>
            <input
              id="dniReporter"
              type="text"
              inputMode="numeric"
              className="ui-input"
              value={form.dniReporter}
              onChange={(e) => setForm({ ...form, dniReporter: e.target.value.replace(/\D/g, '').slice(0, 8) })}
              placeholder="8 dígitos"
              maxLength={8}
            />
          </div>

          <div>
            <label htmlFor="phoneReporter" className="mb-1 block text-sm font-semibold text-text-heading">
              Teléfono del reportante (opcional)
            </label>
            <input
              id="phoneReporter"
              type="tel"
              inputMode="tel"
              className="ui-input"
              value={form.phoneReporter}
              onChange={(e) => setForm({ ...form, phoneReporter: e.target.value.replace(/\D/g, '').slice(0, 9) })}
              placeholder="9 dígitos"
              maxLength={9}
            />
          </div>

          {error && (
            <p className="rounded-module border border-emergency-light bg-red-50 px-3 py-2 text-sm text-emergency" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="ui-btn-primary w-full flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Enviando...' : 'Completar alerta'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReporterStepModal;