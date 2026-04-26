import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { LinkIcon, ArrowRightIcon, Camera, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const scannerRef = useRef(null);
    const readerElementId = 'reader';

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
            } else {
                setError('URL de gafete inválida');
            }
        } catch {
            setError('Código QR inválido');
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

    // Capture photo from video element
    const capturePhoto = () => {
        const readerDiv = document.getElementById(readerElementId);
        if (!readerDiv) return;
        
        const video = readerDiv.querySelector('video');
        if (!video || !video.videoWidth) return;
        
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const photoUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedPhotoUrl(photoUrl);
        setPhotoCaptured(true);
    };

    // Submit to backend - optional photo
    const handleSubmit = async () => {
        if (!qrCodeUuid) return;
        
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
            
            // Add photo if captured
            if (capturedPhotoUrl) {
                const file = await fetch(capturedPhotoUrl)
                    .then(r => r.blob())
                    .then(blob => new File([blob], `scan-qr-${Date.now()}.jpg`, { type: 'image/jpeg' }));
                formData.append('file', file);
            }

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
        setCapturedPhotoUrl(null);
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
            {/* Tabs */}
            <div className="mb-4 flex rounded-module border border-surface-border bg-surface-muted p-1">
                <button
                    onClick={() => { setScanMethod('camera'); handleReset(); }}
                    disabled={qrScanned}
                    className={`flex-1 rounded-module py-2 text-sm font-semibold transition-colors ${scanMethod === 'camera' ? 'bg-brand-500 text-white shadow-sm' : 'text-text-body hover:text-brand-500'}`}
                >
                    Usar cámara
                </button>
                <button
                    onClick={() => { setScanMethod('link'); handleReset(); }}
                    disabled={qrScanned}
                    className={`flex-1 rounded-module py-2 text-sm font-semibold transition-colors ${scanMethod === 'link' ? 'bg-brand-500 text-white shadow-sm' : 'text-text-body hover:text-brand-500'}`}
                >
                    Ingresar enlace
                </button>
            </div>

            {!qrScanned ? (
                // Step 1: Scan QR
                scanMethod === 'camera' ? (
                    <div className="space-y-4">
                        <p className="text-center text-sm text-text-body">Apunta la cámara al código QR.</p>
                        <div id={readerElementId} className="scanner-reader overflow-hidden rounded-card border border-surface-border bg-surface-base shadow-card" />
                    </div>
                ) : (
                    <form onSubmit={handleLinkSubmit} className="space-y-4">
                        <p className="text-center text-sm text-text-body">Pega el enlace del gafete.</p>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <LinkIcon className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                value={linkInput}
                                onChange={(e) => setLinkInput(e.target.value)}
                                placeholder="https://.../gafete/123-456"
                                className="w-full rounded-module border border-surface-border bg-surface-base py-3 pl-10 pr-4 text-text-body placeholder:text-text-muted focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                required
                            />
                        </div>
                        <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-module bg-brand-500 py-3 font-bold text-white hover:bg-brand-600">
                            Escanear
                            <ArrowRightIcon className="h-5 w-5" />
                        </button>
                    </form>
                )
            ) : (
                // Step 2 & 3: Photo (optional) + Submit
                <div className="space-y-4">
                    <div className="rounded-card border border-brand-200 bg-brand-50 p-4 text-center">
                        <p className="text-sm font-bold text-brand-800">Código QR detectado</p>
                        <p className="text-xs text-brand-600">ID: {qrCodeUuid}</p>
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
                        <button
                            type="button"
                            onClick={capturePhoto}
                            disabled={loading}
                            className="flex-1 flex items-center justify-center gap-2 rounded-module bg-accent-500 py-3 font-bold text-accent-800 hover:bg-accent-600 disabled:opacity-50"
                        >
                            <Camera size={20} />
                            {photoCaptured ? 'Otra foto' : 'Tomar Foto'}
                        </button>
                        
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading || !qrCodeUuid}
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