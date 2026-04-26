import { useState, useRef, useEffect } from 'react';
import { api } from '../lib/api';
import * as faceapi from 'face-api.js';
import { Camera, Send, Loader2, Link as LinkIcon, Download, CheckCircle, XCircle } from 'lucide-react';
import QRGenerado from './QRGenerado';
const MODELS_URL = '/models';
const FormularioGafete = ({ formRef }) => {
    const [formData, setFormData] = useState({
        nombreNino: '',
        edad: '',
        genero: 'MALE',
        tipoSangre: '',
        alergias: '',
        nombrePadre: '',
        correoPadre: '',
        telefonoPrincipal: '',
        telefonoAlternativo: '',
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
        if (name === 'edad' && value !== '' && !/^\d+$/.test(value)) return;
        if ((name === 'telefonoPrincipal' || name === 'telefonoAlternativo')) {
            // Solo permitir dígitos y limitar a 9 caracteres
            if (!/^\d*$/.test(value)) return;
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
                setFaceError('No se detectó ningún rostro. Por favor, asegúrate de que el niño/a esté bien iluminado y de frente a la cámara.');
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
        if (!formData.nombreNino || !formData.edad || !formData.genero || !formData.tipoSangre || !formData.nombrePadre || !formData.correoPadre || !formData.telefonoPrincipal) {
            alert("Por favor, completa todos los campos obligatorios.");
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.correoPadre)) {
            alert("Por favor, ingresa un correo electrónico válido.");
            return false;
        }
        if (!file) {
            alert("Sube una foto del niño/a. Es obligatoria para poder mostrarla cuando escaneen sus datos.");
            return false;
        }
        if (!faceDescriptor) {
            alert("Por favor, enciende la cámara y captura el rostro del niño/a para el reconocimiento facial.");
            return false;
        }
        if (formData.telefonoPrincipal.length !== 9) {
            alert("El teléfono principal debe tener exactamente 9 dígitos.");
            return false;
        }
        return true;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);
        try {
            const dataToUpload = {
                fullName: formData.nombreNino,
                age: parseInt(formData.edad),
                bloodType: formData.tipoSangre,
                allergies: formData.alergias,
                emergencyContactName: formData.nombrePadre,
                mainEmergencyPhone: formData.telefonoPrincipal,
                alternativeEmergencyPhone: formData.telefonoAlternativo,
                statusBadge: 'NEUTRAL',
                faceVector: faceDescriptor,
                gender: formData.genero
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
            console.error(err);
            alert("Error al guardar los datos.");
        } finally {
            setLoading(false);
        }
    };
    if (gafete) {
        const urlGafete = `${window.location.origin}/gafete/${gafete.uuid}`;
        return (
            <div className="mx-auto mb-10 max-w-2xl rounded-card border border-surface-border bg-surface-base p-8 text-center text-text-body shadow-card">
                <h2 className="mb-4 text-2xl font-bold text-text-primary">Registro completo!</h2>
                <div className="mb-6 rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
                    Los datos del nio/a se han guardado correctamente. Se ha generado su gafete QR y su rostro est listo para ser reconocido en caso de emergencia.
                </div>
                <p className="mb-4 text-text-body">Imprime este cdigo QR o descrgalo para usarlo como gafete, pulsera, o etiqueta en la ropa de tu hijo/a.</p>
                <div className="mx-auto mb-6 flex max-w-sm flex-col items-center justify-center rounded-card border border-surface-border bg-surface-base p-4">
                    <QRGenerado url={urlGafete} id={`qr-gafete-${gafete.uuid}`} />
                </div>
                <div className="mb-6 mt-4 rounded-lg border border-brand-200 bg-brand-50 p-4 text-left">
                    <p className="mb-2 font-semibold text-brand-800">Enlace del gafete (redirección QR):</p>
                    <a href={urlGafete} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 break-all text-brand-600 hover:text-brand-500 hover:underline">
                        <LinkIcon size={16} /> {urlGafete}
                    </a>
                </div>
                <button onClick={() => {
                    setGafete(null);
                    setFormData({ nombreNino: '', edad: '', genero: 'MALE', tipoSangre: '', alergias: '', nombrePadre: '', correoPadre: '', telefonoPrincipal: '', telefonoAlternativo: '' });
                    setFile(null);
                    setPreview(null);
                    setFaceDescriptor(null);
                }} className="ui-btn-primary">Registrar otro niño/a</button>
            </div>
        );
    }
    return (
        <div ref={formRef} className="mx-auto mb-10 max-w-3xl overflow-hidden rounded-card border border-surface-border bg-surface-base shadow-card">
            <div className="border-b border-surface-border bg-surface-muted px-6 py-4">
                <h2 className="text-center text-2xl font-bold text-text-primary">Registro integral del menor</h2>
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
                            <label className="mb-1 block text-sm font-bold text-text-heading">Nombre completo del niño(a) *</label>
                            <input required type="text" name="nombreNino" value={formData.nombreNino} onChange={handleChange} className="ui-input" placeholder="Nombres y Apellidos" />
                        </div>
                        <div className="form-group">
                            <label className="mb-1 block text-sm font-bold text-text-heading">Edad *</label>
                            <input required type="text" name="edad" value={formData.edad} onChange={handleChange} className="ui-input" placeholder="Años (ej. 5)" />
                        </div>
                        <div className="form-group">
                            <label className="mb-1 block text-sm font-bold text-text-heading">Género *</label>
                            <select required name="genero" value={formData.genero} onChange={handleChange} className="ui-input">
                                <option value="MALE">Masculino</option>
                                <option value="FEMALE">Femenino</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="mb-1 block text-sm font-bold text-text-heading">Tipo de sangre *</label>
                            <input required type="text" name="tipoSangre" value={formData.tipoSangre} onChange={handleChange} className="ui-input" placeholder="Ej. O+" />
                        </div>
                        <div className="form-group col-span-1 md:col-span-2">
                            <label className="mb-1 block text-sm font-bold text-text-heading">Condiciones médicas / alergias</label>
                            <input type="text" name="alergias" value={formData.alergias} onChange={handleChange} className="ui-input" placeholder="Ninguna, o especificar" />
                        </div>
                        <div className="form-group col-span-1 md:col-span-2 mt-4">
                            <h3 className="mb-2 border-b border-surface-border pb-2 font-bold text-text-primary">Contacto de emergencia</h3>
                        </div>
                        <div className="form-group col-span-1 md:col-span-2">
                            <label className="mb-1 block text-sm font-bold text-text-heading">Nombre del padre/madre/tutor *</label>
                            <input required type="text" name="nombrePadre" value={formData.nombrePadre} onChange={handleChange} className="ui-input" />
                        </div>
                        <div className="form-group col-span-1 md:col-span-2">
                            <label className="mb-1 block text-sm font-bold text-text-heading">Correo electrónico del padre/madre/tutor *</label>
                            <input required type="email" name="correoPadre" value={formData.correoPadre} onChange={handleChange} className="ui-input" placeholder="ejemplo@correo.com" />
                        </div>
                        <div className="form-group">
                            <label className="mb-1 block text-sm font-bold text-text-heading">Teléfono principal *</label>
                            <input required type="text" name="telefonoPrincipal" value={formData.telefonoPrincipal} onChange={handleChange} maxLength={9} className="ui-input" placeholder="Solo 9 dígitos" />
                        </div>
                        <div className="form-group">
                            <label className="mb-1 block text-sm font-bold text-text-heading">Teléfono alternativo</label>
                            <input type="text" name="telefonoAlternativo" value={formData.telefonoAlternativo} onChange={handleChange} maxLength={9} className="ui-input" placeholder="Solo 9 dígitos" />
                        </div>
                        {/* FOTO ESTATICA */}
                        <div className="form-group col-span-1 md:col-span-2 mt-4">
                            <h3 className="mb-2 border-b border-surface-border pb-2 font-bold text-text-primary">1. Foto del menor</h3>
                            <p className="mb-3 text-sm text-text-body">Sube una fotografía. Esta imagen será mostrada a la persona que escanee el código QR para que pueda identificar visualmente al niño/a.</p>
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
                            <p className="mb-3 text-sm text-text-body">Enciende la cámara y sitúa al niño/a frente a ella. Este escaneo garantiza mayor precisión en el momento de la búsqueda si está extraviado.</p>
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
