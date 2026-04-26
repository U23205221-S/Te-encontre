import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { LinkIcon, ArrowRightIcon, Camera, User } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

const capturePhotoFromHtml5Reader = async (readerElementId) => {
    // The html5-qrcode library creates a video element inside the reader div
    const readerDiv = document.getElementById(readerElementId);
    if (!readerDiv) return null;
    
    const video = readerDiv.querySelector('video');
    if (!video || !video.videoWidth) return null;
    
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(new File([blob], `scan-qr-${Date.now()}.jpg`, { type: 'image/jpeg' }));
            } else {
                resolve(null);
            }
        }, 'image/jpeg', 0.9);
    });
};

const resolveScannedUrl = async (decodedText, navigate, readerElementId = 'reader') => {
    try {
        const urlObj = new URL(decodedText);
        if (urlObj.pathname.startsWith('/gafete/')) {
            const qrCodeUuid = urlObj.pathname.split('/gafete/')[1];
            
            // Request geolocation for scan payload
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

            // Try to capture photo from the scanner's video element
            let file = await capturePhotoFromHtml5Reader(readerElementId);
            
            const formData = new FormData();
            formData.append('data', new Blob([JSON.stringify(scanData)], { type: 'application/json' }));
            formData.append('file', file);

            const res = await api.post('/api/v1/badge/scan/qr', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const alertUuid = res.data;
            window.sessionStorage.setItem('pendingAlertUuid', alertUuid);
            
            // Navigate home to show reporter modal
            navigate('/?action=scanner');
        } else {
            window.location.href = decodedText;
        }
    } catch {
        alert("Código QR inválido o URL no reconocida: " + decodedText);
    }
};

const ScannerQR = () => {
    const [scanMethod, setScanMethod] = useState('camera');
    const [linkInput, setLinkInput] = useState('');
    const [locationGranted, setLocationGranted] = useState(false);
    const [locationError, setLocationError] = useState('');
    const navigate = useNavigate();

    // Solicitar ubicación al iniciar el componente
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
                    console.error("Error obteniendo ubicación en scanner:", err);
                    setLocationError('Es obligatorio compartir la ubicación para usar el escáner y ver los datos.');
                    setLocationGranted(false);
                },
                { enableHighAccuracy: true }
            );
        }, 0);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        let scanner = null;

        // Solo iniciar cámara si se otorgaron permisos
        if (scanMethod === 'camera' && locationGranted) {
            scanner = new Html5QrcodeScanner("reader", {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
            }, false);

            scanner.render(
                (decodedText) => {
                    if (scanner) scanner.clear();
                    resolveScannedUrl(decodedText, navigate, 'reader');
                },
                () => {
                    // ignore frequent read errors
                }
            );
        }

        return () => {
            if (scanner) {
                scanner.clear().catch(e => console.error("Failed to clear html5 qrcode scanner", e));
            }
        };
    }, [scanMethod, navigate, locationGranted]);

    const handleLinkSubmit = (e) => {
        e.preventDefault();
        if (linkInput.trim()) {
            resolveScannedUrl(linkInput.trim(), navigate);
        }
    };

    return (
        <div className="w-full bg-surface-base text-text-body">
            {!locationGranted ? (
                <div className="rounded-card border border-red-200 bg-red-50 p-6 text-center">
                    <p className="text-red-600 font-bold mb-2">Acceso a ubicación requerido</p>
                    <p className="text-sm text-red-500 mb-4">{locationError || 'Por favor, permite el acceso a tu ubicación para poder habilitar la cámara y buscar a la persona desaparecida.'}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="rounded-module bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600"
                    >
                        Reintentar
                    </button>
                </div>
            ) : (
                <>
                    <div className="mb-6 flex rounded-module border border-surface-border bg-surface-muted p-1">
                        <button
                            onClick={() => setScanMethod('camera')}
                            className={`flex-1 rounded-module py-2 text-sm font-semibold transition-colors ${scanMethod === 'camera' ? 'bg-brand-500 text-white shadow-sm' : 'text-text-body hover:text-brand-500'}`}
                        >
                            Usar cámara
                        </button>
                        <button
                            onClick={() => setScanMethod('link')}
                            className={`flex-1 rounded-module py-2 text-sm font-semibold transition-colors ${scanMethod === 'link' ? 'bg-brand-500 text-white shadow-sm' : 'text-text-body hover:text-brand-500'}`}
                        >
                            Ingresar enlace
                        </button>
                    </div>

                    {scanMethod === 'camera' ? (
                        <div className="space-y-4">
                            <p className="text-center text-sm text-text-body">Apunta la cámara al código QR. Se detectará automáticamente.</p>
                            <div id="reader" className="scanner-reader overflow-hidden rounded-card border border-surface-border bg-surface-base shadow-card" />
                        </div>
                    ) : (
                        <form onSubmit={handleLinkSubmit} className="space-y-4">
                            <p className="text-center text-sm text-text-body">Pega el enlace del gafete generado para ver los datos.</p>
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
                                Buscar niño
                                <ArrowRightIcon className="h-5 w-5" />
                            </button>
                        </form>
                    )}
                </>
            )}
        </div>
    );
};

export default ScannerQR;
