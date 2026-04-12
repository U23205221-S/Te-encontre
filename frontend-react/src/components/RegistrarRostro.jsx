import { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import axios from 'axios';
import { Camera, CheckCircle, XCircle, Loader2, User } from 'lucide-react';

const MODELS_URL = '/models';
const API_URL = 'http://localhost:5001/api/rostros';

const RegistrarRostro = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const animFrameRef = useRef(null);
    const streamRef = useRef(null);
    const lightingHintTimeoutRef = useRef(null);

    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [cameraOn, setCameraOn] = useState(false);
    const [childId, setChildId] = useState('');
    const [status, setStatus] = useState('desaparecido');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
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
            await Promise.all([
                faceapi.nets.ssdMobilenetv1.loadFromUri(MODELS_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
            ]);
            setModelsLoaded(true);
        };
        loadModels();
        return () => {
            if (lightingHintTimeoutRef.current) {
                clearTimeout(lightingHintTimeoutRef.current);
            }
            stopCamera();
        };
    }, []);

    // ── Bucle de detección en tiempo real ────────────────────────────────────
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

    // ── Dibujo personalizado de nodos y líneas ───────────────────────────────
    const drawLandmarks = (ctx, points) => {
        if (!points || points.length === 0) return;

        // Grupos de conexiones de landmarks (índices face-api.js 68 puntos)
        const connections = [
            // Mandíbula (0–16)
            [...Array(17).keys()],
            // Ceja izquierda (17–21)
            [17, 18, 19, 20, 21],
            // Ceja derecha (22–26)
            [22, 23, 24, 25, 26],
            // Nariz vertical (27–30)
            [27, 28, 29, 30],
            // Nariz horizontal (31–35)
            [31, 32, 33, 34, 35],
            // Ojo izquierdo (36–41)
            [36, 37, 38, 39, 40, 41, 36],
            // Ojo derecho (42–47)
            [42, 43, 44, 45, 46, 47, 42],
            // Labio exterior (48–59)
            [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 48],
            // Labio interior (60–67)
            [60, 61, 62, 63, 64, 65, 66, 67, 60],
        ];

        // Líneas con brillo tipo HUD
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

        // Nodos (puntos) sobre cada landmark
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
        setResult(null);
        let stream = null;
        try {
            // Intento 1: constraints ideales
            stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
            });
        } catch {
            try {
                // Intento 2: constraints mínimas (mayor compatibilidad)
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
            } catch (err) {
                const denied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
                setResult({
                    ok: false,
                    message: denied
                        ? '⚠️ Permiso de cámara denegado. Para solucionarlo en Chrome: haz clic en el ícono 🔒 de la barra de direcciones → Cámara → Permitir, luego recarga la página.'
                        : '❌ No se encontró ninguna cámara conectada o está siendo usada por otro programa.'
                });
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

    const handleCapture = async () => {
        if (!childId.trim()) {
            setResult({ ok: false, message: 'Ingresa el ID del niño antes de capturar.' });
            return;
        }
        setLoading(true);
        setResult(null);
        try {
            const detection = await faceapi
                .detectSingleFace(videoRef.current)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                setResult({ ok: false, message: 'No se detectó ningún rostro. Asegúrate de que el niño esté bien iluminado y centrado.' });
                return;
            }

            const descriptor = Array.from(detection.descriptor);
            await axios.post(`${API_URL}/registrar`, { childId: childId.trim(), descriptor, status });
            setResult({ ok: true, message: `Rostro registrado correctamente para "${childId}".` });
            stopCamera();
        } catch (err) {
            setResult({ ok: false, message: err.response?.data?.mensaje || 'Error al registrar el rostro.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <p className="text-gray-600 text-sm">
                Enciende la cámara, centra el rostro del niño y haz clic en <strong>"Capturar"</strong>.
                El sistema extraerá el vector matemático del rostro y lo guardará — nunca se envía la imagen.
            </p>

            {/* Campos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        ID del niño <span className="text-accent-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={childId}
                        onChange={e => setChildId(e.target.value)}
                        placeholder="Ej: ID del reporte existente"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <select
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="desaparecido">Desaparecido</option>
                        <option value="seguro">Seguro (encontrado)</option>
                    </select>
                </div>
            </div>

{/* Video + Canvas — siempre en el DOM, visibilidad por CSS */}
    <div className={`relative bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center transition-all duration-300 ${cameraOn ? 'h-[65vh] md:h-[70vh]' : 'aspect-video'}`}>
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
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 gap-3">
                        <User size={56} />
                        <p className="text-sm">{modelsLoaded ? 'Cámara apagada' : 'Cargando modelos de IA...'}</p>
                    </div>
                )}
                {loading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                        <Loader2 className="animate-spin text-white" size={48} />
                    </div>
                )}
                {cameraOn && showLightingHint && !loading && (
                    <div className="absolute inset-x-3 top-3 z-20 rounded-lg border border-amber-200 bg-amber-50/95 px-3 py-2 text-center text-xs font-medium text-amber-900 shadow-md backdrop-blur-sm">
                        Para un mejor reconocimiento facial, ubícate en un lugar con buena iluminación.
                    </div>
                )}
            </div>

            {/* Resultado */}
            {result && (
                <div className={`flex items-start gap-3 p-4 rounded-lg border ${result.ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-accent-50 border-accent-200 text-accent-800'}`}>
                    {result.ok ? <CheckCircle size={20} className="mt-0.5 flex-shrink-0" /> : <XCircle size={20} className="mt-0.5 flex-shrink-0" />}
                    <p className="text-sm font-medium">{result.message}</p>
                </div>
            )}

{/* Botones */}
    <div className="flex gap-3">
      {!cameraOn ? (
        <button
          onClick={startCamera}
          disabled={!modelsLoaded}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Camera size={20} />
          {modelsLoaded ? 'Encender cámara' : 'Cargando modelos...'}
        </button>
      ) : (
        <>
          <button
            onClick={handleCapture}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
            {loading ? 'Procesando...' : 'Capturar rostro'}
          </button>
          <button
            onClick={stopCamera}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
        </>
      )}
    </div>
        </div>
    );
};

export default RegistrarRostro;
