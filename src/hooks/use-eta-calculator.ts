'use client';

import { useState, useEffect, useCallback } from 'react';

export interface RouteInfo {
  distance: {
    text: string;
    value: number; // en metros
  };
  duration: {
    text: string;
    value: number; // en segundos
  };
  durationInTraffic?: {
    text: string;
    value: number; // en segundos
  };
  startAddress: string;
  endAddress: string;
  polyline?: string;
}

export interface ETACalculationOptions {
  departureTime?: Date;
  travelMode?: google.maps.TravelMode;
  avoidHighways?: boolean;
  avoidTolls?: boolean;
}

export interface UseETACalculatorReturn {
  routeInfo: RouteInfo | null;
  isCalculating: boolean;
  error: string | null;
  calculateRoute: (
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    options?: ETACalculationOptions
  ) => Promise<RouteInfo | null>;
  formatDuration: (seconds: number) => string;
  formatDistance: (meters: number) => string;
  getTrafficStatus: (normalDuration: number, trafficDuration: number) => 'light' | 'moderate' | 'heavy';
}

export function useETACalculator(): UseETACalculatorReturn {
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDuration = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes} min`;
  }, []);

  const formatDistance = useCallback((meters: number): string => {
    if (meters < 1000) {
      return `${meters} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  }, []);

  const getTrafficStatus = useCallback((normalDuration: number, trafficDuration: number): 'light' | 'moderate' | 'heavy' => {
    const increase = (trafficDuration - normalDuration) / normalDuration;
    
    if (increase < 0.15) return 'light';     // Menos del 15% de aumento
    if (increase < 0.35) return 'moderate';  // 15-35% de aumento
    return 'heavy';                          // Más del 35% de aumento
  }, []);

  const calculateRoute = useCallback(async (
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    options: ETACalculationOptions = {}
  ): Promise<RouteInfo | null> => {
    if (!window.google?.maps) {
      setError('Google Maps no está disponible');
      return null;
    }

    setIsCalculating(true);
    setError(null);

    try {
      const directionsService = new google.maps.DirectionsService();
      
      const request: google.maps.DirectionsRequest = {
        origin: new google.maps.LatLng(origin.lat, origin.lng),
        destination: new google.maps.LatLng(destination.lat, destination.lng),
        travelMode: options.travelMode || google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
        avoidHighways: options.avoidHighways || false,
        avoidTolls: options.avoidTolls || false,
        drivingOptions: {
          departureTime: options.departureTime || new Date(),
          trafficModel: google.maps.TrafficModel.BEST_GUESS
        }
      };

      const response = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        directionsService.route(request, (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            resolve(result);
          } else {
            reject(new Error(`Error en el cálculo de ruta: ${status}`));
          }
        });
      });

      if (!response.routes?.[0]?.legs?.[0]) {
        throw new Error('No se encontró una ruta válida');
      }

      const route = response.routes[0];
      const leg = route.legs[0];

      const routeData: RouteInfo = {
        distance: {
          text: leg.distance?.text || '',
          value: leg.distance?.value || 0
        },
        duration: {
          text: leg.duration?.text || '',
          value: leg.duration?.value || 0
        },
        durationInTraffic: leg.duration_in_traffic ? {
          text: leg.duration_in_traffic.text,
          value: leg.duration_in_traffic.value
        } : undefined,
        startAddress: leg.start_address,
        endAddress: leg.end_address
      };

      setRouteInfo(routeData);
      return routeData;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al calcular la ruta';
      setError(errorMessage);
      console.error('Error calculating route:', err);
      return null;
    } finally {
      setIsCalculating(false);
    }
  }, []);

  return {
    routeInfo,
    isCalculating,
    error,
    calculateRoute,
    formatDuration,
    formatDistance,
    getTrafficStatus
  };
}