import BuscarRostro from '../components/BuscarRostro';
import { CameraIcon } from '@heroicons/react/24/outline';
const PaginaReconocimiento = () => {
    return (
        <div className="mx-auto mb-10 max-w-2xl">
            <div className="flex flex-col items-center rounded-t-xl border border-slate-200 bg-slate-50 px-6 py-5 text-center">
                <CameraIcon className="mb-2 h-10 w-10 text-brand-700" />
                <h1 className="text-2xl font-black tracking-wide text-slate-900">
                    Identificación Facial
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                    Sistema de IA - La imagen no sale de tu dispositivo
                </p>
            </div>
            <div className="rounded-b-xl border border-t-0 border-slate-200 bg-white p-6 shadow-lg">
                <BuscarRostro />
            </div>
        </div>
    );
};
export default PaginaReconocimiento;
