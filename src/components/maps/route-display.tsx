
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
        strokeColor: '#2563EB', // Azul oscuro, igual que el fondo de la tarjeta ETA
        strokeOpacity: 0.9,
        strokeWeight: 6, // Un poco más grueso para destacar
        zIndex: 50, // Asegurarse de que esté por encima de otros elementos del mapa
        icons: [
            {
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    strokeColor: '#2563EB',
                    strokeWeight: 4,
                    fillColor: 'white',
                    fillOpacity: 1,
                },
                offset: '0%',
            },
            {
                icon: {
                    path: google.maps.SymbolPath.CIRCLE, // Círculo también al final
                    scale: 8,
                    strokeColor: '#2563EB',
                    strokeWeight: 4,
                    fillColor: 'white',
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
    // Log inicial para debugging
    console.log('🗺️ RouteDisplay useEffect ejecutado:', {
      hasDirectionsService: !!directionsService,
      hasDirectionsRenderer: !!directionsRenderer,
      origin,
      destination
    });

    if (!directionsService || !directionsRenderer || !origin || !destination) {
      // Clear existing route
      if (directionsRenderer) {
        directionsRenderer.setMap(null);
        directionsRenderer.setMap(map);
      }
      
      if (!origin) console.warn('⚠️ No hay ubicación de origen');
      if (!destination) console.warn('⚠️ No hay ubicación de destino');
      
      return;
    }

    // Validar coordenadas
    const isValidLat = (lat: number) => lat >= -90 && lat <= 90;
    const isValidLng = (lng: number) => lng >= -180 && lng <= 180;

    if (!isValidLat(origin.lat) || !isValidLng(origin.lng)) {
      console.error('❌ Coordenadas de origen inválidas:', origin);
      if (onError) {
        onError('Las coordenadas de origen son inválidas');
      }
      return;
    }

    if (!isValidLat(destination.lat) || !isValidLng(destination.lng)) {
      console.error('❌ Coordenadas de destino inválidas:', destination);
      if (onError) {
        onError('Las coordenadas de destino son inválidas');
      }
      return;
    }

    // Verificar que los puntos no sean idénticos o muy cercanos
    const distance = Math.sqrt(
      Math.pow(destination.lat - origin.lat, 2) + 
      Math.pow(destination.lng - origin.lng, 2)
    );

    const distanceInKm = distance * 111; // Aproximadamente 111 km por grado

    console.log('📏 Distancia calculada entre puntos:', {
      distance,
      distanceInKm: distanceInKm.toFixed(2) + ' km'
    });

    if (distance < 0.0001) { // Aproximadamente 11 metros
      console.error('❌ Los puntos de origen y destino están muy cerca o son idénticos:', {
        origin,
        destination,
        distanceInMeters: (distance * 111000).toFixed(2)
      });
      if (onError) {
        onError('El origen y destino deben estar más separados (mínimo 50 metros)');
      }
      return;
    }

    console.log('✅ Calculando ruta de Google Maps:', {
      origin: { 
        lat: origin.lat, 
        lng: origin.lng
      },
      destination: { 
        lat: destination.lat, 
        lng: destination.lng
      }
    });

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
        console.log('Ruta calculada exitosamente:', result);
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
        let errorMessage = 'No se pudo calcular la ruta';
        
        switch (status) {
          case 'ZERO_RESULTS':
            errorMessage = 'No se encontró ninguna ruta entre estos puntos. Verifica que ambas ubicaciones sean accesibles por carretera.';
            console.error('ZERO_RESULTS - No hay ruta disponible entre:', {
              origin: { lat: origin.lat, lng: origin.lng },
              destination: { lat: destination.lat, lng: destination.lng }
            });
            break;
          case 'NOT_FOUND':
            errorMessage = 'Una o ambas ubicaciones no se pudieron encontrar';
            break;
          case 'INVALID_REQUEST':
            errorMessage = 'La solicitud de ruta es inválida';
            break;
          case 'OVER_QUERY_LIMIT':
            errorMessage = 'Se ha excedido el límite de consultas de la API';
            break;
          case 'REQUEST_DENIED':
            errorMessage = 'Acceso denegado a la API de direcciones';
            break;
          case 'UNKNOWN_ERROR':
            errorMessage = 'Error desconocido al calcular la ruta. Intenta nuevamente.';
            break;
          default:
            errorMessage = `Error: ${status}`;
        }
        
        console.error('Error calculating route:', status, errorMessage);
        if (onError) {
          onError(errorMessage);
        }
      }
    });
  }, [directionsService, directionsRenderer, origin, destination, map, onRouteCalculated, onError]);

  return null; // Este componente no renderiza JSX, solo maneja la lógica de rutas
};

export default RouteDisplay;
