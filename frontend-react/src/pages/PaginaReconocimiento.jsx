import BuscarRostro from '../components/BuscarRostro';
import { CameraIcon } from '@heroicons/react/24/outline';
const PaginaReconocimiento = () => {
    return (
        <div className="mx-auto max-w-2xl">
            <div className="flex flex-col items-center rounded-t-card border border-surface-border bg-surface-muted px-6 py-5 text-center">
                <CameraIcon className="mb-2 h-10 w-10 text-brand-500" />
                <h1 className="text-2xl font-extrabold tracking-wide text-text-primary">
                    Identificación Facial
                </h1>
                <p className="mt-1 text-sm text-text-body">
                    Sistema de IA - La imagen no sale de tu dispositivo
                </p>
            </div>
            <div className="rounded-b-card border border-t-0 border-surface-border bg-surface-base p-6 shadow-card">
                <BuscarRostro />
            </div>
        </div>
    );
};
export default PaginaReconocimiento;
