'use client';

import { useState, useEffect } from 'react';

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
  timeout: 30000, // 30 segundos para GPS preciso
  maximumAge: 0, // SIEMPRE solicitar ubicación fresca
};

const FAST_OPTIONS: PositionOptions = {
  enableHighAccuracy: true, // También usar GPS en modo rápido
  timeout: 10000, // 10 segundos timeout
  maximumAge: 0, // Sin cache
};

export function useGeolocation(
  options: PositionOptions = HIGH_ACCURACY_OPTIONS
): UseGeolocationReturn {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | null>(null);

  // Check if geolocation is supported
  const isSupported = typeof window !== 'undefined' && 'geolocation' in navigator;

  // Check permission status
  useEffect(() => {
    if (typeof window !== 'undefined' && 'permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((permission) => {
        setPermissionStatus(permission.state);
        
        // Listen for permission changes
        permission.addEventListener('change', () => {
          setPermissionStatus(permission.state);
        });
      });
    }
  }, []);

  const requestLocation = () => {
    if (!isSupported) {
      setError({
        code: 0,
        message: 'Geolocation is not supported by this browser',
      } as GeolocationPositionError);
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const locationData = { 
          latitude, 
          longitude, 
          accuracy, 
          timestamp: position.timestamp 
        };
        console.log('📍 Ubicación obtenida:', locationData);
        setLocation(locationData);
        setLoading(false);
      },
      (error) => {
        console.error('❌ Error de geolocalización:', error);
        setError(error);
        setLoading(false);
      },
      options
    );
  };

  // Auto-request location if permission is already granted
  useEffect(() => {
    if (permissionStatus === 'granted' && !location && !loading) {
      requestLocation();
    }
  }, [permissionStatus, location, loading, requestLocation]);

  return {
    location,
    error,
    loading,
    permissionStatus,
    requestLocation,
  };
}
