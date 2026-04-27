import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FormularioGafete from '../components/FormularioGafete';
import PaginaReconocimiento from './PaginaReconocimiento';
import ScannerQR from '../components/ScannerQR';
import Footer from '../components/Footer';
import ReporterStepModal from '../components/ReporterStepModal';
import Phase5EmergencyContact from '../components/Phase5EmergencyContact';
import heroImage from '../assets/figma-redesign/hero-image.png';
import shieldIcon from '../assets/figma-redesign/shield-icon.svg';
import shieldCheckIcon from '../assets/figma-redesign/shield-check-icon.svg';
import arrowRightIcon from '../assets/figma-redesign/arrow-right-icon.svg';
import personSearchIcon from '../assets/figma-redesign/person-search-icon.svg';
import qrIcon from '../assets/figma-redesign/qr-icon.svg';
import privacyIcon from '../assets/figma-redesign/privacy-icon.svg';
import verifiedIcon from '../assets/figma-redesign/verified-icon.svg';
import stepIcon from '../assets/figma-redesign/step-icon.svg';
import scanArrowIcon from '../assets/figma-redesign/scan-arrow-icon.svg';
import faceArrowIcon from '../assets/figma-redesign/face-arrow-icon.svg';

const Home = () => {
    const formRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();
    const { sessionUser } = useAuth();
    const [pendingReporterAlert, setPendingReporterAlert] = useState(null);
    const [reporterBadgeData, setReporterBadgeData] = useState(null);
    const action = new URLSearchParams(location.search).get('action');
    const showModal = action === 'registro';
    const showReconocimientoModal = action === 'reconocimiento';
    const showScannerModal = action === 'scanner';
    const showOpcionesModal = action === 'opciones';

    // Check for pending reporter step on mount
    useEffect(() => {
        const pendingUuid = window.sessionStorage.getItem('pendingAlertUuid');
        if (pendingUuid) {
            setPendingReporterAlert(pendingUuid);
        }
    }, []);

    const handleReporterSuccess = (badgeData) => {
        setReporterBadgeData(badgeData);
        setPendingReporterAlert(null);
    };

    const closeReporterModal = () => {
        window.sessionStorage.removeItem('pendingAlertUuid');
        setPendingReporterAlert(null);
    };

    useEffect(() => {
        if (showModal && !sessionUser) {
            navigate('/login');
        }
    }, [showModal, sessionUser, navigate]);

    const setActionInUrl = (nextAction) => {
        if (nextAction === 'registro' && !sessionUser) {
            navigate('/login');
            return;
        }
        navigate({ pathname: '/', search: `?action=${nextAction}`, hash: location.hash });
    };

    const clearActionFromUrl = () => {
        if (location.search.includes('action=')) {
            navigate({ pathname: '/', hash: location.hash }, { replace: true });
        }
    };

const openRegistro = () => setActionInUrl('registro');
  const closeRegistro = () => clearActionFromUrl();
  const openReconocimiento = () => setActionInUrl('reconocimiento');
  const closeReconocimiento = () => clearActionFromUrl();
  const openScanner = () => setActionInUrl('scanner');
  const closeScanner = () => clearActionFromUrl();
  const openOpciones = () => setActionInUrl('opciones');
  const closeOpciones = () => clearActionFromUrl();

  // Scroll lock para modales
  useEffect(() => {
    const anyModalOpen = showModal || showReconocimientoModal || showScannerModal || showOpcionesModal;
    document.body.style.overflow = anyModalOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [showModal, showReconocimientoModal, showScannerModal, showOpcionesModal]);

    const scrollToComoFunciona = () => {
        const section = document.getElementById('como-funciona');
        section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    useEffect(() => {
        if (location.hash === '#como-funciona') {
            const section = document.getElementById('como-funciona');
            section?.scrollIntoView({ behavior: 'auto', block: 'start' });
        }
    }, [location.hash]);

    return (
        <div className="relative flex min-h-screen flex-col bg-surface-base text-text-body">
            <section data-home-section className="ui-home-scroll-section relative overflow-hidden bg-surface-base px-6 pb-20 pt-24 md:px-8 md:pb-24 md:pt-28 lg:px-10 lg:pt-32 xl:px-12">
                <div className="relative mx-auto grid w-full max-w-[1376px] items-start gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8">
                    <div className="rounded-card border border-surface-border bg-surface-card p-8 shadow-card lg:p-12">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-pill bg-brand-50/30 px-3 py-1.5">
                            <img src={shieldIcon} alt="Escudo" className="h-3.5 w-3.5" />
                            <span className="text-[14px] font-bold leading-5 tracking-[0.05em] text-brand-500">Seguridad de Nueva Generación</span>
                        </div>

                        <h1 className="mb-6 text-[34px] font-extrabold leading-[1.12] text-text-primary md:text-[40px] md:leading-[48px]">
                            Protege a tu ser querido de la manera más segura.
                        </h1>

                        <p className="mb-10 max-w-[576px] text-base leading-6 text-text-body md:text-[18px] md:leading-[28px]">
                            Tecnología biométrica y códigos de identificación rápida diseñados para la tranquilidad de tu familia. Un sistema intuitivo que actúa en segundos cuando más lo necesitas.
                        </p>

                        <div className="mb-8 flex flex-wrap gap-4">
                            <button className="ui-btn-primary" onClick={openRegistro}>
                                Registrar a mi familiar
                                <img src={arrowRightIcon} alt="" className="ml-2 h-4 w-4" aria-hidden="true" />
                            </button>
                            <button className="ui-btn-secondary" onClick={scrollToComoFunciona}>
                                ¿Cómo funciona?
                            </button>
                        </div>

                        <div className="border-t border-surface-border-light pt-6">
                            <div className="flex flex-col items-start gap-4">
                                <div className="inline-flex items-center gap-2">
                                    <span className="relative flex h-3 w-3">
                                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emergency opacity-75"></span>
                                      <span className="relative inline-flex h-3 w-3 rounded-full bg-emergency"></span>
                                    </span>
                                    <span className="font-bold uppercase tracking-widest text-emergency text-sm">Acción Inmediata</span>
                                </div>

                                <button
                                    onClick={openOpciones}
                                    className="flex w-full items-center justify-center gap-3 rounded-xl bg-emergency px-6 py-4 font-extrabold text-white shadow-lg shadow-emergency/30 transition-transform hover:-translate-y-1 hover:shadow-xl hover:shadow-emergency/40 active:translate-y-0"
                                >
                                    <img src={personSearchIcon} alt="" className="h-6 w-6 invert" aria-hidden="true" />
                                    <span className="text-lg">¡ENCONTRÉ A ALGUIEN!</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="relative h-[621px] w-full overflow-hidden rounded-card border border-surface-border shadow-card">
                        <img
                            src={heroImage}
                            alt="Madre abrazando a su hija"
                            className="absolute inset-0 h-full w-full object-cover"
                        />

                        <div className="absolute bottom-6 left-6 rounded-module border border-white/20 bg-white/80 p-4 shadow-module backdrop-blur-[24px]">
                            <div className="flex items-center gap-3">
                                <img src={shieldCheckIcon} alt="" className="h-9 w-8" aria-hidden="true" />
                                <div>
                                    <p className="text-sm font-bold tracking-[0.05em] text-text-primary">Protección 24/7</p>
                                    <p className="text-xs font-medium text-text-body">Cifrado de extremo a extremo.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section data-home-section className="ui-home-scroll-section bg-surface-base px-6 py-12 md:px-8 md:py-16 lg:px-10 xl:px-12">
                <div className="mx-auto w-full max-w-[1376px]">
                    <div className="mx-auto mb-10 max-w-[672px] space-y-4 text-center">
                        <h2 className="text-[32px] font-bold leading-10 text-text-primary">¿Encontraste a alguien perdido?</h2>
                        <p className="text-[16px] leading-6 text-text-body">
                            Nuestro sistema te permite actuar rápidamente protegiendo la identidad de manera segura.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        <article className="rounded-card border border-surface-border bg-surface-card p-8 shadow-card">
                            <img src={qrIcon} alt="Código QR" className="mb-6 h-20 w-14" />
                            <h3 className="mb-3 text-[24px] font-semibold leading-8 text-text-primary">Escanear Código QR</h3>
                            <p className="mb-8 text-[16px] leading-6 text-text-body">
                                Escanea la pulsera, mochila o credencial de la persona extraviada para acceder a un canal de comunicación seguro y anónimo con sus tutores.
                            </p>
                            <button onClick={openScanner} className="ui-btn-teal w-full">
                                Escanear ahora
                                <img src={scanArrowIcon} alt="" aria-hidden="true" className="h-4 w-4" />
                            </button>
                        </article>

                        <article className="rounded-card border border-surface-border bg-surface-card p-8 shadow-card">
                            <img src={stepIcon} alt="Reconocimiento" className="mb-6 h-20 w-14" />
                            <h3 className="mb-3 text-[24px] font-semibold leading-8 text-text-primary">Reconocimiento Facial</h3>
                            <p className="mb-8 text-[16px] leading-6 text-text-body">
                                Utiliza nuestra IA avanzada para identificar a la persona extraviada mediante una fotografía, cruzando datos de manera instantánea y privada.
                            </p>
                            <button onClick={openReconocimiento} className="inline-flex w-full items-center justify-between rounded-module bg-accent-500 px-4 py-3 text-sm font-bold text-accent-800 hover:bg-accent-600">
                                Usar reconocimiento facial
                                <img src={faceArrowIcon} alt="" aria-hidden="true" className="h-4 w-4" />
                            </button>
                        </article>

                        <article className="rounded-card border border-surface-border bg-surface-card p-8 shadow-card md:col-span-2 xl:col-span-1">
                            <img src={privacyIcon} alt="Privacidad" className="mb-6 h-20 w-14" />
                            <h3 className="mb-3 text-[24px] font-semibold leading-8 text-text-primary">Seguridad y Privacidad</h3>
                            <p className="mb-8 text-[16px] leading-6 text-text-body">
                                Tu información biométrica está protegida with cifrado. Operamos bajo un enfoque estricto de Privacy-First.
                            </p>

                            <div className="flex items-center gap-2 border-t border-surface-border-light pt-4">
                                <img src={verifiedIcon} alt="" aria-hidden="true" className="h-4 w-4" />
                                <span className="text-sm font-bold tracking-[0.05em] text-teal-400">Sistema verificado</span>
                            </div>
                        </article>
                    </div>
                </div>
            </section>

            <section id="como-funciona" data-home-section className="ui-home-scroll-section bg-surface-base px-6 pb-8 pt-6 md:px-8 md:pt-8 lg:px-10 xl:px-12">
                <div className="mx-auto w-full max-w-[1440px] rounded-card border border-surface-border-medium bg-[#EDEEEF] px-8 py-14 md:px-10 md:py-16">
                    <div className="mb-10 text-center">
                        <h2 className="text-[32px] font-semibold leading-8 text-text-primary">Tu tranquilidad en 3 simples pasos</h2>
                    </div>

                    <div className="relative grid gap-8 md:grid-cols-3">
                        <div className="pointer-events-none absolute left-[16.5%] right-[16.5%] top-6 hidden h-[2px] bg-[linear-gradient(90deg,rgba(195,198,213,0)_0%,rgba(195,198,213,1)_50%,rgba(195,198,213,0)_100%)] md:block" />
                        {[{
                            step: '1',
                            title: 'Registra el perfil',
                            text: 'Crea una cuenta segura y añade los datos e imágenes de tu hijo/a. o familiar mayor.',
                        }, {
                            step: '2',
                            title: 'Obtén tu identificador',
                            text: 'Recibe códigos QR únicos y activa la protección biométrica.',
                        }, {
                            step: '3',
                            title: 'Monitorea y conecta',
                            text: 'Si alguien escanea el código, recibirás una alerta inmediata y segura.',
                        }].map((item) => (
                            <article key={item.step} className="relative z-10 text-center">
                                <div className="mb-4 flex justify-center">
                                    <div className="relative flex h-12 w-12 items-center justify-center rounded-pill bg-white shadow-step">
                                        <span className="text-2xl font-semibold leading-8 text-text-heading">{item.step}</span>
                                    </div>
                                </div>

                                <h3 className="mb-2 text-[14px] font-bold leading-5 tracking-[0.05em] text-text-heading">{item.title}</h3>
                                <p className="mx-auto max-w-[360px] text-[14px] leading-5 text-text-body">{item.text}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <Footer className="mt-auto" />

            {showOpcionesModal && (
                <div data-home-ignore-snap className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/40 p-4 backdrop-blur-md">
                    <div className="relative w-full max-w-2xl overflow-hidden rounded-card border border-surface-border bg-surface-card shadow-2xl">
                        <div className="flex items-center justify-between border-b border-surface-border bg-surface-muted px-6 py-4">
                            <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-emergency"></span>
                                <h3 className="text-xl font-bold text-text-primary">¿Cómo deseas buscar a esta persona?</h3>
                            </div>
                            <button
                                type="button"
                                onClick={closeOpciones}
                                className="ui-modal-close"
                                aria-label="Cerrar modal"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="bg-surface-base p-6 md:p-8">
                            <p className="mb-6 text-center text-text-body text-lg">
                                Selecciona el método más rápido que tengas a disposición:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={() => {
                                        closeOpciones();
                                        openScanner();
                                    }}
                                    className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-brand-200 bg-white p-8 text-brand-700 shadow-sm transition-all hover:border-brand-500 hover:bg-brand-50 hover:shadow-md"
                                >
                                    <div className="rounded-full bg-brand-100 p-4 transition-transform group-hover:scale-110">
                                        <img src={qrIcon} alt="" className="h-10 w-10" />
                                    </div>
                                    <div className="text-center">
                                        <h4 className="font-bold text-xl mb-1">Escanear QR</h4>
                                        <p className="text-sm text-text-body">Tengo la pulsera o gafete con código QR a la mano.</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => {
                                        closeOpciones();
                                        openReconocimiento();
                                    }}
                                    className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-accent-200 bg-white p-8 text-accent-800 shadow-sm transition-all hover:border-accent-500 hover:bg-accent-50 hover:shadow-md"
                                >
                                    <div className="rounded-full bg-accent-100 p-4 transition-transform group-hover:scale-110">
                                        <img src={faceArrowIcon} alt="" className="h-10 w-10" />
                                    </div>
                                    <div className="text-center">
                                        <h4 className="font-bold text-xl mb-1">Reconocimiento Facial</h4>
                                        <p className="text-sm text-text-body">Usar la cámara para buscar mediante fotografías.</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showModal && (
                <div data-home-ignore-snap className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-brand-900/35 p-4 backdrop-blur-sm">
                    <div className="relative my-auto w-full max-w-4xl overflow-hidden rounded-card border border-surface-border bg-surface-card shadow-card">
                        <div className="flex items-center justify-between border-b border-surface-border bg-surface-muted px-6 py-4">
                            <h3 className="text-xl font-bold text-text-primary">Registrar a mi hijo/a</h3>
                            <button
                                type="button"
                                onClick={closeRegistro}
                                className="ui-modal-close"
                                aria-label="Cerrar modal de registro"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="max-h-[80vh] w-full overflow-y-auto bg-surface-base p-3 md:p-4">
                            <FormularioGafete formRef={formRef} />
                        </div>
                    </div>
                </div>
            )}

            {showScannerModal && (
                <div data-home-ignore-snap className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/35 p-4 backdrop-blur-sm">
                    <div className="relative w-full max-w-xl overflow-y-auto max-h-[90vh] rounded-card border border-surface-border bg-surface-card shadow-card">
                        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-surface-border bg-surface-muted px-6 py-4">
                            <h3 className="text-xl font-bold text-text-primary">Escanear gafete</h3>
                            <button
                                type="button"
                                onClick={closeScanner}
                                className="ui-modal-close"
                                aria-label="Cerrar modal de escaneo"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="bg-surface-base p-6">
                            <ScannerQR />
                        </div>
                    </div>
                </div>
            )}

            {showReconocimientoModal && (
                <div data-home-ignore-snap className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/35 p-4 backdrop-blur-sm">
                    <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-card border border-surface-border bg-surface-card shadow-card">
                        <div className="flex items-center justify-between border-b border-surface-border bg-surface-muted px-6 py-4">
                            <h3 className="text-xl font-bold text-text-primary">Buscar por reconocimiento facial</h3>
                            <button
                                type="button"
                                onClick={closeReconocimiento}
                                className="ui-modal-close"
                                aria-label="Cerrar modal de reconocimiento facial"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="bg-surface-base p-3 md:p-4">
                            <PaginaReconocimiento />
                        </div>
                    </div>
                </div>
            )}

            {/* Reporter Step Modal - 2nd step after scan */}
            {pendingReporterAlert && (
                <ReporterStepModal
                    alertUuid={pendingReporterAlert}
                    onClose={closeReporterModal}
                    onSuccess={handleReporterSuccess}
                />
            )}

            {/* Badge Data Display after reporter step */}
            {reporterBadgeData && (
                <Phase5EmergencyContact
                    badgeData={reporterBadgeData}
                    onClose={() => setReporterBadgeData(null)}
                />
            )}
        </div>
    );
};

export default Home;
