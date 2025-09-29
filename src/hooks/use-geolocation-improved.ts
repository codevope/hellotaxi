
'use client';

import { useState, useEffect, useCallback } from 'react';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
  timestamp: number;
}

export interface UseGeolocationReturn {
  location: LocationData | null;
  error: GeolocationPositionError | null;
  loading: boolean;
  permissionStatus: PermissionState | null;
  requestLocation: () => void;
}

const HIGH_ACCURACY_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 0, // Forzar una nueva lectura, no usar caché
};

// Función para reverse geocoding usando Google Maps API
const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    // Usar el geocoder de Google Maps si está disponible
    if (window.google && window.google.maps && window.google.maps.Geocoder) {
      const geocoder = new window.google.maps.Geocoder();
      const response = await new Promise<google.maps.GeocoderResponse>((resolve, reject) => {
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results) {
            resolve({ results } as google.maps.GeocoderResponse);
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        });
      });
      
      if (response.results && response.results.length > 0) {
        return response.results[0].formatted_address;
      }
    }
    
    // Fallback: crear dirección básica con coordenadas
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
};

export function useGeolocation(
  options: PositionOptions = HIGH_ACCURACY_OPTIONS
): UseGeolocationReturn {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | null>(null);

  const isSupported = typeof window !== 'undefined' && 'geolocation' in navigator;

  useEffect(() => {
    if (isSupported && 'permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((permission) => {
        setPermissionStatus(permission.state);
        
        const handleChange = () => setPermissionStatus(permission.state);
        permission.addEventListener('change', handleChange);
        return () => permission.removeEventListener('change', handleChange);
      });
    }
  }, [isSupported]);

  const requestLocation = useCallback(() => {
    if (!isSupported) {
      setError({
        code: 0,
        message: 'La geolocalización no es soportada por este navegador.',
      } as GeolocationPositionError);
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const timestamp = Date.now();
        
        // No geocodificamos aquí para desacoplar la lógica.
        // El componente que lo use decidirá si geocodificar o no.
        setLocation({ 
          latitude, 
          longitude, 
          accuracy,
          timestamp 
        });
        setLoading(false);
      },
      (error) => {
        console.error('Geolocation Error:', error);
        setError(error);
        setLoading(false);
      },
      HIGH_ACCURACY_OPTIONS // Siempre usar alta precisión para esta solicitud explícita
    );
  }, [isSupported]);


  return {
    location,
    error,
    loading,
    permissionStatus,
    requestLocation,
  };
}
