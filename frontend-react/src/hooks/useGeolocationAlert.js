import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const useGeolocationAlert = (qrCodeId) => {
    // Posibles estados: 'IDLE' | 'REQUESTING_LOCATION' | 'DENIED' | 'SENDING_ALERT' | 'FETCHING_DATA' | 'SUCCESS' | 'ERROR'
    const [status, setStatus] = useState('IDLE');
    const [gafete, setGafete] = useState(null);
    const [error, setError] = useState('');

    const processScan = useCallback(async () => {
        if (!qrCodeId) return;

        setStatus('REQUESTING_LOCATION');

        if (!navigator.geolocation) {
            setStatus('ERROR');
            setError('Tu navegador no soporta la geolocalización.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    // Estado 3: Coordenadas obtenidas, enviando alerta silenciosa
                    setStatus('SENDING_ALERT');
                    await axios.post('http://localhost:8080/api/v1/alerts/scan', {
                        qrCodeId,
                        latitude,
                        longitude
                    });

                    // Obteniendo datos reales del gafete tras enviar la alarma
                    setStatus('FETCHING_DATA');
                    const res = await axios.get(`http://localhost:8080/api/v1/badge/uuid/${qrCodeId}`);

                    setGafete(res.data);
                    setStatus('SUCCESS'); // Estado 4: Éxito
                } catch (err) {
                    console.error("Error en el escaneo:", err);
                    setStatus('ERROR');
                    setError(
                        err.response?.data?.message ||
                        'Ocurrió un error al procesar el código. Es posible que no exista.'
                    );
                }
            },
            (err) => {
                console.warn('Ubicación denegada o error de GPS:', err);
                setStatus('DENIED'); // Estado 2: Error o GPS bloqueado
                setError('No podemos mostrar los datos sin tu ubicación. Por favor, habilita el GPS para ayudar a localizar a esta persona.');
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    }, [qrCodeId]);

    // Disparar flujo automáticamente al tener un ID
    useEffect(() => {
        processScan();
    }, [processScan]);

    const retry = () => {
        processScan();
    };

    return { status, gafete, error, retry };
};

