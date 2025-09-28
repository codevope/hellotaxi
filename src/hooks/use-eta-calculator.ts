
'use client';

import { useState, useCallback } from 'react';
import { estimateRideFareDeterministic } from '@/ai/flows/get-fare-estimates';
import type { FareBreakdown, ServiceType } from '@/lib/types';

export interface RouteInfo {
  distance: {
    text: string;
    value: number; // en metros
  };
  duration: {
    text: string;
    value: number; // en segundos
  };
  startAddress: string;
  endAddress: string;
  polyline?: string;
  estimatedFare?: number;
  fareBreakdown?: FareBreakdown;
}

export interface ETACalculationOptions {
  travelMode?: google.maps.TravelMode;
  serviceType: ServiceType;
}

export interface UseETACalculatorReturn {
  isCalculating: boolean;
  error: string | null;
  calculateRoute: (
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    options: ETACalculationOptions
  ) => Promise<RouteInfo | null>;
  formatDuration: (seconds: number) => string;
  formatDistance: (meters: number) => string;
}

export function useETACalculator(): UseETACalculatorReturn {
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

  const calculateRoute = useCallback(async (
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    options: ETACalculationOptions
  ): Promise<RouteInfo | null> => {
    if (!window.google?.maps) {
      setError('Google Maps no está disponible');
      return null;
    }

    setIsCalculating(true);
    setError(null);

    try {
      // 1. Obtener la ruta, distancia y duración (con tráfico) desde Google Maps
      const directionsService = new google.maps.DirectionsService();
      
      const request: google.maps.DirectionsRequest = {
        origin: new google.maps.LatLng(origin.lat, origin.lng),
        destination: new google.maps.LatLng(destination.lat, destination.lng),
        travelMode: options.travelMode || google.maps.TravelMode.DRIVING,
        drivingOptions: {
          departureTime: new Date(), // Clave para obtener la duración CON tráfico
          trafficModel: google.maps.TrafficModel.BEST_GUESS,
        },
      };

      const response = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        directionsService.route(request, (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            resolve(result);
          } else {
            reject(new Error(`Error en el cálculo de ruta de Google: ${status}`));
          }
        });
      });

      if (!response.routes?.[0]?.legs?.[0]) {
        throw new Error('No se encontró una ruta válida en la respuesta de Google');
      }

      const route = response.routes[0];
      const leg = route.legs[0];
      
      const distanceMeters = leg.distance?.value;
      const durationSeconds = leg.duration?.value; // Esta duración ya considera el tráfico

      if (distanceMeters === undefined || durationSeconds === undefined) {
          throw new Error("La respuesta de Google no incluyó distancia o duración.");
      }

      // 2. Usar esos datos precisos para alimentar nuestro algoritmo de tarifa
      const distanceKm = distanceMeters / 1000;
      const durationMinutes = durationSeconds / 60;
      const rideDate = new Date();
      // Simple check para hora punta. Se puede refinar con las reglas de settings.
      const peakTime = rideDate.getHours() >= 16 && rideDate.getHours() <= 19;

      const fareResult = await estimateRideFareDeterministic({
        distanceKm,
        durationMinutes,
        peakTime,
        serviceType: options.serviceType,
        rideDate: rideDate.toISOString(),
      });

      // 3. Ensamblar y devolver el objeto combinado
      const finalRouteInfo: RouteInfo = {
        distance: {
          text: leg.distance?.text || formatDistance(distanceMeters),
          value: distanceMeters
        },
        duration: {
          text: leg.duration?.text || formatDuration(durationSeconds),
          value: durationSeconds
        },
        startAddress: leg.start_address,
        endAddress: leg.end_address,
        estimatedFare: fareResult.estimatedFare,
        fareBreakdown: fareResult.breakdown,
      };

      return finalRouteInfo;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al calcular la ruta';
      setError(errorMessage);
      console.error('Error en calculateRoute:', err);
      return null;
    } finally {
      setIsCalculating(false);
    }
  }, [formatDistance, formatDuration]);

  return {
    isCalculating,
    error,
    calculateRoute,
    formatDuration,
    formatDistance,
  };
}
