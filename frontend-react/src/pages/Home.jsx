import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FormularioGafete from '../components/FormularioGafete';
import PaginaReconocimiento from './PaginaReconocimiento';
import ScannerQR from '../components/ScannerQR';
import Footer from '../components/Footer';
import { QrCodeIcon, CameraIcon, ArrowRightIcon, ShieldCheckIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { useHomeSectionSnap } from '../hooks/useHomeSectionSnap';

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
    const action = new URLSearchParams(location.search).get('action');
    const showModal = action === 'registro';
    const showReconocimientoModal = action === 'reconocimiento';
    const showScannerModal = action === 'scanner';

    const setActionInUrl = (nextAction) => {
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
        <div ref={containerRef} className="relative bg-surface-base text-slate-100">
            <div className="pointer-events-none absolute -left-20 top-12 h-80 w-80 rounded-full bg-brand-600/15 blur-3xl" />
            <div className="pointer-events-none absolute -right-16 top-80 h-72 w-72 rounded-full bg-accent-500/10 blur-3xl" />

            <section data-home-section className="ui-home-scroll-section ui-viewport-section ui-hero-section relative flex items-center overflow-hidden bg-surface-muted">
                <div className="relative mx-auto grid w-full max-w-[90rem] items-center gap-12 px-6 md:grid-cols-2 md:gap-14 md:px-10 lg:grid-cols-[1.12fr_0.88fr] lg:gap-20 lg:px-14 xl:px-16">
                    <div className="max-w-2xl text-left">

                        <h1 className="mb-8 text-5xl font-extrabold leading-[1.03] text-slate-100 md:text-6xl lg:text-7xl xl:text-[5.2rem]">
                            Protege a tu hijo/a de la manera más <span className="text-accent-400">segura</span>.
                        </h1>

                        <p className="ui-muted-copy mb-10 max-w-xl text-lg leading-relaxed md:text-xl lg:text-2xl lg:leading-relaxed">
                            Registra su información en minutos y activa identificación dual (QR + reconocimiento facial) para actuar rápido cuando más importa.
                        </p>

                        <div className="mb-12 flex flex-wrap gap-4 lg:mb-14">
                            <button className="ui-btn-primary px-7 py-3.5 text-base md:text-lg" onClick={openRegistro}>
                                Registrar a mi hijo/a
                            </button>
                            <button className="ui-btn-secondary px-7 py-3.5 text-base md:text-lg" onClick={scrollToComoFunciona}>
                                ¿Cómo funciona?
                            </button>
                        </div>
                    </div>

                    <div className="relative flex justify-center md:justify-end lg:justify-center">
                        <div className="absolute -inset-5 rounded-[2.4rem] bg-brand-500/10 blur-2xl" />
                        <img
                            src="https://peaceathomeparenting.com/wp-content/uploads/2022/07/Anxious-Children_-What-Really-Helps_-1-scaled.jpg"
                            alt="Madre abrazando a su hija"
                            className="relative aspect-[6/5] w-full max-w-[700px] rounded-[2rem] object-cover shadow-[0_24px_48px_rgba(0,0,0,0.45)] lg:max-w-[760px]"
                        />

                        <div className="ui-glass absolute -bottom-7 left-0 max-w-xs rounded-2xl p-4 shadow-[0_24px_48px_rgba(0,0,0,0.4)] md:-left-8 md:max-w-sm md:p-5 lg:-bottom-8 lg:left-4">
                            <div className="mb-2 flex items-center gap-2.5">
                                <ShieldCheckIcon className="h-5 w-5 text-accent-400 md:h-6 md:w-6" />
                                <p className="text-sm font-bold text-slate-100 md:text-base">Protección 24/7</p>
                            </div>
                            <p className="text-xs leading-relaxed text-slate-300 md:text-sm">Monitoreo constante para acelerar el contacto con la familia ante cualquier incidente.</p>
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
