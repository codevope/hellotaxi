
'use client';

import React, { useEffect, useState } from 'react';
import { useMap as useGoogleMap, useMapsLibrary } from '@vis.gl/react-google-maps';

interface Location {
  lat: number;
  lng: number;
}

interface RouteDisplayProps {
  origin: Location | null;
  destination: Location | null;
  onRouteCalculated?: (route: google.maps.DirectionsResult) => void;
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

  // Initialize services
  useEffect(() => {
    if (!routesLibrary || !map) return;

    const service = new routesLibrary.DirectionsService();
    const renderer = new routesLibrary.DirectionsRenderer({
      map: map,
      suppressMarkers: true, // No mostrar marcadores por defecto, usamos los nuestros
      polylineOptions: {
        strokeColor: '#00A3FF', // Un azul más eléctrico y vibrante
        strokeOpacity: 0.9,
        strokeWeight: 6, // Un poco más grueso para destacar
        zIndex: 50, // Asegurarse de que esté por encima de otros elementos del mapa
        icons: [
            {
                // Un círculo en el punto de inicio
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    strokeColor: '#00A3FF',
                    strokeWeight: 4,
                    fillColor: 'white',
                    fillOpacity: 1,
                },
                offset: '0%',
            },
            {
                // Una flecha en el punto final para indicar la dirección
                icon: {
                    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                    scale: 4,
                    strokeColor: '#00A3FF',
                    fillColor: '#00A3FF',
                    fillOpacity: 1,
                },
                offset: '100%',
            }
        ]
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

    directionsService.route(request, (result, status) => {
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
        
        if (onRouteCalculated) {
          onRouteCalculated(result);
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
