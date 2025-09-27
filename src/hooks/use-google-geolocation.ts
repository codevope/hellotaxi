
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface PreciseLocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
  timestamp: number;
  source: 'gps' | 'network' | 'unknown';
}

export interface UseGoogleGeolocationReturn {
  location: PreciseLocationData | null;
  error: string | null;
  loading: boolean;
  accuracy: number | null;
  source: string | null;
  requestPreciseLocation: () => void;
  startLocationTracking: () => void;
  stopLocationTracking: () => void;
  isTracking: boolean;
}

const HIGH_ACCURACY_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15000, 
  maximumAge: 0, // No queremos una ubicación en caché
};

const CONTINUOUS_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 30000, 
  maximumAge: 5000, // Permitir caché de 5 segundos para tracking
};

export function useGoogleGeolocation(): UseGoogleGeolocationReturn {
  const [location, setLocation] = useState<PreciseLocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const getNavigatorLocation = useCallback(async (options: PositionOptions): Promise<PreciseLocationData | null> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('La geolocalización no es soportada por este navegador.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          console.log('📍 Navigator location:', { latitude, longitude, accuracy });
          resolve({
            latitude,
            longitude,
            accuracy,
            timestamp: position.timestamp,
            source: accuracy < 100 ? 'gps' : 'network',
          });
        },
        (error) => {
          console.error(`Error navigator geolocation: ${error.message}`, error);
          reject(error); // Rechazar la promesa con el objeto de error
        },
        options
      );
    });
  }, []);


  const requestPreciseLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    console.log('🔄 Buscando ubicación precisa...');

    try {
      const result = await getNavigatorLocation(HIGH_ACCURACY_OPTIONS);
      if (result) {
        console.log('✅ Ubicación precisa obtenida.');
        setLocation(result);
      }
    } catch (err) {
        let errorMessage = 'No se pudo obtener la ubicación.';
        if (err instanceof GeolocationPositionError) {
            if (err.code === err.PERMISSION_DENIED) {
                errorMessage = 'Permiso de ubicación denegado.';
            } else if (err.code === err.POSITION_UNAVAILABLE) {
                errorMessage = 'La ubicación no está disponible.';
            } else if (err.code === err.TIMEOUT) {
                errorMessage = 'Se agotó el tiempo de espera para obtener la ubicación.';
            }
        }
        console.error(errorMessage, err);
        setError(errorMessage);
        setLocation(null); // Asegurarse de que no haya una ubicación obsoleta
    } finally {
        setLoading(false);
    }
  }, [getNavigatorLocation]);

  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation || isTracking) return;

    console.log('🔄 Iniciando seguimiento continuo de ubicación...');
    setIsTracking(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const newLocation: PreciseLocationData = {
          latitude,
          longitude,
          accuracy,
          timestamp: position.timestamp,
          source: accuracy < 100 ? 'gps' : 'network',
        };
        console.log('📍 Ubicación actualizada (tracking):', newLocation);
        setLocation(newLocation);
        setError(null);
        setLoading(false);
      },
      (error) => {
        console.error('Error de seguimiento:', error);
        setError(`Error de seguimiento: ${error.message}`);
        setIsTracking(false);
      },
      CONTINUOUS_OPTIONS
    );
  }, [isTracking]);

  const stopLocationTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsTracking(false);
      console.log('⏹️ Seguimiento de ubicación detenido.');
    }
  }, []);

  useEffect(() => {
    // Solicitud de ubicación inicial
    requestPreciseLocation();
    // Limpieza al desmontar
    return () => {
      stopLocationTracking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    location,
    error,
    loading,
    accuracy: location?.accuracy || null,
    source: location?.source || null,
    requestPreciseLocation,
    startLocationTracking,
    stopLocationTracking,
    isTracking,
  };
}
