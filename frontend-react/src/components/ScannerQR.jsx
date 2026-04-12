import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { LinkIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const resolveScannedUrl = (url, navigate) => {
    try {
        const urlObj = new URL(url);
        if (urlObj.pathname.startsWith('/gafete/')) {
            navigate(urlObj.pathname);
        } else {
            window.location.href = url;
        }
    } catch {
        alert("Código QR inválido o URL no reconocida: " + url);
    }
};

const ScannerQR = () => {
    const [scanMethod, setScanMethod] = useState('camera');
    const [linkInput, setLinkInput] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        let scanner = null;

        if (scanMethod === 'camera') {
            scanner = new Html5QrcodeScanner("reader", {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
            }, false);

            scanner.render(
                (decodedText) => {
                    if (scanner) scanner.clear();
                    resolveScannedUrl(decodedText, navigate);
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
    }, [scanMethod, navigate]);

    const handleLinkSubmit = (e) => {
        e.preventDefault();
        if (linkInput.trim()) {
            resolveScannedUrl(linkInput.trim(), navigate);
        }
    };

    return (
        <div className="w-full bg-white text-slate-700">
            <div className="mb-6 flex rounded-lg border border-slate-200 bg-slate-100 p-1">
                <button
                    onClick={() => setScanMethod('camera')}
                    className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${scanMethod === 'camera' ? 'bg-brand-700 text-white shadow' : 'text-slate-600 hover:text-brand-700'}`}
                >
                    Usar cámara
                </button>
                <button
                    onClick={() => setScanMethod('link')}
                    className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${scanMethod === 'link' ? 'bg-brand-700 text-white shadow' : 'text-slate-600 hover:text-brand-700'}`}
                >
                    Ingresar enlace
                </button>
            </div>

            {scanMethod === 'camera' ? (
                <div className="space-y-4">
                    <p className="text-center text-sm text-slate-600">Apunta la cámara al código QR. Se detectará automáticamente.</p>
                    <div id="reader" className="scanner-reader overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" />
                </div>
            ) : (
                <form onSubmit={handleLinkSubmit} className="space-y-4">
                    <p className="text-center text-sm text-slate-600">Pega el enlace del gafete generado para ver los datos.</p>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <LinkIcon className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            value={linkInput}
                            onChange={(e) => setLinkInput(e.target.value)}
                            placeholder="https://.../gafete/123-456"
                            className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-4 text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                            required
                        />
                    </div>
                    <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-700 py-3 font-bold text-white hover:bg-brand-600">
                        Buscar niño
                        <ArrowRightIcon className="h-5 w-5" />
                    </button>
                </form>
            )}
        </div>
    );
};

export default ScannerQR;
