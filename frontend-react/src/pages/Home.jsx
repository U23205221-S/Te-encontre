import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FormularioGafete from '../components/FormularioGafete';
import PaginaReconocimiento from './PaginaReconocimiento';
import ScannerQR from '../components/ScannerQR';
import Footer from '../components/Footer';
import { useHomeSectionSnap } from '../hooks/useHomeSectionSnap';
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

const resolveHeaderOffset = () => {
    if (typeof window === 'undefined') {
        return 0;
    }

    const rootStyles = window.getComputedStyle(document.documentElement);
    const headerHeightCss = rootStyles.getPropertyValue('--header-height').trim();
    const headerHeight = Number.parseFloat(headerHeightCss);

    return Number.isFinite(headerHeight) ? headerHeight : 0;
};

const Home = () => {
    const formRef = useRef(null);
    const containerRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();
    const { sessionUser } = useAuth();
    const action = new URLSearchParams(location.search).get('action');
    const showModal = action === 'registro';
    const showReconocimientoModal = action === 'reconocimiento';
    const showScannerModal = action === 'scanner';

    useEffect(() => {
        if ((showModal || showReconocimientoModal || showScannerModal) && !sessionUser) {
            navigate('/login');
        }
    }, [action, showModal, showReconocimientoModal, showScannerModal, sessionUser, navigate]);

    const setActionInUrl = (nextAction) => {
        if (!sessionUser) {
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

  // Scroll lock para modales
  useEffect(() => {
    const anyModalOpen = showModal || showReconocimientoModal || showScannerModal;
    document.body.style.overflow = anyModalOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [showModal, showReconocimientoModal, showScannerModal]);

    const { scrollToSection } = useHomeSectionSnap({
        containerRef,
        sectionSelector: '[data-home-section]',
        topOffset: resolveHeaderOffset,
        desktopMinWidth: 1024,
        duration: 0.52,
        ease: 'power2.out',
        tolerance: 16,
    });

    const scrollToComoFunciona = useCallback(() => {
        scrollToSection('#como-funciona');
    }, [scrollToSection]);

    useEffect(() => {
        if (location.hash === '#como-funciona') {
            requestAnimationFrame(scrollToComoFunciona);
        }
    }, [location.hash, scrollToComoFunciona]);

    return (
        <div ref={containerRef} className="relative bg-surface-base text-text-body">
            <section data-home-section className="ui-home-scroll-section ui-viewport-section ui-hero-section relative flex items-center overflow-hidden bg-surface-base">
                <div className="relative mx-auto grid w-full max-w-[90rem] items-start gap-6 px-6 md:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8 lg:px-10 xl:px-12">
                    <div className="rounded-card border border-surface-border bg-surface-card p-8 shadow-card lg:p-12">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-pill bg-brand-50/30 px-3 py-1.5">
                            <img src={shieldIcon} alt="Escudo" className="h-3.5 w-3.5" />
                            <span className="text-sm font-bold tracking-[0.05em] text-brand-500">Seguridad de Nueva Generación</span>
                        </div>

                        <h1 className="mb-6 text-4xl font-extrabold leading-[1.05] text-text-primary md:text-5xl lg:text-[56px] lg:leading-[1.05]">
                            Protege a tu hijo/a de la manera más segura.
                        </h1>

                        <p className="mb-10 max-w-[576px] text-base leading-7 text-text-body md:text-lg md:leading-8">
                            Tecnología biométrica y códigos de identificación rápida diseñados para la tranquilidad de tu familia. Un sistema intuitivo que actúa en segundos cuando más lo necesitas.
                        </p>

                        <div className="mb-8 flex flex-wrap gap-4">
                            <button className="ui-btn-primary" onClick={openRegistro}>
                                Registrar a mi hijo/a
                                <img src={arrowRightIcon} alt="" className="ml-2 h-4 w-4" aria-hidden="true" />
                            </button>
                            <button className="ui-btn-secondary" onClick={scrollToComoFunciona}>
                                ¿Cómo funciona?
                            </button>
                        </div>

                        <div className="border-t border-surface-border-light pt-6">
                            <div className="mb-3 inline-flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emergency" />
                                <span className="text-sm text-emergency">¿Situación de emergencia?</span>
                            </div>

                            <button onClick={openScanner} className="ui-btn-emergency">
                                <img src={personSearchIcon} alt="" className="h-5 w-5" aria-hidden="true" />
                                Encontré a alguien
                            </button>
                        </div>
                    </div>

                    <div className="relative min-h-[621px] overflow-hidden rounded-card border border-surface-border shadow-card">
                        <img
                            src={heroImage}
                            alt="Madre abrazando a su hija"
                            className="h-full w-full object-cover"
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

            <section data-home-section className="ui-home-scroll-section ui-viewport-section flex items-center bg-surface-base py-16 md:py-20">
                <div className="mx-auto w-full max-w-[90rem] px-6 md:px-8 lg:px-10 xl:px-12">
                    <div className="mx-auto mb-10 max-w-[672px] space-y-4 text-center">
                        <h2 className="text-[2rem] font-bold leading-10 text-text-primary">¿Has encontrado a un niño perdido?</h2>
                        <p className="text-base leading-6 text-text-body">
                            Nuestro sistema te permite actuar rápidamente protegiendo la identidad de manera segura.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        <article className="rounded-card border border-surface-border bg-surface-card p-8 shadow-card">
                            <img src={qrIcon} alt="Código QR" className="mb-6 h-20 w-14" />
                            <h3 className="mb-3 text-3xl font-semibold leading-8 text-text-primary">Escanear Código QR</h3>
                            <p className="mb-8 text-base leading-6 text-text-body">
                                Escanea la pulsera, mochila o credencial del menor para acceder a un canal de comunicación seguro y anónimo con sus tutores.
                            </p>
                            <button onClick={openScanner} className="ui-btn-teal w-full">
                                Escanear ahora
                                <img src={scanArrowIcon} alt="" aria-hidden="true" className="h-4 w-4" />
                            </button>
                        </article>

                        <article className="rounded-card border border-surface-border bg-surface-card p-8 shadow-card">
                            <img src={stepIcon} alt="Reconocimiento" className="mb-6 h-20 w-14" />
                            <h3 className="mb-3 text-3xl font-semibold leading-8 text-text-primary">Reconocimiento Facial</h3>
                            <p className="mb-8 text-base leading-6 text-text-body">
                                Utiliza nuestra IA avanzada para identificar al menor mediante una fotografía, cruzando datos de manera instantánea y privada.
                            </p>
                            <button onClick={openReconocimiento} className="inline-flex w-full items-center justify-between rounded-module bg-accent-500 px-4 py-3 text-sm font-bold text-accent-800 hover:bg-accent-600">
                                Usar reconocimiento facial
                                <img src={faceArrowIcon} alt="" aria-hidden="true" className="h-4 w-4" />
                            </button>
                        </article>

                        <article className="rounded-card border border-surface-border bg-surface-card p-8 shadow-card md:col-span-2 xl:col-span-1">
                            <img src={privacyIcon} alt="Privacidad" className="mb-6 h-20 w-14" />
                            <h3 className="mb-3 text-3xl font-semibold leading-8 text-text-primary">Seguridad y Privacidad</h3>
                            <p className="mb-8 text-base leading-6 text-text-body">
                                Tu información biométrica está protegida con cifrado. Operamos bajo un enfoque estricto de Privacy-First.
                            </p>

                            <div className="flex items-center gap-2 border-t border-surface-border-light pt-4">
                                <img src={verifiedIcon} alt="" aria-hidden="true" className="h-4 w-4" />
                                <span className="text-sm font-bold tracking-[0.05em] text-teal-400">Sistema verificado</span>
                            </div>
                        </article>
                    </div>
                </div>
            </section>

            <section id="como-funciona" data-home-section className="ui-home-scroll-section ui-viewport-section flex flex-col bg-[#EDEEEF]">
                <div className="mx-auto w-full max-w-[90rem] flex-1 px-6 py-14 md:px-8 lg:px-10 xl:px-12">
                    <div className="mb-10 text-center">
                        <h2 className="text-[2rem] font-semibold leading-8 text-text-primary">Tu tranquilidad en 3 simples pasos</h2>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        {[{
                            step: '1',
                            title: 'Registra el perfil',
                            text: 'Crea una cuenta segura y añade los datos e imágenes de tu hijo/a.',
                        }, {
                            step: '2',
                            title: 'Obtén tu identificador',
                            text: 'Recibe códigos QR únicos y activa la protección biométrica.',
                        }, {
                            step: '3',
                            title: 'Monitorea y conecta',
                            text: 'Si alguien escanea el código, recibirás una alerta inmediata y segura.',
                        }].map((item) => (
                            <article key={item.step} className="relative text-center">
                                <div className="mb-4 flex justify-center">
                                    <div className="relative flex h-12 w-12 items-center justify-center rounded-pill bg-white shadow-step">
                                        <span className="text-2xl font-semibold leading-8 text-text-heading">{item.step}</span>
                                    </div>
                                </div>

                                <h3 className="mb-2 text-sm font-bold tracking-[0.05em] text-text-heading">{item.title}</h3>
                                <p className="mx-auto max-w-[360px] text-sm leading-5 text-text-body">{item.text}</p>
                            </article>
                        ))}
                    </div>
                </div>
                <Footer className="mt-auto" />
            </section>

            {showModal && (
                <div data-home-ignore-snap className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/65 p-4 backdrop-blur-sm">
                    <div className="relative my-auto w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_48px_rgba(0,0,0,0.35)]">
                        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                            <h3 className="text-xl font-bold text-slate-900">Registrar a mi hijo/a</h3>
                            <button
                                type="button"
                                onClick={closeRegistro}
                                className="ui-modal-close"
                                aria-label="Cerrar modal de registro"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="max-h-[80vh] w-full overflow-y-auto bg-white p-2 md:p-3">
                            <FormularioGafete formRef={formRef} />
                        </div>
                    </div>
                </div>
            )}

            {showScannerModal && (
                <div data-home-ignore-snap className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
                    <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_48px_rgba(0,0,0,0.35)]">
                        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                            <h3 className="text-xl font-bold text-slate-900">Escanear gafete QR</h3>
                            <button
                                type="button"
                                onClick={closeScanner}
                                className="ui-modal-close"
                                aria-label="Cerrar modal de escaneo QR"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="bg-white p-6">
                            <ScannerQR />
                        </div>
                    </div>
                </div>
            )}

            {showReconocimientoModal && (
                <div data-home-ignore-snap className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
                    <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-[0_24px_48px_rgba(0,0,0,0.35)]">
                        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                            <h3 className="text-xl font-bold text-slate-900">Buscar por reconocimiento facial</h3>
                            <button
                                type="button"
                                onClick={closeReconocimiento}
                                className="ui-modal-close"
                                aria-label="Cerrar modal de reconocimiento facial"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="bg-white p-2 md:p-3">
                            <PaginaReconocimiento />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
