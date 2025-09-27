
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface PreciseLocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
  timestamp: number;
  source: 'gps' | 'network' | 'google-api' | 'ip';
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

const HIGH_ACCURACY_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000, 
  maximumAge: 0,
};

const CONTINUOUS_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 30000, 
  maximumAge: 5000,
};

export function useGoogleGeolocation(): UseGoogleGeolocationReturn {
  const [location, setLocation] = useState<PreciseLocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);

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

  const getIPLocation = useCallback(async (): Promise<PreciseLocationData | null> => {
    try {
      // This is a fallback and will be inaccurate.
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        return {
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
          accuracy: 50000, // IP based is very inaccurate
          timestamp: Date.now(),
          source: 'ip',
          confidence: 'low',
          address: `${data.city}, ${data.region}, ${data.country_name}`,
        };
      }
    } catch (error) {
      console.error('Error getting IP location:', error);
    }
    
    return null;
  }, []);

  const requestPreciseLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    console.log('🔄 Searching for precise location...');

    // Strategy 1: High-accuracy GPS from browser
    let result = await getNavigatorLocation(HIGH_ACCURACY_OPTIONS);
    if (result && result.accuracy < 500) { // Accept if accuracy is better than 500m
      console.log('✅ Precise GPS location obtained.');
      setLocation(result);
      setLoading(false);
      return;
    }

    // Strategy 2: Fallback to IP as a last resort (and signal it's a bad location)
    console.warn('⚠️ Could not get precise location. Falling back to IP-based location.');
    result = await getIPLocation();
    if (result) {
        setLocation(result);
    } else {
        setError('Could not determine location using any method.');
    }
    
    setLoading(false);
  }, [getNavigatorLocation, getIPLocation]);

  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation || isTracking) return;

    console.log('🔄 Starting continuous location tracking...');
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
        console.log('📍 Location updated:', newLocation);
        setLocation(newLocation);
        setError(null);
      },
      (error) => {
        console.error('Tracking error:', error);
        setError(`Tracking Error: ${error.message}`);
      },
      CONTINUOUS_OPTIONS
    );
  }, [isTracking]);

  const stopLocationTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsTracking(false);
      console.log('⏹️ Location tracking stopped.');
    }
  }, []);

  useEffect(() => {
    // Initial location request
    requestPreciseLocation();
    // Cleanup on unmount
    return () => {
      stopLocationTracking();
    };
  }, [requestPreciseLocation, stopLocationTracking]);

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
