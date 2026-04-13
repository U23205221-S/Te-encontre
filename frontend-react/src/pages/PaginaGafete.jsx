import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Phone, User, Activity, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';

const PaginaGafete = () => {
    const { id } = useParams();
    const [gafete, setGafete] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchGafete = async () => {
            try {
                const res = await axios.get(`http://localhost:8080/api/v1/badge/uuid/${id}`);
                setGafete(res.data);
            } catch {
                setError('No se pudo encontrar la informacin del gafete.');
            } finally {
                setLoading(false);
            }
        };
        fetchGafete();
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <p className="text-slate-300 font-medium">Cargando información segura...</p>
            </div>
        );
    }

    if (error || !gafete) {
        return (
            <div className="text-center mt-10">
                <p className="text-accent-500 font-bold text-xl">{error}</p>
                <Link to="/" className="mt-4 inline-block text-brand-300 hover:text-brand-200 hover:underline">Volver al inicio</Link>
            </div>
        );
    }

    return (
        <div className="ui-card mx-auto my-6 max-w-2xl overflow-hidden lg:my-10">
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
