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

// Función para reverse geocoding usando Google Maps API
const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    // Usar el geocoder de Google Maps si está disponible
    if (window.google && window.google.maps) {
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

  const getCurrentLocation = useCallback(async (useHighAccuracy = true) => {
    if (!isSupported) {
      setError({
        code: 0,
        message: 'Geolocation is not supported by this browser',
      } as GeolocationPositionError);
      return;
    }

    setLoading(true);
    setError(null);

    const positionOptions = useHighAccuracy ? HIGH_ACCURACY_OPTIONS : FAST_OPTIONS;

    try {
      // Primero intentar ubicación rápida para UX inmediata
      if (useHighAccuracy) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            const timestamp = Date.now();
            
            // Obtener dirección en background
            const address = await reverseGeocode(latitude, longitude);
            
            setLocation({ 
              latitude, 
              longitude, 
              accuracy, 
              address,
              timestamp 
            });
            setLoading(false);
          },
          (error) => {
            console.warn('High accuracy failed, trying fast location:', error);
            // Si falla alta precisión, intentar con opciones rápidas
            getCurrentLocation(false);
          },
          positionOptions
        );
      } else {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            const timestamp = Date.now();
            
            // Obtener dirección en background
            const address = await reverseGeocode(latitude, longitude);
            
            setLocation({ 
              latitude, 
              longitude, 
              accuracy, 
              address,
              timestamp 
            });
            setLoading(false);
          },
          (error) => {
            setError(error);
            setLoading(false);
          },
          positionOptions
        );
      }
    } catch (err) {
      setError(err as GeolocationPositionError);
      setLoading(false);
    }
  }, [isSupported]);

  const requestLocation = useCallback(() => {
    getCurrentLocation(true);
  }, [getCurrentLocation]);

  const refreshLocation = useCallback(() => {
    getCurrentLocation(true);
  }, [getCurrentLocation]);

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
    refreshLocation,
  };
}