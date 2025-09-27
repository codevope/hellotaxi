
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './use-auth';

export interface PreciseLocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
  timestamp: number;
  source: 'gps' | 'network' | 'google-api' | 'user-profile' | 'ip';
  confidence: 'high' | 'medium' | 'low';
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

// Configuraciones optimizadas como Google Maps
const GOOGLE_MAPS_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 30000, // 30 segundos para GPS preciso
  maximumAge: 0, // Siempre ubicación fresca
};

const CONTINUOUS_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 5000, // Cache corto para tracking continuo
};

export function useGoogleGeolocation(): UseGoogleGeolocationReturn {
  const { user } = useAuth();
  const [location, setLocation] = useState<PreciseLocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const retryCountRef = useRef(0);

  // Estrategia 1: Ubicación desde perfil de Google (si está autenticado)
  const getUserProfileLocation = useCallback(async () => {
    if (!user) return null;
    
    try {
      // Si el usuario tiene ubicación guardada en su perfil
      // Nota: Esto requeriría configuración adicional en Firebase
      // Por ahora, simulamos que no hay ubicación guardada
      return null;
    } catch (error) {
      console.log('No se pudo obtener ubicación del perfil');
      return null;
    }
  }, [user]);

  // Estrategia 2: Google Geolocation API (más preciso que navigator.geolocation)
  const getGoogleAPILocation = useCallback(async (): Promise<PreciseLocationData | null> => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return null;

    try {
      const response = await fetch(`https://www.googleapis.com/geolocation/v1/geolocate?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          considerIp: true,
          wifiAccessPoints: [], // Se puede mejorar detectando WiFi
          cellTowers: [], // Se puede mejorar detectando torres celulares
        }),
      });

      const data = await response.json();
      
      if (data.location) {
        return {
          latitude: data.location.lat,
          longitude: data.location.lng,
          accuracy: data.accuracy || 1000,
          timestamp: Date.now(),
          source: 'google-api',
          confidence: data.accuracy < 100 ? 'high' : data.accuracy < 1000 ? 'medium' : 'low',
        };
      }
    } catch (error) {
      console.error('Error con Google Geolocation API:', error);
    }
    
    return null;
  }, []);

  // Estrategia 3: Navigator Geolocation mejorado
  const getNavigatorLocation = useCallback(async (options: PositionOptions): Promise<PreciseLocationData | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
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
            confidence: accuracy < 50 ? 'high' : accuracy < 200 ? 'medium' : 'low',
          });
        },
        (error) => {
          console.error(`Error navigator geolocation: ${error.message}`, error);
          resolve(null);
        },
        options
      );
    });
  }, []);

  // Estrategia 4: IP Geolocation como último recurso
  const getIPLocation = useCallback(async (): Promise<PreciseLocationData | null> => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        return {
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
          accuracy: 10000, // IP location es muy imprecisa
          timestamp: Date.now(),
          source: 'ip',
          confidence: 'low',
          address: `${data.city}, ${data.region}, ${data.country_name}`,
        };
      }
    } catch (error) {
      console.error('Error obteniendo ubicación por IP:', error);
    }
    
    return null;
  }, []);

  // Función principal que intenta múltiples estrategias
  const requestPreciseLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    retryCountRef.current = 0;

    console.log('🔄 Iniciando búsqueda de ubicación precisa...');

    try {
      // Estrategia 1: Perfil de usuario
      console.log('📋 Intentando ubicación del perfil...');
      let result: PreciseLocationData | null = await getUserProfileLocation();
      if (result) {
        console.log('✅ Ubicación obtenida del perfil');
        setLocation(result);
        setLoading(false);
        return;
      }

      // Estrategia 2: Google Geolocation API
      console.log('🌐 Intentando Google Geolocation API...');
      result = await getGoogleAPILocation();
      if (result && result.confidence === 'high') {
        console.log('✅ Ubicación precisa obtenida de Google API');
        setLocation(result);
        setLoading(false);
        return;
      }

      // Estrategia 3: Navigator con alta precisión
      console.log('📡 Intentando GPS de alta precisión...');
      result = await getNavigatorLocation(GOOGLE_MAPS_OPTIONS);
      if (result && result.accuracy < 100) {
        console.log('✅ Ubicación GPS precisa obtenida');
        setLocation(result);
        setLoading(false);
        return;
      }

      // Estrategia 4: Navigator modo rápido
      console.log('⚡ Intentando ubicación rápida...');
      result = await getNavigatorLocation(CONTINUOUS_OPTIONS);
      if (result) {
        console.log('✅ Ubicación básica obtenida');
        setLocation(result);
        setLoading(false);
        return;
      }

      // Estrategia 5: Usar Google API aunque no sea tan precisa
      const googleResult = await getGoogleAPILocation();
      if (googleResult) {
        console.log('⚠️ Usando Google API como respaldo');
        setLocation(googleResult);
        setLoading(false);
        return;
      }

      // Estrategia 6: IP como último recurso
      console.log('🌍 Usando ubicación por IP como último recurso...');
      result = await getIPLocation();
      if (result) {
        console.log('⚠️ Ubicación aproximada obtenida por IP');
        setLocation(result);
        setLoading(false);
        return;
      }

      // Si todo falla
      setError('No se pudo obtener la ubicación con ningún método');
      console.error('❌ Todas las estrategias de ubicación fallaron');
      
    } catch (err) {
      setError('Error obteniendo ubicación: ' + (err as Error).message);
      console.error('❌ Error general de ubicación:', err);
    } finally {
      setLoading(false);
    }
  }, [getUserProfileLocation, getGoogleAPILocation, getNavigatorLocation, getIPLocation]);

  // Tracking continuo como Google Maps
  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation || isTracking) return;

    console.log('🔄 Iniciando tracking continuo de ubicación...');
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
          confidence: accuracy < 50 ? 'high' : accuracy < 200 ? 'medium' : 'low',
        };

        console.log('📍 Ubicación actualizada:', newLocation);
        setLocation(newLocation);
        setError(null);
      },
      (error) => {
        console.error('Error en tracking:', error);
        setError(`Error de tracking: ${error.message}`);
      },
      {
        ...CONTINUOUS_OPTIONS,
        maximumAge: 30000, // Cache de 30 segundos para tracking
      }
    );
  }, [isTracking]);

  const stopLocationTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsTracking(false);
      console.log('⏹️ Tracking de ubicación detenido');
    }
  }, []);

  // Auto-iniciar ubicación al montar
  useEffect(() => {
    requestPreciseLocation();
  }, [requestPreciseLocation]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      stopLocationTracking();
    };
  }, [stopLocationTracking]);

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
