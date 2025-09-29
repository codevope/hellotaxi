
'use client';

import { useState, useEffect, useCallback } from 'react';
import { GeocodingService } from '@/services/geocoding-service';

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
        
        try {
          const address = await GeocodingService.reverseGeocode(latitude, longitude);
          setLocation({ latitude, longitude, accuracy, timestamp, address });
        } catch (geocodingError) {
          console.error("Geocoding failed:", geocodingError);
          // Fallback to coordinates if geocoding fails
          setLocation({
            latitude,
            longitude,
            accuracy,
            timestamp,
            address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
          });
        } finally {
            setLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation Error:', error);
        setError(error);
        setLoading(false);
      },
      HIGH_ACCURACY_OPTIONS
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
