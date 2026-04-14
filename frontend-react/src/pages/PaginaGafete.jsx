import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Phone, User, Activity, AlertCircle, ArrowLeft, ShieldCheck, MapPin, Loader2 } from 'lucide-react';
import { useGeolocationAlert } from '../hooks/useGeolocationAlert';

const PaginaGafete = () => {
    const { id } = useParams();
    const { status, gafete, error, retry } = useGeolocationAlert(id);

    // ESTADO 1: Solicitando permisos (o inicializando)
    if (status === 'IDLE' || status === 'REQUESTING_LOCATION') {
        return (
            <div className="flex flex-col justify-center items-center h-screen px-4 text-center max-w-sm mx-auto">
                <div className="mb-4 p-4 bg-brand-50 rounded-full">
                    <MapPin size={48} className="text-brand-600 animate-pulse" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Activando Alerta Segura</h2>
                <p className="text-slate-600 text-sm mb-6">
                    Para ver la información de esta persona y ayudar a su familia, necesitamos tu ubicación actual.
                </p>
                <div className="flex items-center gap-2 text-brand-700 font-semibold bg-brand-100 px-4 py-2 rounded-lg">
                    <Loader2 className="animate-spin" size={20} />
                    Esperando permisos del navegador...
                </div>
            </div>
        );
    }

    // ESTADO 2: Permiso Denegado / GPS Apagado
    if (status === 'DENIED') {
        return (
            <div className="text-center mt-10 p-6 ui-card mx-auto max-w-lg shadow-lg border-red-200 bg-red-50">
                <AlertCircle className="mx-auto mb-4 text-red-500" size={56} />
                <h2 className="text-2xl font-black text-red-700 mb-2">Ubicación Requerida</h2>
                <p className="text-slate-700 font-medium mb-6">
                    {error || 'No podemos mostrar los datos sin tu ubicación. Por favor, habilita el GPS para ayudar a localizar a esta persona.'}
                </p>
                <button
                    onClick={retry}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-bold text-white hover:bg-red-700 transition-colors shadow-md"
                >
                    <MapPin size={20} /> Reintentar Acceso
                </button>
                <div className="mt-4">
                    <Link to="/" className="text-slate-500 hover:text-slate-700 underline text-sm font-medium">Volver al inicio</Link>
                </div>
            </div>
        );
    }

    // ESTADO 3: Enviando alerta silenciosa / Recuperando Datos
    if (status === 'SENDING_ALERT' || status === 'FETCHING_DATA') {
        return (
            <div className="flex flex-col justify-center items-center h-screen px-4 text-center max-w-sm mx-auto">
                <Loader2 size={56} className="text-accent-500 animate-spin mb-4" />
                <h2 className="text-xl font-bold text-slate-800 mb-2">
                    {status === 'SENDING_ALERT' ? 'Calculando ubicación...' : 'Descargando datos seguros...'}
                </h2>
                <p className="text-slate-500 text-sm">
                    Por favor espera, estamos conectando con la familia en segundo plano.
                </p>
            </div>
        );
    }

    // ERRORES DEL BACKEND O RED (404, etc)
    if (status === 'ERROR' || !gafete) {
        return (
            <div className="text-center mt-10 p-6 ui-card mx-auto max-w-lg border-slate-200">
                <AlertCircle className="mx-auto mb-4 text-slate-400" size={48} />
                <p className="text-xl font-bold text-slate-700 mb-6">
                    {error || 'Error al recuperar el registro.'}
                </p>
                <Link to="/" className="inline-block rounded-lg bg-brand-700 px-6 py-2 font-bold text-white hover:bg-brand-600">
                    Volver al inicio
                </Link>
            </div>
        );
    }

    // ESTADO 4: EXITO - Render del Gafete (UI mantenida igual pero limpia)
    return (
        <div className="ui-card mx-auto my-6 max-w-2xl overflow-hidden lg:my-10 shadow-xl border border-slate-200">
            <div className="flex items-center justify-center gap-2 bg-brand-800 p-4 text-center text-white">
                <ShieldCheck size={28} />
                <h1 className="text-2xl font-bold uppercase tracking-wide">Identificacin segura</h1>
            </div>

            <div className="p-6 md:p-8">
                <div className="flex flex-col items-center gap-6 border-b border-slate-700 pb-6 md:flex-row">
                    {gafete.photo ? (
                        <img
                            src={`http://localhost:8080/api/v1/uploads/badge/${gafete.photo}`}
                            alt={`Foto de ${gafete.fullName}`}
                            className="h-32 w-32 rounded-full border-4 border-brand-700 object-cover shadow-md md:h-40 md:w-40"
                        />
                    ) : (
                        <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-brand-700 bg-brand-900">
                            <User size={48} className="text-brand-300" />
                        </div>
                    )}

                    <div className="text-center md:text-left flex-1">
                        <h2 className="text-3xl font-black text-slate-100 mb-2">{gafete.fullName}</h2>
                        {gafete.age && (
                            <p className="inline-block bg-brand-800 text-brand-100 px-3 py-1 rounded-full font-semibold text-sm">
                                {gafete.age} aos
                            </p>
                        )}
                    </div>
                </div>

                {(gafete.bloodType || gafete.allergies) && (
                    <div className="mt-6 rounded-xl border border-accent-500/35 bg-accent-500/10 p-4">
                        <h3 className="mb-3 flex items-center gap-2 font-bold text-accent-200">
                            <Activity size={20} /> Informacin mdica importante
                        </h3>
                        <div className="space-y-2 text-sm text-slate-200">
                            {gafete.bloodType && (
                                <p><span className="font-semibold text-slate-100">Tipo de sangre:</span> {gafete.bloodType}</p>
                            )}
                            {gafete.allergies && (
                                <p><span className="font-semibold text-slate-100">Condiciones/Alergias:</span> {gafete.allergies}</p>
                            )}
                        </div>
                    </div>
                )}

                <div className="mt-6">
                    <h3 className="text-slate-100 font-bold mb-4 flex items-center gap-2 border-b border-slate-700 pb-2">
                        <AlertCircle className="text-accent-500" size={24} /> En caso de emergencia, contactar a:
                    </h3>

                    <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-6">
                        <p className="text-slate-400 text-sm font-bold uppercase mb-1">Padre / Madre / Tutor</p>
                        <p className="text-2xl font-bold text-slate-100 mb-4">{gafete.emergencyContactName}</p>

                        <div className="space-y-3">
                            <a href={`tel:${gafete.mainEmergencyPhone}`} className="flex items-center justify-center rounded-lg bg-emergency p-3 text-xl font-bold text-white shadow hover:bg-emergency-dark">
                                <Phone className="mr-2" size={24} />
                                {gafete.mainEmergencyPhone}
                            </a>

                            {gafete.alternativeEmergencyPhone && (
                                <a href={`tel:${gafete.alternativeEmergencyPhone}`} className="flex items-center justify-center rounded-lg border border-slate-700 bg-surface-card p-2 font-semibold text-slate-200 shadow-sm hover:bg-slate-800">
                                    <Phone className="mr-2 text-slate-500" size={18} />
                                    {gafete.alternativeEmergencyPhone}
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-xs text-slate-400 mb-4">La información mostrada en esta página ha sido proporcionada por los padres o tutores del menor con fines de identificación y seguridad.</p>
                    <Link to="/" className="inline-flex items-center text-brand-300 hover:text-brand-200 text-sm font-medium">
                        <ArrowLeft className="mr-1" size={16} /> Volver a ¡ Te encontré ! Alerta
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PaginaGafete;
