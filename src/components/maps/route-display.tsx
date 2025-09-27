'use client';

import React, { useEffect, useState } from 'react';
import { useMap as useGoogleMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { useETACalculator, type RouteInfo } from '@/hooks/use-eta-calculator';

interface Location {
  lat: number;
  lng: number;
}

interface RouteDisplayProps {
  origin: Location | null;
  destination: Location | null;
  onRouteCalculated?: (route: google.maps.DirectionsResult, routeInfo?: RouteInfo) => void;
  onError?: (error: string) => void;
}

const RouteDisplay: React.FC<RouteDisplayProps> = ({
  origin,
  destination,
  onRouteCalculated,
  onError
}) => {
  const map = useGoogleMap();
  const routesLibrary = useMapsLibrary('routes');
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const { calculateRoute } = useETACalculator();

  // Initialize services
  useEffect(() => {
    if (!routesLibrary || !map) return;

    const service = new routesLibrary.DirectionsService();
    const renderer = new routesLibrary.DirectionsRenderer({
      map: map,
      suppressMarkers: true, // No mostrar marcadores por defecto, usamos los nuestros
      polylineOptions: {
        strokeColor: '#1976D2', // Azul estilo Uber
        strokeOpacity: 0.8,
        strokeWeight: 5,
        zIndex: 1
      },
      panel: null
    });

    setDirectionsService(service);
    setDirectionsRenderer(renderer);

    return () => {
      renderer.setMap(null);
    };
  }, [routesLibrary, map]);

  // Calculate and display route
  useEffect(() => {
    if (!directionsService || !directionsRenderer || !origin || !destination) {
      // Clear existing route
      if (directionsRenderer) {
        directionsRenderer.setMap(null);
        directionsRenderer.setMap(map);
      }
      return;
    }

    const request: google.maps.DirectionsRequest = {
      origin: new google.maps.LatLng(origin.lat, origin.lng),
      destination: new google.maps.LatLng(destination.lat, destination.lng),
      travelMode: google.maps.TravelMode.DRIVING,
      avoidHighways: false,
      avoidTolls: false,
      optimizeWaypoints: true,
      language: 'es',
      region: 'PE'
    };

    directionsService.route(request, async (result, status) => {
      if (status === 'OK' && result) {
        directionsRenderer.setDirections(result);
        
        // Ajustar el mapa para mostrar toda la ruta
        if (map && result.routes[0]) {
          const bounds = new google.maps.LatLngBounds();
          const route = result.routes[0];
          
          // Agregar todos los puntos de la ruta a los bounds
          route.legs.forEach(leg => {
            bounds.extend(leg.start_location);
            bounds.extend(leg.end_location);
            leg.steps.forEach(step => {
              step.path.forEach(point => bounds.extend(point));
            });
          });
          
          map.fitBounds(bounds, 50); // Padding simple
        }
        
        // Calcular información detallada de ETA con tráfico
        let routeInfo: RouteInfo | null = null;
        try {
          routeInfo = await calculateRoute(origin, destination, {
            departureTime: new Date(),
            travelMode: google.maps.TravelMode.DRIVING
          });
        } catch (error) {
          console.error('Error calculating ETA:', error);
        }
        
        if (onRouteCalculated) {
          onRouteCalculated(result, routeInfo || undefined);
        }
      } else {
        console.error('Error calculating route:', status);
        if (onError) {
          onError(`No se pudo calcular la ruta: ${status}`);
        }
      }
    });
  }, [directionsService, directionsRenderer, origin, destination, map, onRouteCalculated, onError]);

  return null; // Este componente no renderiza JSX, solo maneja la lógica de rutas
};

export default RouteDisplay;