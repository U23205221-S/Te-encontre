import { useState, useRef, useEffect } from 'react';
import { api } from '../lib/api';
import * as faceapi from 'face-api.js';
import html2canvas from 'html2canvas';
import { Camera, Send, Loader2, Link as LinkIcon, Download, CheckCircle, XCircle, Printer } from 'lucide-react';
import QRGenerado from './QRGenerado';
const MODELS_URL = '/models';
const FormularioGafete = ({ formRef }) => {
    const [formData, setFormData] = useState({
        // Familiar
        nombreFamiliar: '',
        dniFamiliar: '',
        fechaNacimiento: '', // YYYY-MM-DD
        genero: 'MASCULINO',
        tipoSangre: '',
        alergias: '',
        // Guardianes (2 obligatorios + 1 opcional)
        dniGuardian1: '', nombreGuardian1: '', correoGuardian1: '', telefonoGuardian1: '', parentescoGuardian1: 'PADRE',
        dniGuardian2: '', nombreGuardian2: '', correoGuardian2: '', telefonoGuardian2: '', parentescoGuardian2: 'MADRE',
        dniGuardian3: '', nombreGuardian3: '', correoGuardian3: '', telefonoGuardian3: '', parentescoGuardian3: 'OTRO',
    });
    // Para la foto subida
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    // Cámara
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const animFrameRef = useRef(null);
    const lightingHintTimeoutRef = useRef(null);
    const templateRef = useRef(null);
    const [cameraOn, setCameraOn] = useState(false);
    const [loading, setLoading] = useState(false);
    const [gafete, setGafete] = useState(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [faceError, setFaceError] = useState('');
    const [faceDescriptor, setFaceDescriptor] = useState(null);
    const [cameraError, setCameraError] = useState('');
    const [showLightingHint, setShowLightingHint] = useState(false);

    const showLightingMessage = () => {
        if (lightingHintTimeoutRef.current) {
            clearTimeout(lightingHintTimeoutRef.current);
        }

        setShowLightingHint(true);
        lightingHintTimeoutRef.current = setTimeout(() => {
            setShowLightingHint(false);
            lightingHintTimeoutRef.current = null;
        }, 4000);
    };

    useEffect(() => {
        const loadModels = async () => {
            try {
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODELS_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
                ]);
                setModelsLoaded(true);
            } catch (error) {
                console.error("Error loading models:", error);
            }
        };
        loadModels();
        return () => {
            if (lightingHintTimeoutRef.current) {
                clearTimeout(lightingHintTimeoutRef.current);
            }
            stopCamera();
        };
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Validations
        if (name.includes('dni') && value !== '' && !/^\d+$/.test(value)) return;
        if (name.includes('dni') && value.length > 8) return;

        if (name.includes('telefono')) {
            // Solo permitir dgitos y limitar a 9 caracteres
            if (value !== '' && !/^\d+$/.test(value)) return;
            if (value.length > 9) return;
        }
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        } else {
            setFile(null);
            setPreview(null);
        }
    };
    // --- Lógica de la Cámara ---
    const startDetectionLoop = () => {
        const loop = async () => {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (!video || !canvas || video.paused || video.ended) return;
            const detection = await faceapi
                .detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
                .withFaceLandmarks();
            const dims = { width: video.videoWidth, height: video.videoHeight };
            faceapi.matchDimensions(canvas, dims);
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (detection) {
                const resized = faceapi.resizeResults(detection, dims);
                drawLandmarks(ctx, resized.landmarks.positions);
            }
            animFrameRef.current = requestAnimationFrame(loop);
        };
        animFrameRef.current = requestAnimationFrame(loop);
    };
    const stopDetectionLoop = () => {
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = null;
        }
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    };
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
        connections.forEach(group => {
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
        points.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    };
    const startCamera = async () => {
        setCameraError('');
        setFaceDescriptor(null);
        let stream = null;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
            });
        } catch {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
            } catch {
                setCameraError('Permiso de cámara denegado o no hay cámara disponible.');
                return;
            }
        }
        streamRef.current = stream;
        const video = videoRef.current;
        video.srcObject = stream;
        video.onloadedmetadata = () => {
            video.play();
            startDetectionLoop();
        };
        setCameraOn(true);
        showLightingMessage();
    };
    const stopCamera = () => {
        stopDetectionLoop();
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setCameraOn(false);
        setShowLightingHint(false);

        if (lightingHintTimeoutRef.current) {
            clearTimeout(lightingHintTimeoutRef.current);
            lightingHintTimeoutRef.current = null;
        }
    };
    const handleCaptureFace = async () => {
        setFaceError('');
        setLoading(true);
        try {
            const detection = await faceapi
                .detectSingleFace(videoRef.current)
                .withFaceLandmarks()
                .withFaceDescriptor();
            if (!detection) {
                setFaceError('No se detectó ningún rostro. Por favor, asegúrate de que el familiar esté bien iluminado y de frente a la cámara.');
            } else {
                setFaceDescriptor(Array.from(detection.descriptor));
                stopCamera();
            }
        } catch (error) {
            console.error("Error capturando rostro:", error);
            setFaceError('Hubo un error al procesar el rostro. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };
    const validateForm = () => {
        if (!formData.nombreFamiliar || !formData.dniFamiliar || !formData.fechaNacimiento || !formData.genero || !formData.tipoSangre) {
            alert("Por favor, completa todos los campos obligatorios del familiar.");
            return false;
        }

        if (formData.dniFamiliar.length !== 8) {
            alert("El DNI del familiar debe tener exactamente 8 dígitos.");
            return false;
        }

        // Validate Guardian 1
        if (!formData.nombreGuardian1 || !formData.dniGuardian1 || !formData.correoGuardian1 || !formData.telefonoGuardian1 || !formData.parentescoGuardian1) {
            alert("Por favor, completa todos los campos del Primer Tutor de contacto.");
            return false;
        }
        if (formData.dniGuardian1.length !== 8) {
            alert("El DNI del Primer Tutor debe tener exactamente 8 dígitos.");
            return false;
        }
        if (formData.telefonoGuardian1.length !== 9) {
            alert("El teléfono del Primer Tutor debe tener exactamente 9 dígitos.");
            return false;
        }

        // Validate Guardian 2
        if (!formData.nombreGuardian2 || !formData.dniGuardian2 || !formData.correoGuardian2 || !formData.telefonoGuardian2 || !formData.parentescoGuardian2) {
            alert("Por favor, completa todos los campos del Segundo Tutor de contacto.");
            return false;
        }
        if (formData.dniGuardian2.length !== 8) {
            alert("El DNI del Segundo Tutor debe tener exactamente 8 dígitos.");
            return false;
        }
        if (formData.telefonoGuardian2.length !== 9) {
            alert("El teléfono del Segundo Tutor debe tener exactamente 9 dígitos.");
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.correoGuardian1) || !emailRegex.test(formData.correoGuardian2)) {
            alert("Por favor, ingresa un correo electrónico válido para los tutores obligatorios.");
            return false;
        }

        // Validate Guardian 3 if partially filled
        if (formData.dniGuardian3 || formData.nombreGuardian3 || formData.correoGuardian3 || formData.telefonoGuardian3) {
             if (!formData.nombreGuardian3 || !formData.dniGuardian3 || !formData.correoGuardian3 || !formData.telefonoGuardian3) {
                 alert("Por favor, completa todos los campos del Tercer Tutor o déjalos todos en blanco.");
                 return false;
             }
             if (formData.dniGuardian3.length !== 8) {
                 alert("El DNI del Tercer Tutor debe tener exactamente 8 dígitos.");
                 return false;
             }
             if (formData.telefonoGuardian3.length !== 9) {
                 alert("El teléfono del Tercer Tutor debe tener exactamente 9 dígitos.");
                 return false;
             }
             if (!emailRegex.test(formData.correoGuardian3)) {
                 alert("Por favor, ingresa un correo electrónico válido para el Tercer Tutor.");
                 return false;
             }
        }

        if (!file) {
            alert("Por favor, sube una foto de cuerpo o rostro claro para completar el registro.");
            return false;
        }
        if (!faceDescriptor) {
            alert("Por favor, enciende la cámara y captura el rostro del familiar para el reconocimiento facial.");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);
        try {
            // Ensure ISO format for date Of birth
            const dateStr = formData.fechaNacimiento; // Should be YYYY-MM-DD
            const isoDate = `${dateStr}T10:00:00Z`; // Default time to pass parsing

            const dataToUpload = {
                dni: formData.dniFamiliar,
                fullName: formData.nombreFamiliar,
                dateOfBirth: isoDate,
                gender: formData.genero,
                bloodType: formData.tipoSangre,
                allergies: formData.alergias || 'Ninguna',
                faceVector: faceDescriptor,
                guardians: [
                    {
                        dni: formData.dniGuardian1,
                        name: formData.nombreGuardian1,
                        email: formData.correoGuardian1,
                        phone: formData.telefonoGuardian1,
                        relationship: formData.parentescoGuardian1
                    },
                    {
                        dni: formData.dniGuardian2,
                        name: formData.nombreGuardian2,
                        email: formData.correoGuardian2,
                        phone: formData.telefonoGuardian2,
                        relationship: formData.parentescoGuardian2
                    },
                    ...(formData.dniGuardian3 && formData.nombreGuardian3 ? [{
                        dni: formData.dniGuardian3,
                        name: formData.nombreGuardian3,
                        email: formData.correoGuardian3,
                        phone: formData.telefonoGuardian3,
                        relationship: formData.parentescoGuardian3
                    }] : [])
                ].filter(g => g.dni && g.name) // filter empty guardians
            };

            const data = new FormData();
            data.append('data', new Blob([JSON.stringify(dataToUpload)], { type: 'application/json' }));
            data.append('file', file);

            const res = await api.post('/api/v1/badge', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const nuevoGafete = res.data;

            setGafete(nuevoGafete);
            window.scrollTo(0, 0);
        } catch (err) {
            console.error("Error completo del servidor:", err.response?.data || err);
            let errMsg = "Error al guardar los datos.";

            if (err.response?.data) {
                if (typeof err.response.data === 'string') {
                    errMsg += `\nDetalle: ${err.response.data}`;
                } else if (err.response.data.errors) {
                    errMsg += `\nDetalles:\n`;
                    for (const [key, value] of Object.entries(err.response.data.errors)) {
                         errMsg += `- ${key}: ${value}\n`;
                    }
                } else if (err.response.data.message) {
                    errMsg += `\nDetalle: ${err.response.data.message}`;
                } else {
                    errMsg += `\nDetalle: ${JSON.stringify(err.response.data)}`;
                }
            }
            alert(errMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadTemplate = async () => {
        if (!templateRef.current) return;
        try {
            setLoading(true);
            const canvas = await html2canvas(templateRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });
            const link = document.createElement('a');
            link.download = `Plantilla_Emergencia_Gafete.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('Error al descargar la plantilla:', err);
            alert("No se pudo generar la imagen para descargar. Intente imprimir como PDF.");
        } finally {
            setLoading(false);
        }
    };

    if (gafete) {
        const urlGafete = `${window.location.origin}/gafete/${gafete.uuid}`;
        return (
            <div className="mx-auto mb-10 max-w-4xl text-text-body">
                {/* Contenedor visible solo en pantalla (No en impresión) */}
                <div className="print:hidden rounded-card border border-surface-border bg-surface-base p-8 text-center shadow-card mb-8 relative">
                    <CheckCircle className="mx-auto mb-4 text-green-500" size={48} />
                    <h2 className="mb-4 text-2xl font-bold text-text-primary">¡Registro completado con éxito!</h2>
                    <div className="mb-6 rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
                        Los datos del familiar se han guardado correctamente. Abajo encontrarás la plantilla lista para imprimir o descargar como imagen con todos los pasos para casos de emergencia.
                    </div>
                    {loading && <div className="mb-4 text-brand-600 font-medium">Generando archivo, por favor espera...</div>}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button onClick={handleDownloadTemplate} disabled={loading} className="ui-btn-primary flex justify-center items-center gap-2 py-3 px-6 text-lg font-semibold shadow-md hover:shadow-lg transition-all w-full sm:w-auto">
                            <Download size={22} /> Descargar Plantilla (Recomendado)
                        </button>
                        <button onClick={() => window.print()} disabled={loading} className="flex justify-center items-center gap-2 rounded-module border-2 border-brand-500 bg-white text-brand-600 px-6 py-3 text-lg font-semibold hover:bg-brand-50 transition-all w-full sm:w-auto">
                            <Printer size={22} /> Imprimir
                        </button>
                    </div>
                </div>

                {/* Plantilla diseñada para impresión y visualización de pasos */}
                <div ref={templateRef} className="rounded-2xl border-2 border-brand-400 bg-white p-6 md:p-10 shadow-xl print:shadow-none print:border-0 print:p-0 w-full max-w-[800px] mx-auto relative overflow-hidden bg-cover bg-center">
                    <div className="text-center mb-8 border-b-2 border-gray-100 pb-6 print:border-gray-800">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 uppercase tracking-wide">Plantilla de Emergencia</h2>
                        <p className="text-lg text-gray-700 mt-2 font-medium">Si me encuentras extraviado, por favor sigue estos pasos para contactar a mis familiares:</p>
                    </div>

                    <div className="space-y-8 px-2 md:px-6">
                        {/* Paso 1 */}
                        <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-4 md:gap-5">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white font-bold text-2xl print:border-2 print:border-black print:bg-white print:text-black">1</div>
                            <div className="pt-1">
                                <h3 className="text-xl font-bold text-gray-800">Ingresa a la aplicación web</h3>
                                <p className="text-base text-gray-600 mt-1">Abre el navegador web de tu celular o simplemente utiliza la cámara para realizar el escaneo guiado.</p>
                            </div>
                        </div>

                        {/* Paso 2 */}
                        <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-4 md:gap-5 break-inside-avoid">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white font-bold text-2xl print:border-2 print:border-black print:bg-white print:text-black">2</div>
                            <div className="w-full pt-1">
                                <h3 className="text-xl font-bold text-gray-800">Escanea este código QR</h3>
                                <p className="text-base text-gray-600 mt-1 mb-4">Utiliza la cámara de tu teléfono inteligente para leer de forma directa este código QR o ingresa al enlace listado a continuación:</p>

                                <div className="flex flex-col items-center justify-center bg-gray-50 rounded-2xl p-6 border-2 border-dashed border-gray-300 w-full max-w-sm mx-auto md:mx-0 print:border-black print:bg-transparent">
                                    <div className="bg-white p-3 rounded-xl shadow-sm print:shadow-none print:border print:border-gray-200">
                                        <QRGenerado url={urlGafete} id={`qr-gafete-${gafete.uuid}`} />
                                    </div>
                                    <div className="mt-5 w-full rounded-lg bg-gray-200 px-4 py-3 text-center text-sm font-mono font-bold text-gray-800 break-all print:border print:border-black print:bg-white">
                                        <span className="hover:text-brand-600 text-gray-800">{urlGafete}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Paso 3 */}
                        <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-4 md:gap-5 break-inside-avoid">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white font-bold text-2xl print:border-2 print:border-black print:bg-white print:text-black">3</div>
                            <div className="pt-1">
                                <h3 className="text-xl font-bold text-gray-800">¿El código no funciona?</h3>
                                <p className="text-base text-gray-600 mt-1">En caso de que el código QR esté maltratado, roto o la cámara no lo reconozca, ingresa a la web principal y utiliza la opción de <strong className="text-brand-700 font-semibold print:text-black">"Búsqueda por Reconocimiento Facial"</strong> tomando una foto rápida.</p>
                            </div>
                        </div>

                        {/* Paso 4 */}
                        <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-4 md:gap-5 break-inside-avoid">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white font-bold text-2xl print:border-2 print:border-black print:bg-white print:text-black">4</div>
                            <div className="pt-1">
                                <h3 className="text-xl font-bold text-gray-800">Ayúdame a comunicarnos</h3>
                                <p className="text-base text-gray-600 mt-1">Al ubicar el perfil, la plataforma mostrará de inmediato los datos y teléfonos de contacto de mis responsables.</p>
                                <div className="mt-4 p-4 bg-brand-50 border-l-4 border-brand-500 rounded-r-lg print:border-black print:bg-gray-100">
                                    <p className="text-lg italic font-medium text-brand-900 print:text-black">"¡Muchas gracias por tu solidaridad, empatía y el tiempo brindado para ayudarme a regresar a salvo!"</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 border-t-2 border-gray-100 pt-6 text-center print:border-gray-800 flex justify-between items-center px-4">
                        <p className="text-sm text-gray-500 font-medium print:text-gray-800" data-html2canvas-ignore="true">
                            {/* Oculto en la imagen/documento exportado */}
                            Esta credencial est asignada a un perfil de emergencia validado.
                        </p>
                        <p className="text-xs text-gray-400 font-medium whitespace-nowrap">Doc: {new Date().toLocaleDateString('es-ES')}</p>
                    </div>
                </div>

                <div className="print:hidden mt-8 flex justify-center">
                    <button onClick={() => {
                        setGafete(null);
                        setFormData({
                            nombreFamiliar: '', dniFamiliar: '', fechaNacimiento: '', genero: 'MASCULINO', tipoSangre: '', alergias: '',
                            dniGuardian1: '', nombreGuardian1: '', correoGuardian1: '', telefonoGuardian1: '', parentescoGuardian1: 'PADRE',
                            dniGuardian2: '', nombreGuardian2: '', correoGuardian2: '', telefonoGuardian2: '', parentescoGuardian2: 'MADRE',
                            dniGuardian3: '', nombreGuardian3: '', correoGuardian3: '', telefonoGuardian3: '', parentescoGuardian3: 'OTRO',
                        });
                        setFile(null);
                        setPreview(null);
                        setFaceDescriptor(null);
                        window.scrollTo(0, 0);
                    }} className="rounded-module border-2 border-surface-border bg-surface-base px-6 py-3 font-semibold text-text-primary hover:bg-surface-muted transition-colors shadow-sm">
                        Registrar un nuevo familiar
                    </button>
                </div>
            </div>
        );
    }
    return (
        <div ref={formRef} className="mx-auto mb-10 max-w-3xl overflow-hidden rounded-card border border-surface-border bg-surface-base shadow-card">
            <div className="border-b border-surface-border bg-surface-muted px-6 py-4">
                <h2 className="text-center text-2xl font-bold text-text-primary">Registro integral del familiar (Niño o Adulto Mayor)</h2>
                <p className="mt-1 text-center text-sm text-text-body">Generación de gafete QR y registro de reconocimiento facial</p>
            </div>
            {!modelsLoaded ? (
                <div className="flex flex-col items-center justify-center space-y-4 p-12">
                    <Loader2 className="animate-spin text-accent-500" size={48} />
                    <p className="text-text-body">Cargando modelos de Inteligencia Artificial...</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6 p-6 md:p-8">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="form-group col-span-1 md:col-span-2">
                            <label className="mb-1 block text-sm font-bold text-text-heading">Nombre completo del familiar *</label>
                            <input required type="text" name="nombreFamiliar" value={formData.nombreFamiliar} onChange={handleChange} className="ui-input" placeholder="Nombres y Apellidos" />
                        </div>
                        <div className="form-group">
                            <label className="mb-1 block text-sm font-bold text-text-heading">DNI del familiar *</label>
                            <input required type="text" name="dniFamiliar" value={formData.dniFamiliar} onChange={handleChange} maxLength={8} className="ui-input" placeholder="8 dígitos" />
                        </div>
                        <div className="form-group">
                            <label className="mb-1 block text-sm font-bold text-text-heading">Fecha de Nacimiento *</label>
                            <input required type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} className="ui-input" />
                        </div>
                        <div className="form-group">
                            <label className="mb-1 block text-sm font-bold text-text-heading">Género *</label>
                            <select required name="genero" value={formData.genero} onChange={handleChange} className="ui-input">
                                <option value="MASCULINO">Masculino</option>
                                <option value="FEMENINO">Femenino</option>
                                <option value="OTRO">Otro</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="mb-1 block text-sm font-bold text-text-heading">Tipo de sangre *</label>
                            <select required name="tipoSangre" value={formData.tipoSangre} onChange={handleChange} className="ui-input">
                                <option value="">Seleccione...</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                            </select>
                        </div>
                        <div className="form-group col-span-1 md:col-span-2">
                            <label className="mb-1 block text-sm font-bold text-text-heading">Condiciones médicas / alergias *</label>
                            <input required type="text" name="alergias" value={formData.alergias} onChange={handleChange} className="ui-input" placeholder="Escriba 'Ninguna' o detalle las alergias" />
                        </div>

                        {/* TUTOR 1 */}
                        <div className="form-group col-span-1 md:col-span-2 mt-4">
                            <h3 className="mb-2 border-b border-surface-border pb-2 font-bold text-text-primary">Contacto de emergencia - Tutor 1 (Obligatorio)</h3>
                        </div>
                        <div className="form-group">
                            <label className="mb-1 block text-sm font-bold text-text-heading">DNI *</label>
                            <input required type="text" name="dniGuardian1" value={formData.dniGuardian1} onChange={handleChange} maxLength={8} className="ui-input" placeholder="8 dígitos" />
                        </div>
                        <div className="form-group">
                            <label className="mb-1 block text-sm font-bold text-text-heading">Parentesco *</label>
                            <select required name="parentescoGuardian1" value={formData.parentescoGuardian1} onChange={handleChange} className="ui-input">
                                <option value="PADRE">PADRE</option>
                                <option value="MADRE">MADRE</option>
                                <option value="TIO">TIO</option>
                                <option value="ABUELO">ABUELO</option>
                                <option value="HERMANO">HERMANO</option>
                                <option value="OTRO">OTRO</option>
                            </select>
                        </div>
                        <div className="form-group col-span-1 md:col-span-2">
                            <label className="mb-1 block text-sm font-bold text-text-heading">Nombre completo *</label>
                            <input required type="text" name="nombreGuardian1" value={formData.nombreGuardian1} onChange={handleChange} className="ui-input" />
                        </div>
                        <div className="form-group">
                            <label className="mb-1 block text-sm font-bold text-text-heading">Correo electrónico *</label>
                            <input required type="email" name="correoGuardian1" value={formData.correoGuardian1} onChange={handleChange} className="ui-input" placeholder="ejemplo@correo.com" />
                        </div>
                        <div className="form-group">
                            <label className="mb-1 block text-sm font-bold text-text-heading">Teléfono *</label>
                            <input required type="text" name="telefonoGuardian1" value={formData.telefonoGuardian1} onChange={handleChange} maxLength={9} className="ui-input" placeholder="9 dígitos" />
                        </div>

                        {/* TUTOR 2 */}
                        <div className="form-group col-span-1 md:col-span-2 mt-4">
                            <h3 className="mb-2 border-b border-surface-border pb-2 font-bold text-text-primary">Contacto de emergencia - Tutor 2 (Obligatorio)</h3>
                        </div>
                        <div className="form-group">
                            <label className="mb-1 block text-sm font-bold text-text-heading">DNI *</label>
                            <input required type="text" name="dniGuardian2" value={formData.dniGuardian2} onChange={handleChange} maxLength={8} className="ui-input" placeholder="8 dígitos" />
                        </div>
                        <div className="form-group">
                            <label className="mb-1 block text-sm font-bold text-text-heading">Parentesco *</label>
                            <select required name="parentescoGuardian2" value={formData.parentescoGuardian2} onChange={handleChange} className="ui-input">
                                <option value="MADRE">MADRE</option>
                                <option value="PADRE">PADRE</option>
                                <option value="TIO">TIO</option>
                                <option value="ABUELO">ABUELO</option>
                                <option value="HERMANO">HERMANO</option>
                                <option value="OTRO">OTRO</option>
                            </select>
                        </div>
                        <div className="form-group col-span-1 md:col-span-2">
                            <label className="mb-1 block text-sm font-bold text-text-heading">Nombre completo *</label>
                            <input required type="text" name="nombreGuardian2" value={formData.nombreGuardian2} onChange={handleChange} className="ui-input" />
                        </div>
                        <div className="form-group">
                            <label className="mb-1 block text-sm font-bold text-text-heading">Correo electrónico *</label>
                            <input required type="email" name="correoGuardian2" value={formData.correoGuardian2} onChange={handleChange} className="ui-input" placeholder="ejemplo@correo.com" />
                        </div>
                        <div className="form-group">
                            <label className="mb-1 block text-sm font-bold text-text-heading">Teléfono *</label>
                            <input required type="text" name="telefonoGuardian2" value={formData.telefonoGuardian2} onChange={handleChange} maxLength={9} className="ui-input" placeholder="9 dígitos" />
                        </div>

                        {/* TUTOR 3 */}
                        <div className="form-group col-span-1 md:col-span-2 mt-4">
                            <h3 className="mb-2 border-b border-surface-border pb-2 font-bold text-text-primary">Contacto de emergencia - Tutor 3 (Opcional)</h3>
                        </div>
                        <div className="form-group">
                            <label className="mb-1 block text-sm font-bold text-text-heading">DNI</label>
                            <input type="text" name="dniGuardian3" value={formData.dniGuardian3} onChange={handleChange} maxLength={8} className="ui-input" placeholder="8 dígitos" />
                        </div>
                        <div className="form-group">
                            <label className="mb-1 block text-sm font-bold text-text-heading">Parentesco</label>
                            <select name="parentescoGuardian3" value={formData.parentescoGuardian3} onChange={handleChange} className="ui-input">
                                <option value="OTRO">OTRO</option>
                                <option value="PADRE">PADRE</option>
                                <option value="MADRE">MADRE</option>
                                <option value="TIO">TIO</option>
                                <option value="ABUELO">ABUELO</option>
                                <option value="HERMANO">HERMANO</option>
                            </select>
                        </div>
                        <div className="form-group col-span-1 md:col-span-2">
                            <label className="mb-1 block text-sm font-bold text-text-heading">Nombre completo</label>
                            <input type="text" name="nombreGuardian3" value={formData.nombreGuardian3} onChange={handleChange} className="ui-input" />
                        </div>
                        <div className="form-group">
                            <label className="mb-1 block text-sm font-bold text-text-heading">Correo electrónico</label>
                            <input type="email" name="correoGuardian3" value={formData.correoGuardian3} onChange={handleChange} className="ui-input" placeholder="ejemplo@correo.com" />
                        </div>
                        <div className="form-group">
                            <label className="mb-1 block text-sm font-bold text-text-heading">Teléfono</label>
                            <input type="text" name="telefonoGuardian3" value={formData.telefonoGuardian3} onChange={handleChange} maxLength={9} className="ui-input" placeholder="9 dígitos" />
                        </div>

                        {/* FOTO ESTATICA */}
                        <div className="form-group col-span-1 md:col-span-2 mt-4">
                            <h3 className="mb-2 border-b border-surface-border pb-2 font-bold text-text-primary">1. Foto del familiar</h3>
                            <p className="mb-3 text-sm text-text-body">Sube una fotografía. Esta imagen será mostrada a la persona que escaneé el código QR para que pueda identificar visualmente a su familiar.</p>
                            <input required type="file" onChange={handleFileChange} accept="image/*" className="w-full cursor-pointer rounded-module border border-dashed border-surface-border bg-surface-muted p-2 text-text-body hover:bg-surface-soft" />
                            {preview && (
                                <div className="mt-4 flex flex-col items-center">
                                    <img src={preview} alt="Vista previa" className="h-40 rounded-module object-cover shadow-sm" />
                                </div>
                            )}
                        </div>
                        {/* ESCANEO FACIAL */}
                        <div className="form-group col-span-1 md:col-span-2 mt-4">
                            <h3 className="mb-2 border-b border-surface-border pb-2 font-bold text-text-primary">2. Registro de reconocimiento facial en vivo</h3>
                            <p className="mb-3 text-sm text-text-body">Enciende la cámara y sitúa al familiar frente a ella. Este escaneo garantiza mayor precisión en el momento de la búsqueda si está extraviado.</p>
                            {faceDescriptor ? (
                                <div className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4">
                                    <CheckCircle className="text-brand-300" size={30} />
                                    <div>
                                        <h4 className="font-bold text-brand-800">Rostro capturado y verificado</h4>
                                        <p className="text-sm text-brand-700">El patrón facial matemático se registró correctamente.</p>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => setFaceDescriptor(null)} 
                                        className="ml-auto rounded-module border border-surface-border bg-surface-base px-3 py-1 text-sm text-text-body hover:bg-surface-muted"
                                    >
                                        Repetir
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className={`relative mx-auto flex items-center justify-center overflow-hidden rounded-xl bg-slate-900 shadow-inner ring-1 ring-slate-200 transition-all duration-300 ${cameraOn ? 'h-[45vh] md:h-[55vh] w-full max-w-none' : 'aspect-video max-w-sm'}`}>
                                        <video
                                            ref={videoRef}
                                            autoPlay muted playsInline
                                            className={`w-full h-full object-cover ${cameraOn ? '' : 'hidden'}`}
                                        />
                                        <canvas
                                            ref={canvasRef}
                                            className={`absolute inset-0 w-full h-full ${cameraOn ? '' : 'hidden'}`}
                                            style={{ objectFit: 'cover' }}
                                        />
                                        {!cameraOn && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-300">
                                                <Camera size={40} />
                                                <p className="text-sm">Cámara apagada</p>
                                            </div>
                                        )}
                                        {loading && (
                                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 text-white">
                                                <Loader2 className="animate-spin mb-2" size={32} />
                                            </div>
                                        )}
                                        {cameraOn && showLightingHint && !loading && (
                                            <div className="absolute inset-x-3 top-3 z-20 rounded-lg border border-amber-200 bg-amber-50/95 px-3 py-2 text-center text-xs font-medium text-amber-900 shadow-md backdrop-blur-sm">
                                                Para un mejor reconocimiento facial, ubícate en un lugar con buena iluminación.
                                            </div>
                                        )}
                                    </div>
                                    {faceError && (
                                        <div className="mx-auto flex max-w-sm items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                            <XCircle size={18} className="mt-0.5 flex-shrink-0" />
                                            <p>{faceError}</p>
                                        </div>
                                    )}
                                    {cameraError && (
                                        <div className="mx-auto max-w-sm rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                            {cameraError}
                                        </div>
                                    )}
<div className="flex gap-3 justify-center">
              {!cameraOn ? (
                <button
                  type="button"
                  onClick={startCamera}
                  className="inline-flex items-center gap-2 rounded-module bg-brand-500 px-6 py-2 font-bold text-white hover:bg-brand-600"
                >
                  <Camera size={18} /> Encender cámara
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleCaptureFace}
                    className="inline-flex items-center gap-2 rounded-module bg-accent-500 px-6 py-2 font-bold text-accent-800 hover:bg-accent-600"
                  >
                    Capturar rostro
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="rounded-module border border-surface-border bg-surface-base px-4 py-2 text-text-body hover:bg-surface-muted"
                  >
                    Cancelar
                  </button>
                </>
              )}
            </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <button type="submit" disabled={loading || !faceDescriptor || !file} className="ui-btn-primary mt-6 flex w-full items-center justify-center gap-2 py-4 text-lg">
                        {loading && <Loader2 className="animate-spin" size={24} />}
                        {loading ? 'Guardando registro completo...' : 'Finalizar registro y crear gafete'}
                    </button>
                </form>
            )}
        </div>
    );
};
export default FormularioGafete;
