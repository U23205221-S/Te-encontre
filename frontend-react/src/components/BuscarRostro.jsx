import { useState, useRef, useEffect } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';
import { Camera, Search, AlertTriangle, CheckCircle, Loader2, User, ExternalLink } from 'lucide-react';

const MODELS_URL = '/models';

const BuscarRostro = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const streamRef = useRef(null);
  const lightingHintTimeoutRef = useRef(null);
  const isScanningRef = useRef(false);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showLightingHint, setShowLightingHint] = useState(false);

  // NEW: Step management
  const [faceDetected, setFaceDetected] = useState(false);
  const [photoCaptured, setPhotoCaptured] = useState(false);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState(null);
  const [faceVector, setFaceVector] = useState(null);
  const [sendingToBackend, setSendingToBackend] = useState(false);

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
    ctx.strokeStyle = 'rgba(255, 138, 0, 0.9)';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(255, 138, 0, 0.9)';
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
    ctx.shadowColor = 'rgba(255, 138, 0, 1)';
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
    setFaceDetected(false);
    setPhotoCaptured(false);
    setCapturedPhotoUrl(null);
    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 }, height: { ideal: 480 } }
      });
    } catch {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      } catch (err) {
        const denied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
        setResult({
          found: false,
          message: denied
            ? 'Cámara denegada. Permite el acceso en la configuración del navegador.'
            : 'No se encontró cámara.'
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

  // Step 1: Detect face only (don't send to backend yet)
  const handleDetectFace = async () => {
    if (isScanningRef.current) return;
    isScanningRef.current = true;
    setLoading(true);
    setResult(null);

    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setResult({ found: false, message: 'No se detectó ningún rostro. Centra el rostro del niño frente a la cámara.' });
        return;
      }

      let descriptor = Array.from(detection.descriptor);
      if (descriptor.length > 128) {
        descriptor = descriptor.slice(0, 128);
      } else while (descriptor.length < 128) {
        descriptor.push(0);
      }
      setFaceVector(descriptor);

      // Face detected - now require photo
      setFaceDetected(true);
      setResult({
        found: true,
        message: 'Rostro detectado. Ahora toma una foto de la persona encontrada.',
      });
    } catch (err) {
      setResult({ found: false, message: 'Error al detectar rostro.' });
    } finally {
      setLoading(false);
      isScanningRef.current = false;
    }
  };

  // Step 2: Capture photo for the scan
  const handleCapturePhoto = () => {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    const photoUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedPhotoUrl(photoUrl);
    setPhotoCaptured(true);
    setResult({
      found: true,
      message: 'Foto capturada. Ahora puedes continuar.',
    });
  };

  // Step 3: Send to backend (finally) after photo is captured
  const handleSubmitScan = async () => {
    if (!photoCaptured || sendingToBackend) return;
    setSendingToBackend(true);
    setLoading(true);

    try {
      if (!faceVector) {
        setResult({ found: false, message: 'No se detectó rostro previamente.' });
        return;
      }

      // Get geolocation
      let latitude = -6.77137;
      let longitude = -79.84088;
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

      // Keep user agent short
      const nameDevice = 'Dispositivo Web';
      let ipAddress = '190.235.12.34';
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        ipAddress = ipData.ip;
      } catch (err) {
        console.warn('Could not fetch IP', err);
      }

      const scanData = {
        faceVector: faceVector,
        latitude,
        longitude,
        nameDevice,
        ipAddress,
        gpsAccuracyMeters
      };

      // Photo is optional - only add if captured
      const formData = new FormData();
      formData.append('data', new Blob([JSON.stringify(scanData)], { type: 'application/json' }));
      
      if (capturedPhotoUrl) {
        const fileBlob = await fetch(capturedPhotoUrl).then(r => r.blob());
        formData.append('file', fileBlob, 'imagen.jpg');
      } else {
        setResult({ found: false, message: 'La toma de foto es obligatoria por seguridad.' });
        setLoading(false);
        setSendingToBackend(false);
        return;
      }

      const res = await api.post('/api/v1/badge/scan/face', formData);

      const alertUuid = res.data;
      window.sessionStorage.setItem('pendingAlertUuid', alertUuid);
      
      // Store that we need to show reporter modal
      window.sessionStorage.setItem('showReporterModal', 'true');
      
      stopCamera();
      
      // Force reload to trigger the reporter modal
      window.location.href = '/?action=scanner';
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 404) {
        setResult({
          found: false,
          message: 'No se encontró al niño en la base de datos o rostro no coincide.',
        });
      } else {
        setResult({ found: false, message: err.response?.data?.message || 'Error al procesar.' });
      }
    } finally {
      setLoading(false);
      setSendingToBackend(false);
    }
  };

  return (
    <div className="space-y-6 text-text-body">
      {/* Instructions based on current step */}
      {!faceDetected ? (
        <p className="text-sm text-text-body">
          Enciende la cámara, apunta al niño encontrado y presiona <strong>"Detectar Rostro"</strong>.
        </p>
      ) : !photoCaptured ? (
        <p className="text-sm text-text-body">
          Rostro detectado. Ahora toma una <strong>foto de la persona</strong> que encontraste.
        </p>
      ) : (
        <p className="text-sm text-text-body">
          Foto capturada. Presiona <strong>"Siguiente"</strong> para completar el escaneo.
        </p>
      )}

      {/* Video / Photo display area */}
      <div className={`relative flex items-center justify-center overflow-hidden rounded-card border border-surface-border bg-slate-900 transition-all duration-300 ${cameraOn ? 'h-[65vh] md:h-[70vh]' : 'aspect-video'}`}>
        {!faceDetected ? (
          <>
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
          </>
        ) : (
          <>
            {photoCaptured ? (
              <img src={capturedPhotoUrl} alt="Foto capturada" className="w-full h-full object-contain" />
            ) : (
              <video
                ref={videoRef}
                autoPlay muted playsInline
                className="w-full h-full object-cover"
              />
            )}
          </>
        )}
        
        {!cameraOn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400">
            <User size={56} />
            <p className="text-sm">{modelsLoaded ? 'Cámara apagada' : 'Cargando modelos de IA...'}</p>
          </div>
        )}
        
        {loading && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 z-10">
            <Loader2 className="animate-spin text-white" size={48} />
            <p className="text-white text-sm font-medium">
              {sendingToBackend ? 'Enviando escaneo...' : 'Procesando...'}
            </p>
          </div>
        )}
        
        {cameraOn && showLightingHint && !loading && (
          <div className="absolute inset-x-3 top-3 z-20 rounded-lg border border-amber-200 bg-amber-50/95 px-3 py-2 text-center text-xs font-medium text-amber-900 shadow-md backdrop-blur-sm">
            Para mejor reconocimiento, ubícate en un lugar con buena iluminación.
          </div>
        )}
      </div>

      {result && (
        <div className={`rounded-card border p-5 ${result.found ? 'border-brand-200 bg-brand-50' : 'border-red-200 bg-red-50'}`}>
          <div className="flex items-start gap-3">
            {result.found
              ? <CheckCircle className="text-brand-500 mt-0.5 flex-shrink-0" size={22} />
              : <AlertTriangle className="mt-0.5 flex-shrink-0 text-red-500" size={22} />}
            <p className={`text-sm font-bold ${result.found ? 'text-brand-800' : 'text-red-700'}`}>
              {result.message}
            </p>
          </div>
        </div>
      )}

      {/* Action buttons based on step */}
      <div className="flex gap-3">
        {!cameraOn ? (
          <button
            onClick={startCamera}
            disabled={!modelsLoaded}
            className="flex flex-1 items-center justify-center gap-2 rounded-module bg-brand-500 py-3 font-bold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Camera size={20} />
            {modelsLoaded ? 'Encender cámara' : 'Cargando...'}
          </button>
        ) : !faceDetected ? (
          <button
            onClick={handleDetectFace}
            disabled={loading || !modelsLoaded}
            className="flex flex-1 items-center justify-center gap-2 rounded-module bg-brand-500 py-3 font-bold text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
            {loading ? 'Detectando...' : 'Detectar Rostro'}
          </button>
        ) : !photoCaptured ? (
          <div className="flex flex-1 gap-2">
            <button
              onClick={handleCapturePhoto}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 rounded-module bg-accent-500 py-3 font-bold text-accent-800 hover:bg-accent-600 disabled:opacity-50"
            >
              <Camera size={20} />
              Tomar Foto (Obligatorio)
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => { setPhotoCaptured(false); setCapturedPhotoUrl(null); setFaceDetected(false); }}
              className="rounded-module border border-surface-border bg-surface-base px-4 py-3 font-medium text-text-body hover:bg-surface-muted"
            >
              Repetir Foto
            </button>
            <button
              onClick={handleSubmitScan}
              disabled={loading || sendingToBackend || !photoCaptured}
              className="flex flex-1 items-center justify-center gap-2 rounded-module bg-brand-500 py-3 font-bold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {sendingToBackend ? <Loader2 className="animate-spin" size={20} /> : null}
              {sendingToBackend ? 'Enviando...' : 'Siguiente'}
            </button>
          </>
        )}
        
        {cameraOn && faceDetected && (
          <button
            onClick={stopCamera}
            className="rounded-module border border-red-200 bg-red-50 px-4 py-3 font-medium text-red-700 hover:bg-red-100"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
};

export default BuscarRostro;

