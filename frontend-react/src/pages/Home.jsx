import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FormularioGafete from '../components/FormularioGafete';
import PaginaReconocimiento from './PaginaReconocimiento';
import ScannerQR from '../components/ScannerQR';
import Footer from '../components/Footer';
import { QrCodeIcon, CameraIcon, ArrowRightIcon, ShieldCheckIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { useHomeSectionSnap } from '../hooks/useHomeSectionSnap';
import heroImage from '../assets/figma-redesign/hero-image.png';
import shieldIcon from '../assets/figma-redesign/shield-icon.svg';
import shieldCheckIcon from '../assets/figma-redesign/shield-check-icon.svg';
import arrowRightIcon from '../assets/figma-redesign/arrow-right-icon.svg';
import personSearchIcon from '../assets/figma-redesign/person-search-icon.svg';

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
                <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-12">
                    <div className="mb-14 space-y-4 text-center">
                        <h2 className="text-3xl font-extrabold tracking-tight text-slate-100 md:text-5xl">¿Has encontrado a un niño perdido?</h2>
                        <p className="ui-muted-copy mx-auto max-w-2xl text-base leading-relaxed md:text-lg">
                            Elige el método más rápido para identificarlo y contactar a su familia.
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2">
                        <article className="group rounded-[2rem] border border-brand-200/15 bg-surface-soft p-8 shadow-[0_24px_48px_rgba(0,0,0,0.35)] transition-colors duration-300 hover:bg-brand-900/80 md:p-12">
                            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-800">
                                <QrCodeIcon className="h-8 w-8 text-brand-200" />
                            </div>
                            <h3 className="mb-4 text-3xl font-bold tracking-tight text-slate-100">Escanear Código QR</h3>
                            <p className="ui-muted-copy mb-10 text-lg leading-relaxed">
                                Escanea un gafete o etiqueta para abrir la ficha de emergencia y contactar a su familia en segundos.
                            </p>
                            <button onClick={openScanner} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-200 px-6 py-4 text-lg font-bold text-brand-900 hover:bg-brand-100">
                                Escanear ahora
                                <ArrowRightIcon className="h-4 w-4" />
                            </button>
                        </article>

                        <article className="group rounded-[2rem] border border-brand-200/15 bg-surface-soft p-8 shadow-[0_24px_48px_rgba(0,0,0,0.35)] transition-colors duration-300 hover:bg-brand-900/80 md:p-12">
                            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-500/15">
                                <CameraIcon className="h-8 w-8 text-accent-300" />
                            </div>
                            <h3 className="mb-4 text-3xl font-bold tracking-tight text-slate-100">Reconocimiento Facial</h3>
                            <p className="ui-muted-copy mb-10 text-lg leading-relaxed">
                                Si no tiene QR, usa la cámara para comparar su rostro con la base protegida y recuperar su identidad.
                            </p>
                            <button onClick={openReconocimiento} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent-500 px-6 py-4 text-lg font-bold text-slate-950 hover:bg-accent-400">
                                Usar reconocimiento facial
                                <ArrowRightIcon className="h-4 w-4" />
                            </button>
                        </article>
                    </div>
                </div>
            </section>

            <section id="como-funciona" data-home-section className="ui-home-scroll-section ui-viewport-section flex flex-col bg-surface-muted">
                <div className="mx-auto w-full max-w-7xl flex-1 px-6 py-16 md:px-10 md:py-20 lg:px-12">
                    <div className="mb-16 text-center md:mb-24">
                        <h2 className="text-3xl font-extrabold tracking-tight text-slate-100 md:text-5xl">Tu tranquilidad en 3 simples pasos</h2>
                    </div>

                    <div className="relative grid gap-8 md:grid-cols-3 md:gap-10">
                        <div className="pointer-events-none absolute left-[17%] right-[17%] top-10 hidden border-t border-dashed border-brand-200/25 md:block" />

                        <article className="relative z-10 flex flex-col items-center text-center">
                            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-surface-muted bg-brand-800 text-3xl font-bold text-accent-400 shadow-[0_14px_30px_rgba(0,0,0,0.35)]">1</div>
                            <div className="w-full rounded-3xl border border-brand-200/15 bg-surface-card p-8 shadow-[0_24px_48px_rgba(0,0,0,0.35)]">
                                <UserPlusIcon className="mx-auto mb-4 h-12 w-12 text-brand-200" />
                                <h3 className="mb-2 text-xl font-bold text-slate-100">Registra a tu hijo/a</h3>
                                <p className="text-sm leading-relaxed text-slate-300">Completa su perfil con foto actual, datos médicos y contactos de emergencia.</p>
                            </div>
                        </article>

                        <article className="relative z-10 flex flex-col items-center text-center">
                            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-surface-muted bg-brand-800 text-3xl font-bold text-accent-400 shadow-[0_14px_30px_rgba(0,0,0,0.35)]">2</div>
                            <div className="w-full rounded-3xl border border-brand-200/15 bg-surface-card p-8 shadow-[0_24px_48px_rgba(0,0,0,0.35)]">
                                <QrCodeIcon className="mx-auto mb-4 h-12 w-12 text-brand-200" />
                                <h3 className="mb-2 text-xl font-bold text-slate-100">Imprime su gafete/QR</h3>
                                <p className="text-sm leading-relaxed text-slate-300">Genera etiquetas para ropa, mochila o su identificador para salidas.</p>
                            </div>
                        </article>

                        <article className="relative z-10 flex flex-col items-center text-center">
                            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-surface-muted bg-brand-800 text-3xl font-bold text-accent-400 shadow-[0_14px_30px_rgba(0,0,0,0.35)]">3</div>
                            <div className="w-full rounded-3xl border border-brand-200/15 bg-surface-card p-8 shadow-[0_24px_48px_rgba(0,0,0,0.35)]">
                                <ShieldCheckIcon className="mx-auto mb-4 h-12 w-12 text-brand-200" />
                                <h3 className="mb-2 text-xl font-bold text-slate-100">Identificación dual</h3>
                                <p className="text-sm leading-relaxed text-slate-300">En una emergencia, activa QR o reconocimiento facial para contactarte sin demora.</p>
                            </div>
                        </article>
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
