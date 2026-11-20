import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import * as faceapi from '@vladmandic/face-api';
import { LinkIcon, ArrowRightIcon, Camera, Loader2, Image as ImageIcon, ScanLine, User, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { api, checkPublicQr } from '../lib/api';

const MODELS_URL = '/models';

const ScannerQR = ({ onScanSuccess, initialQrToken = null }) => {
    const [scanMethod, setScanMethod] = useState('camera');
    const [linkInput, setLinkInput] = useState('');
    const [locationGranted, setLocationGranted] = useState(false);
    const [locationError, setLocationError] = useState('');
    const navigate = useNavigate();
    
    // Step management
    const [qrScanned, setQrScanned] = useState(Boolean(initialQrToken));
    const [qrCodeUuid, setQrCodeUuid] = useState(initialQrToken);
    const [photoCaptured, setPhotoCaptured] = useState(false);
    const [capturedPhotoUrl, setCapturedPhotoUrl] = useState(null);
    const [capturedPhotoFile, setCapturedPhotoFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Face verification states
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [imgLoaded, setImgLoaded] = useState(false);
    const [verifyingFace, setVerifyingFace] = useState(false);
    const [faceVerified, setFaceVerified] = useState(null);
    const [faceVerificationMessage, setFaceVerificationMessage] = useState('');
    const [faceVector, setFaceVector] = useState(null);
    
    const scannerRef = useRef(null);
    const fileInputRef = useRef(null);
    const photoImgRef = useRef(null);
    const landmarkCanvasRef = useRef(null);
    const readerElementId = 'reader';
    const hiddenReaderId = 'hidden-reader';

    // Load face-api models on mount
    useEffect(() => {
        let active = true;
        const loadModels = async () => {
            try {
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODELS_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
                ]);
                if (active) {
                    setModelsLoaded(true);
                }
            } catch (err) {
                console.error('Error loading face-api models:', err);
            }
        };
        loadModels();
        return () => {
            active = false;
        };
    }, []);

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

    const drawLandmarks = (ctx, points) => {
        if (!points || points.length === 0) return;
        const connections = [
            [...Array(17).keys()],
            [17, 18, 19, 20, 21],
            [22, 23, 24, 25, 26],
            [27, 28, 29, 30],
            [31, 32, 33, 34, 35],
            [36, 37, 38, 39, 40, 41, 36],
            [42, 43, 44, 45, 46, 47, 42],
            [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 48],
            [60, 61, 62, 63, 64, 65, 66, 67, 60],
        ];
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 230, 255, 0.85)';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = 'rgba(0, 200, 255, 0.9)';
        ctx.shadowBlur = 6;
        connections.forEach((group) => {
            ctx.beginPath();
            const first = points[group[0]];
            ctx.moveTo(first.x, first.y);
            for (let i = 1; i < group.length; i++) {
                const p = points[group[i]];
                ctx.lineTo(p.x, p.y);
            }
            ctx.stroke();
        });
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.shadowColor = 'rgba(0, 200, 255, 1)';
        ctx.shadowBlur = 10;
        points.forEach((p) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    };

    // Detect landmarks on uploaded photo and verify face against QR badge in backend
    useEffect(() => {
        if (!photoCaptured || !capturedPhotoUrl || !imgLoaded || !modelsLoaded || !qrCodeUuid) {
            return undefined;
        }

        let cancelled = false;

        const verifyPhotoFace = async () => {
            const imgEl = photoImgRef.current;
            const canvas = landmarkCanvasRef.current;
            if (!imgEl || !canvas) return;

            setVerifyingFace(true);
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            try {
                const detection = await faceapi
                    .detectSingleFace(imgEl, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
                    .withFaceLandmarks()
                    .withFaceDescriptor();

                if (cancelled) return;

                const boxWidth = imgEl.clientWidth || imgEl.naturalWidth;
                const boxHeight = imgEl.clientHeight || imgEl.naturalHeight;
                canvas.width = boxWidth;
                canvas.height = boxHeight;
                ctx.clearRect(0, 0, boxWidth, boxHeight);

                if (!detection) {
                    setFaceVector(null);
                    setFaceVerified(false);
                    setFaceVerificationMessage(
                        'No se detectó un rostro claro en la foto. Por favor, sube otra foto donde el rostro se vea de frente.'
                    );
                    return;
                }

                const natW = imgEl.naturalWidth || boxWidth;
                const natH = imgEl.naturalHeight || boxHeight;
                const scale = Math.min(boxWidth / natW, boxHeight / natH);
                const renderW = natW * scale;
                const renderH = natH * scale;
                const offsetX = (boxWidth - renderW) / 2;
                const offsetY = (boxHeight - renderH) / 2;

                const resized = faceapi.resizeResults(detection, { width: renderW, height: renderH });
                const mappedPoints = resized.landmarks.positions.map((pt) => ({
                    x: pt.x + offsetX,
                    y: pt.y + offsetY,
                }));
                drawLandmarks(ctx, mappedPoints);

                let descriptorArray = Array.from(detection.descriptor);
                if (descriptorArray.length > 128) {
                    descriptorArray = descriptorArray.slice(0, 128);
                } else {
                    while (descriptorArray.length < 128) {
                        descriptorArray.push(0);
                    }
                }

                const verifyRes = await api.post('/api/v1/badge/scan/qr/verify-face', {
                    qrCodeUuid,
                    faceVector: descriptorArray,
                });

                if (cancelled) return;

                if (verifyRes.data?.verified) {
                    setFaceVector(descriptorArray);
                    setFaceVerified(true);
                    setFaceVerificationMessage(
                        verifyRes.data.message || 'Rostro verificado: sí corresponde a la persona registrada en este gafete.'
                    );
                } else {
                    setFaceVector(null);
                    setFaceVerified(false);
                    setFaceVerificationMessage(
                        verifyRes.data?.message || 'El rostro de la foto no coincide con el familiar registrado en este código QR.'
                    );
                }
            } catch (verifyErr) {
                if (cancelled) return;
                setFaceVector(null);
                setFaceVerified(false);
                setFaceVerificationMessage(
                    verifyErr.response?.data?.message || 'Error al verificar el rostro con el código QR escaneado.'
                );
            } finally {
                if (!cancelled) {
                    setVerifyingFace(false);
                }
            }
        };

        verifyPhotoFace();

        return () => {
            cancelled = true;
        };
    }, [photoCaptured, capturedPhotoUrl, imgLoaded, modelsLoaded, qrCodeUuid]);

    const acceptValidQr = async (uuid) => {
        try {
            const check = await checkPublicQr(uuid);
            if (!check?.valid) {
                setError(check?.message || 'Este código QR fue desactivado o revocado.');
                return;
            }
            if (scannerRef.current) {
                scannerRef.current.clear();
            }
            setQrCodeUuid(uuid);
            setQrScanned(true);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Este código QR es inválido o fue desactivado.');
        }
    };

    // Handle QR scan - verify QR is active before requesting face photo
    const handleQrScanned = (decodedText) => {
        try {
            const urlObj = new URL(decodedText);
            if (urlObj.pathname.startsWith('/gafete/')) {
                const uuid = urlObj.pathname.split('/gafete/')[1].split('?')[0].split('/')[0];
                acceptValidQr(uuid);
            } else if (urlObj.pathname.includes('/gafete/')) {
                const part = urlObj.pathname.split('/gafete/')[1];
                const uuid = part.split('?')[0].split('/')[0];
                acceptValidQr(uuid);
            } else {
                const uuidMatch = decodedText.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
                if (uuidMatch) {
                    acceptValidQr(uuidMatch[0]);
                } else {
                    setError('Código QR no contiene un identificador válido.');
                }
            }
        } catch {
            const uuidMatch = decodedText.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
            if (uuidMatch) {
                acceptValidQr(uuidMatch[0]);
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
                () => {
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

    // Capture photo for biometric verification
    const handlePhotoCapture = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (capturedPhotoUrl) {
            URL.revokeObjectURL(capturedPhotoUrl);
        }
        if (landmarkCanvasRef.current) {
            const ctx = landmarkCanvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, landmarkCanvasRef.current.width, landmarkCanvasRef.current.height);
        }

        const photoUrl = URL.createObjectURL(file);
        setImgLoaded(false);
        setFaceVerified(null);
        setFaceVerificationMessage('');
        setFaceVector(null);
        setVerifyingFace(true);
        setError(null);
        setCapturedPhotoUrl(photoUrl);
        setCapturedPhotoFile(file);
        setPhotoCaptured(true);
        event.target.value = '';
    };

    // Submit to backend with verified faceVector
    const handleSubmit = async () => {
        if (!qrCodeUuid || !capturedPhotoFile || !faceVerified || !faceVector) return;

        setLoading(true);
        setError(null);

        try {
            let latitude = null;
            let longitude = null;
            let gpsAccuracyMeters = null;
            if (navigator.geolocation) {
                try {
                    const position = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 });
                    });
                    latitude = position.coords.latitude;
                    longitude = position.coords.longitude;
                    gpsAccuracyMeters = position.coords.accuracy ?? null;
                } catch (geoErr) {
                    console.warn('Geolocation denied:', geoErr);
                }
            }

            const nameDevice = navigator.userAgent;
            const ipAddress = '192.0.2.0';

            const scanData = {
                qrCodeUuid,
                faceVector,
                latitude,
                longitude,
                nameDevice,
                ipAddress,
                gpsAccuracyMeters
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
            
            if (onScanSuccess) {
                onScanSuccess(alertUuid);
            } else {
                navigate('/?action=scanner');
            }
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
        setImgLoaded(false);
        setVerifyingFace(false);
        setFaceVerified(null);
        setFaceVerificationMessage('');
        setFaceVector(null);
        if (landmarkCanvasRef.current) {
            const ctx = landmarkCanvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, landmarkCanvasRef.current.width, landmarkCanvasRef.current.height);
        }
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
                // Step 2 & 3: Photo + Biometric Verification + Submit
                <div className="space-y-4">
                    <div className="rounded-card border border-brand-200 bg-brand-50 p-4 text-center">
                        <p className="text-sm font-bold text-brand-800">Código QR detectado</p>
                        <p className="text-xs text-brand-600 mb-2">ID: {qrCodeUuid}</p>
                        <p className="text-sm text-brand-700 font-medium">Por precaución, es obligatorio tomar una foto del rostro de la persona para verificar su identidad y registrar el reporte.</p>
                    </div>

                    {/* Photo area */}
                    <div className="relative flex items-center justify-center overflow-hidden rounded-card border border-surface-border bg-slate-900 aspect-video">
                        {photoCaptured ? (
                            <>
                                <img
                                    ref={photoImgRef}
                                    src={capturedPhotoUrl}
                                    alt="Foto capturada"
                                    onLoad={() => setImgLoaded(true)}
                                    className="w-full h-full object-contain"
                                />
                                <canvas
                                    ref={landmarkCanvasRef}
                                    className="pointer-events-none absolute inset-0 h-full w-full"
                                />
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                <Camera size={48} />
                                <p className="text-sm">Sin foto</p>
                            </div>
                        )}
                    </div>

                    {/* Face verification status */}
                    {photoCaptured && verifyingFace && (
                        <div className="flex items-center gap-3 rounded-card border border-brand-200 bg-brand-50 p-3.5 text-brand-800">
                            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-brand-600" />
                            <p className="text-sm font-medium">
                                {modelsLoaded
                                    ? 'Validando puntos faciales con el registro del familiar...'
                                    : 'Cargando modelos de IA y validando puntos faciales...'}
                            </p>
                        </div>
                    )}

                    {photoCaptured && !verifyingFace && faceVerified === true && (
                        <div className="flex items-start gap-2.5 rounded-card border border-green-200 bg-green-50 p-3.5 text-green-800">
                            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                            <p className="text-sm font-semibold">{faceVerificationMessage}</p>
                        </div>
                    )}

                    {photoCaptured && !verifyingFace && faceVerified === false && (
                        <div className="flex items-start gap-2.5 rounded-card border border-red-200 bg-red-50 p-3.5 text-red-700">
                            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                            <p className="text-sm font-semibold">{faceVerificationMessage}</p>
                        </div>
                    )}

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
                                disabled={loading || verifyingFace}
                            />
                            <button
                                type="button"
                                disabled={loading || verifyingFace}
                                className="w-full flex items-center justify-center gap-2 rounded-module bg-accent-500 py-3 font-bold text-accent-800 hover:bg-accent-600 disabled:opacity-50"
                            >
                                <Camera size={20} />
                                {photoCaptured ? 'Cambiar Foto' : 'Tomar Foto'}
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading || verifyingFace || !qrCodeUuid || !photoCaptured || !faceVerified || !faceVector}
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
