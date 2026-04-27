import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { LinkIcon, ArrowRightIcon, Camera, Loader2, Image as ImageIcon, ScanLine, User, XCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';

const ScannerQR = () => {
    const [scanMethod, setScanMethod] = useState('camera');
    const [linkInput, setLinkInput] = useState('');
    const [locationGranted, setLocationGranted] = useState(false);
    const [locationError, setLocationError] = useState('');
    const navigate = useNavigate();
    
    // Step management
    const [qrScanned, setQrScanned] = useState(false);
    const [qrCodeUuid, setQrCodeUuid] = useState(null);
    const [photoCaptured, setPhotoCaptured] = useState(false);
    const [capturedPhotoUrl, setCapturedPhotoUrl] = useState(null);
    const [capturedPhotoFile, setCapturedPhotoFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const scannerRef = useRef(null);
    const fileInputRef = useRef(null);
    const readerElementId = 'reader';
    const hiddenReaderId = 'hidden-reader';

    // Request geolocation on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!navigator.geolocation) {
                setLocationError('Geolocalización no soportada por el navegador.');
                return;
            }
            navigator.geolocation.getCurrentPosition(
                () => {
                    setLocationGranted(true);
                    setLocationError('');
                },
                (err) => {
                    console.error("Error obteniendo ubicación:", err);
                    setLocationError('Es obligatorio compartir la ubicación para usar el escáner.');
                    setLocationGranted(false);
                },
                { enableHighAccuracy: true }
            );
        }, 0);

        return () => clearTimeout(timer);
    }, []);

    // Handle QR scan - just extract UUID, don't send to backend yet
    const handleQrScanned = (decodedText) => {
        try {
            const urlObj = new URL(decodedText);
            if (urlObj.pathname.startsWith('/gafete/')) {
                const uuid = urlObj.pathname.split('/gafete/')[1];
                
                // Stop scanner
                if (scannerRef.current) {
                    scannerRef.current.clear();
                }
                setQrCodeUuid(uuid);
                setQrScanned(true);
                setError(null);
            } else if (urlObj.pathname.includes('/gafete/')) {
                 const part = urlObj.pathname.split('/gafete/')[1];
                 const uuid = part.split('?')[0].split('/')[0];
                 if (scannerRef.current) scannerRef.current.clear();
                 setQrCodeUuid(uuid);
                 setQrScanned(true);
                 setError(null);
            } else {
                 const uuidMatch = decodedText.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
                 if (uuidMatch) {
                     if (scannerRef.current) scannerRef.current.clear();
                     setQrCodeUuid(uuidMatch[0]);
                     setQrScanned(true);
                     setError(null);
                 } else {
                     setError('Código QR no contiene un identificador válido.');
                 }
            }
        } catch {
             // Fallback regex to just extract UUID if it's not a valid URL URL
             const uuidMatch = decodedText.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
             if (uuidMatch) {
                 if (scannerRef.current) scannerRef.current.clear();
                 setQrCodeUuid(uuidMatch[0]);
                 setQrScanned(true);
                 setError(null);
             } else {
                 setError('No se reconoció un gafete válido en el QR.');
             }
        }
    };

    // Start QR scanner
    useEffect(() => {
        let scanner = null;

        if (scanMethod === 'camera' && locationGranted && !qrScanned) {
            scanner = new Html5QrcodeScanner(readerElementId, {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
            }, false);

            scanner.render(
                handleQrScanned,
                (err) => {
                    // Ignore scan errors
                }
            );
            
            scannerRef.current = scanner;
        }

        return () => {
            if (scanner) {
                scanner.clear().catch(e => console.error("Failed to clear scanner", e));
            }
        };
    }, [scanMethod, locationGranted, qrScanned]);

    // Handle File Upload from Gallery
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setError(null);
        setLoading(true);
        try {
            const html5QrCode = new Html5Qrcode(hiddenReaderId);
            const decodedText = await html5QrCode.scanFile(file, true);
            handleQrScanned(decodedText);
        } catch (err) {
            console.error("Error al escanear archivo:", err);
            setError("No se pudo detectar un código QR en la imagen proporcionada. Intenta con otra foto más clara.");
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Capture photo from video element
    const handlePhotoCapture = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const photoUrl = URL.createObjectURL(file);
        setCapturedPhotoUrl(photoUrl);
        setCapturedPhotoFile(file);
        setPhotoCaptured(true);
    };

    // Submit to backend - optional photo
    const handleSubmit = async () => {
        if (!qrCodeUuid || !capturedPhotoFile) return;

        setLoading(true);
        setError(null);

        try {
            let latitude = null;
            let longitude = null;
            if (navigator.geolocation) {
                try {
                    const position = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 });
                    });
                    latitude = position.coords.latitude;
                    longitude = position.coords.longitude;
                } catch (geoErr) {
                    console.warn('Geolocation denied:', geoErr);
                }
            }

            const nameDevice = navigator.userAgent;
            const ipAddress = '192.0.2.0';

            const scanData = {
                qrCodeUuid,
                latitude,
                longitude,
                nameDevice,
                ipAddress
            };

            const formData = new FormData();
            formData.append('data', new Blob([JSON.stringify(scanData)], { type: 'application/json' }));
            formData.append('file', capturedPhotoFile);

            const res = await api.post('/api/v1/badge/scan/qr', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const alertUuid = res.data;
            window.sessionStorage.setItem('pendingAlertUuid', alertUuid);
            window.sessionStorage.setItem('showReporterModal', 'true');
            
            // Navigate to trigger reporter modal
            navigate('/?action=scanner');
        } catch (err) {
            setError(err.response?.data?.message || 'Error al procesar el escaneo.');
        } finally {
            setLoading(false);
        }
    };

    // Handle link input submission
    const handleLinkSubmit = (e) => {
        e.preventDefault();
        if (linkInput.trim()) {
            handleQrScanned(linkInput.trim());
        }
    };

    // Reset flow
    const handleReset = () => {
        setQrScanned(false);
        setQrCodeUuid(null);
        setPhotoCaptured(false);
        if (capturedPhotoUrl) URL.revokeObjectURL(capturedPhotoUrl);
        setCapturedPhotoUrl(null);
        setCapturedPhotoFile(null);
        setError(null);
    };

    if (!locationGranted) {
        return (
            <div className="rounded-card border border-red-200 bg-red-50 p-6 text-center">
                <p className="text-red-600 font-bold mb-2">Acceso a ubicación requerido</p>
                <p className="text-sm text-red-500 mb-4">{locationError || 'Permite el acceso a tu ubicación para usar el escáner.'}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="rounded-module bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="w-full bg-surface-base text-text-body space-y-4">
            <div id={hiddenReaderId} style={{ display: 'none' }}></div>
            {/* Tabs */}
            <div className="mb-6 flex overflow-hidden rounded-xl border border-surface-border bg-surface-muted p-1.5 shadow-inner">
                <button
                    onClick={() => { setScanMethod('camera'); handleReset(); }}
                    disabled={qrScanned}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-lg py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 ${scanMethod === 'camera' ? 'bg-brand-500 text-white shadow-md' : 'text-text-body hover:bg-surface-soft hover:text-brand-600'}`}
                >
                    <ScanLine size={18} />
                    <span>Cámara</span>
                </button>
                <button
                    onClick={() => { setScanMethod('gallery'); handleReset(); }}
                    disabled={qrScanned}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-lg py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 ${scanMethod === 'gallery' ? 'bg-brand-500 text-white shadow-md' : 'text-text-body hover:bg-surface-soft hover:text-brand-600'}`}
                >
                    <ImageIcon size={18} />
                    <span>Galería</span>
                </button>
                <button
                    onClick={() => { setScanMethod('link'); handleReset(); }}
                    disabled={qrScanned}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-lg py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 ${scanMethod === 'link' ? 'bg-brand-500 text-white shadow-md' : 'text-text-body hover:bg-surface-soft hover:text-brand-600'}`}
                >
                    <LinkIcon size={18} />
                    <span>Enlace</span>
                </button>
            </div>

            {!qrScanned ? (
                // Step 1: Scan QR
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {scanMethod === 'camera' && (
                        <div className="space-y-4">
                            <p className="text-center text-sm font-medium text-text-body">Apunta con tu cámara hacia el código QR de manera que se vea claro y centrado.</p>
                            <div id={readerElementId} className="scanner-reader mx-auto max-w-sm overflow-hidden rounded-2xl border-2 border-brand-200 bg-slate-50 shadow-inner" />
                        </div>
                    )}

                    {scanMethod === 'gallery' && (
                        <div className="space-y-4 text-center">
                            <p className="text-sm font-medium text-text-body">Sube una fotografía de un código QR almacenada en tu dispositivo.</p>
                            <div className="relative mx-auto mt-4 max-w-sm rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50 p-8 hover:bg-brand-100 transition-colors">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    ref={fileInputRef}
                                    className="absolute inset-0 z-10 w-full h-full cursor-pointer opacity-0"
                                />
                                <div className="flex flex-col items-center justify-center gap-3 text-brand-600 pointer-events-none">
                                    <ImageIcon size={48} className="text-brand-400" />
                                    <span className="font-bold text-brand-700">Toca aquí para elegir una foto</span>
                                    <span className="text-xs text-brand-500">Formatos JPG, PNG</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {scanMethod === 'link' && (
                        <form onSubmit={handleLinkSubmit} className="space-y-4 max-w-md mx-auto">
                            <p className="text-center text-sm font-medium text-text-body">Si no tienes el código QR pero tienes el enlace del gafete, pégalo a continuación.</p>
                            <div className="relative mt-2">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <LinkIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    value={linkInput}
                                    onChange={(e) => setLinkInput(e.target.value)}
                                    placeholder="https://.../gafete/1234-abcd..."
                                    className="w-full rounded-xl border-2 border-surface-border bg-surface-base py-3 pl-12 pr-4 text-text-body placeholder:text-text-muted focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/20 transition-all font-medium"
                                    required
                                />
                            </div>
                            <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3.5 font-bold text-white shadow-md hover:bg-brand-600 hover:shadow-lg transition-all">
                                Buscar Gafete
                                <ArrowRightIcon className="h-5 w-5" />
                            </button>
                        </form>
                    )}

                    {error && scanMethod !== 'camera' && (
                        <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                            <XCircle className="mt-0.5 shrink-0" size={18} />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <div className="mt-8 border-t border-surface-border pt-6 text-center">
                        <div className="mx-auto flex max-w-sm flex-col items-center gap-3 rounded-2xl bg-surface-muted p-5 shadow-sm">
                            <p className="text-sm font-medium text-text-body">
                                ¿Problemas leyendo el QR o no cuentas con la pulsera/gafete a la mano?
                            </p>
                            <Link to="/?action=reconocimiento" className="flex items-center gap-2 rounded-lg bg-white border border-brand-200 px-5 py-2.5 font-bold text-brand-600 shadow-sm hover:bg-brand-50 hover:text-brand-700 transition-all">
                                <User size={20} />
                                Usar Reconocimiento Facial
                            </Link>
                        </div>
                    </div>
                </div>
            ) : (
                // Step 2 & 3: Photo (optional) + Submit
                <div className="space-y-4">
                    <div className="rounded-card border border-brand-200 bg-brand-50 p-4 text-center">
                        <p className="text-sm font-bold text-brand-800">Código QR detectado</p>
                        <p className="text-xs text-brand-600 mb-2">ID: {qrCodeUuid}</p>
                        <p className="text-sm text-brand-700 font-medium">Por precaución, es obligatorio tomar una foto de la persona para registrar el reporte.</p>
                    </div>

                    {/* Photo area */}
                    <div className="relative flex items-center justify-center overflow-hidden rounded-card border border-surface-border bg-slate-900 aspect-video">
                        {photoCaptured ? (
                            <img src={capturedPhotoUrl} alt="Foto capturada" className="w-full h-full object-contain" />
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                <Camera size={48} />
                                <p className="text-sm">Sin foto</p>
                            </div>
                        )}
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="rounded-card border border-red-200 bg-red-50 p-3">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handlePhotoCapture}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 rounded-module bg-accent-500 py-3 font-bold text-accent-800 hover:bg-accent-600 disabled:opacity-50"
                            >
                                <Camera size={20} />
                                {photoCaptured ? 'Cambiar Foto' : 'Tomar Foto'}
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading || !qrCodeUuid || !photoCaptured}
                            className="flex-1 flex items-center justify-center gap-2 rounded-module bg-brand-500 py-3 font-bold text-white hover:bg-brand-600 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                            {loading ? 'Enviando...' : 'Siguiente'}
                        </button>
                    </div>

                    {/* Reset button */}
                    <button
                        type="button"
                        onClick={handleReset}
                        disabled={loading}
                        className="w-full rounded-module border border-surface-border bg-surface-base py-2 text-sm font-medium text-text-body hover:bg-surface-muted"
                    >
                        ← Escanear otro código
                    </button>
                </div>
            )}
        </div>
    );
};

export default ScannerQR;
