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
  refreshLocation: () => void;
}

const HIGH_ACCURACY_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15000, // Más tiempo para GPS de alta precisión
  maximumAge: 30000, // Cache más corto para ubicación más actual
};

const FAST_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 5000,
  maximumAge: 300000, // Cache más largo para ubicación rápida
};

export function useGeolocation(
  options: PositionOptions = FAST_OPTIONS
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
        setLocation({ 
          latitude, 
          longitude, 
          accuracy, 
          timestamp: position.timestamp 
        });
        setLoading(false);
      },
      (error) => {
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
  }, [permissionStatus]);

  return {
    location,
    error,
    loading,
    permissionStatus,
    requestLocation,
    refreshLocation: requestLocation,
  };
}