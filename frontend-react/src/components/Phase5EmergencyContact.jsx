import { useState, useEffect } from 'react';
import { PhoneCall, ShieldAlert, CheckCircle, Clock } from 'lucide-react';

const Phase5EmergencyContact = ({ badgeData, onClose }) => {
    const [timeLeft, setTimeLeft] = useState(120);
    const [showAuxiliary, setShowAuxiliary] = useState(false);

    useEffect(() => {
        if (timeLeft <= 0) {
            setShowAuxiliary(true);
            return;
        }
        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Separate guardians
    const primaryGuardian = badgeData.guardians && badgeData.guardians.length > 0 ? badgeData.guardians[0] : null;
    const auxiliaryGuardians = badgeData.guardians && badgeData.guardians.length > 1 ? badgeData.guardians.slice(1) : [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-brand-900/50 p-4 backdrop-blur-md">
            <div className="relative my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-surface-border bg-surface-card shadow-2xl">
                <div className="flex items-center justify-between border-b border-surface-border bg-brand-50 px-6 py-4">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="text-brand-500 h-6 w-6" />
                        <h3 className="text-xl font-extrabold text-brand-800">¡Alerta enviada con éxito!</h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-text-muted hover:text-text-primary text-xl font-bold"
                        aria-label="Cerrar"
                    >
                        ✕
                    </button>
                </div>

                <div className="bg-surface-base p-6 space-y-6">
                    <div className="rounded-xl border border-brand-200 bg-brand-50 p-5 text-center">
                        <h4 className="text-2xl font-black text-brand-900 mb-4">Apoderado Titular</h4>
                        {primaryGuardian?.phone ? (
                            <a
                                href={`tel:${primaryGuardian.phone}`}
                                className="inline-flex w-full md:w-auto items-center justify-center gap-3 rounded-xl bg-brand-600 px-8 py-4 font-extrabold text-white shadow-lg hover:bg-brand-700 transition-all hover:-translate-y-1 active:translate-y-0"
                            >
                                <PhoneCall className="h-6 w-6" />
                                LLAMAR AHORA: {primaryGuardian.phone}
                            </a>
                        ) : (
                            <p className="text-red-500 font-bold">No hay número disponible</p>
                        )}
                    </div>

                    {!showAuxiliary ? (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-surface-border bg-surface-muted p-5 text-center">
                            <Clock className="h-8 w-8 text-brand-500 mb-2 animate-pulse" />
                            <p className="text-sm font-medium text-text-body mb-2">
                                Si no hay respuesta del apoderado, se revelarán contactos auxiliares y opciones de emergencia en:
                            </p>
                            <span className="text-3xl font-black tabular-nums text-text-primary">
                                {formatTime(timeLeft)}
                            </span>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-2 border-b border-surface-border pb-2">
                                <ShieldAlert className="text-emergency h-5 w-5" />
                                <h4 className="font-bold text-text-primary">Contactos de Respaldo y Emergencia</h4>
                            </div>

                            {auxiliaryGuardians.length > 0 && (
                                <div className="space-y-3">
                                    {auxiliaryGuardians.map((guardian, index) => (
                                        <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-surface-border bg-surface-base p-4">
                                            <div>
                                                <p className="font-bold text-text-primary">Apoderado Auxiliar {index + 1}</p>
                                                <p className="text-xs text-text-muted">Línea de respaldo</p>
                                            </div>
                                            {guardian.phone && (
                                                <a
                                                    href={`tel:${guardian.phone}`}
                                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-surface-muted px-4 py-2 font-bold text-text-primary border border-surface-border hover:bg-surface-border transition-colors"
                                                >
                                                    <PhoneCall className="h-4 w-4" />
                                                    {guardian.phone}
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="rounded-xl border border-emergency-light bg-red-50 p-5 mt-4">
                                <p className="text-sm font-bold text-emergency text-center mb-3">Si no logras comunicarte con ningún familiar (Protocolo PNP):</p>
                                <a
                                    href="tel:114"
                                    className="flex w-full items-center justify-center gap-3 rounded-xl bg-emergency px-6 py-4 font-black text-white shadow-lg hover:bg-red-700 transition-all hover:-translate-y-1 active:translate-y-0"
                                >
                                    <PhoneCall className="h-6 w-6" />
                                    LLAMAR A LA LÍNEA 114
                                </a>
                                <p className="text-xs text-center text-red-600 mt-3 font-medium">
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

