'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Navigation, MapPin } from 'lucide-react';
import { useGeolocation } from '@/hooks/use-geolocation-improved';
import { useMap } from '@/contexts/map-context';
import type { Ride } from '@/lib/types';
import { 
  GoogleMapsProvider, 
  InteractiveMap, 
  MapMarker,
  RouteDisplay,
  type Location 
} from './maps';

interface MapViewProps {
  pickupLocation?: Location;
  dropoffLocation?: Location;
  onLocationSelect?: (location: Location, type: 'pickup' | 'dropoff') => void;
  activeRide?: Ride | null;
  className?: string;
  height?: string;
  interactive?: boolean;
}

const MapView: React.FC<MapViewProps> = ({
  pickupLocation: propPickupLocation,
  dropoffLocation: propDropoffLocation,
  onLocationSelect,
  activeRide,
  className = '',
  height = '100%',
  interactive = true
}) => {
  const { location: userLocation, error: locationError, requestLocation, loading } = useGeolocation();
  const { 
    pickupLocation: contextPickupLocation,
    dropoffLocation: contextDropoffLocation,
    mapCenter,
    setPickupLocation,
    setDropoffLocation,
    setMapCenter,
    requestPreciseLocation,
    startLocationTracking,
    stopLocationTracking,
    locationAccuracy,
    locationSource
  } = useMap();
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);

  // Usar ubicaciones del contexto si no se proporcionan como props
  const pickupLocation = propPickupLocation || (contextPickupLocation ? {
    lat: contextPickupLocation.coordinates.lat,
    lng: contextPickupLocation.coordinates.lng,
    address: contextPickupLocation.address
  } : undefined);

  const dropoffLocation = propDropoffLocation || (contextDropoffLocation ? {
    lat: contextDropoffLocation.coordinates.lat,
    lng: contextDropoffLocation.coordinates.lng,
    address: contextDropoffLocation.address
  } : undefined);

  // Solicitar ubicación automáticamente al montar el componente
  React.useEffect(() => {
    if (!userLocation && !locationError) {
      requestLocation();
    }
  }, [userLocation, locationError]);

  // Actualizar centro del mapa cuando el usuario obtenga su ubicación
  React.useEffect(() => {
    if (userLocation && !pickupLocation && !dropoffLocation) {
      const newCenter = {
        lat: userLocation.latitude,
        lng: userLocation.longitude
      };
      setMapCenter(newCenter);
    }
  }, [userLocation, pickupLocation, dropoffLocation, setMapCenter]);

  // Convertir ubicación del usuario al formato Location
  const userPos: Location | undefined = userLocation ? {
    lat: userLocation.latitude,
    lng: userLocation.longitude,
    address: 'Tu ubicación actual'
  } : undefined;

  const handleMapClick = (location: Location) => {
    if (!interactive) return;
    
    // Convertir Location a MapLocation para el contexto
    const mapLocation = {
      coordinates: {
        lat: location.lat,
        lng: location.lng
      },
      address: location.address || `${location.lat}, ${location.lng}`
    };
    
    // Determinar qué tipo de ubicación establecer basado en el estado actual
    if (!pickupLocation) {
      setPickupLocation(mapLocation);
      if (onLocationSelect) {
        onLocationSelect(location, 'pickup');
      }
    } else if (!dropoffLocation) {
      setDropoffLocation(mapLocation);
      if (onLocationSelect) {
        onLocationSelect(location, 'dropoff');
      }
    }
  };

  const handleMarkerClick = (type: string) => {
    setSelectedMarker(selectedMarker === type ? null : type);
  };

  return (
    <GoogleMapsProvider>
      <div className={`relative ${className}`} style={{ minHeight: height }}>
        <InteractiveMap
          center={mapCenter}
          height={height}
          zoom={14}
          onMapClick={interactive ? handleMapClick : undefined}
        >
          {/* Ubicación del usuario */}
          {userPos && (
            <MapMarker
              position={userPos}
              type="user"
              showInfoWindow={selectedMarker === 'user'}
              onClick={() => handleMarkerClick('user')}
              onInfoWindowClose={() => setSelectedMarker(null)}
            />
          )}

          {/* Punto de recogida */}
          {pickupLocation && (
            <MapMarker
              position={pickupLocation}
              type="pickup"
              showInfoWindow={selectedMarker === 'pickup'}
              onClick={() => handleMarkerClick('pickup')}
              onInfoWindowClose={() => setSelectedMarker(null)}
            />
          )}

          {/* Punto de destino */}
          {dropoffLocation && (
            <MapMarker
              position={dropoffLocation}
              type="dropoff"
              showInfoWindow={selectedMarker === 'dropoff'}
              onClick={() => handleMarkerClick('dropoff')}
              onInfoWindowClose={() => setSelectedMarker(null)}
            />
          )}

          {/* Ruta entre pickup y dropoff */}
          {pickupLocation && dropoffLocation && (
            <RouteDisplay
              origin={pickupLocation}
              destination={dropoffLocation}
              onRouteCalculated={(route) => {
                console.log('Route calculated:', route);
                // Aquí se puede agregar lógica adicional como mostrar ETA
              }}
              onError={(error) => {
                console.error('Route error:', error);
              }}
            />
          )}
        </InteractiveMap>

        {/* Botones para encontrar ubicación */}
        <div className="absolute top-2 right-2 space-y-2">
          {/* Botón ubicación precisa */}
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              console.log('🎯 Solicitando ubicación ULTRA PRECISA como Google Maps...');
              requestPreciseLocation();
            }}
            disabled={loading}
            className="shadow-lg bg-white hover:bg-gray-50 text-gray-700 border"
            title="📍 Ubicación precisa (múltiples fuentes)"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            ) : (
              <Navigation className="h-4 w-4" />
            )}
          </Button>
          
          {/* Botón tracking continuo */}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              console.log('🔄 Iniciando tracking continuo...');
              startLocationTracking();
            }}
            className="shadow-lg bg-white hover:bg-gray-50 text-gray-700 border"
            title="🔄 Tracking continuo"
          >
            📡
          </Button>
        </div>

        {/* Información de estado */}
        <div className="absolute bottom-2 left-2 space-y-1">
          {/* Info de precisión y fuente */}
          {locationAccuracy && locationSource && (
            <div className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded border border-blue-200 max-w-xs">
              📍 Fuente: {locationSource} | Precisión: {locationAccuracy < 1000 ? `${Math.round(locationAccuracy)}m` : `${(locationAccuracy/1000).toFixed(1)}km`}
            </div>
          )}
          
          {locationError && (
            <div className="bg-red-50 text-red-600 text-xs px-2 py-1 rounded border border-red-200">
              <MapPin className="h-3 w-3 inline mr-1" />
              Error de geolocalización
            </div>
          )}
          
          {userPos && (
            <div className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded border border-blue-200">
              <MapPin className="h-3 w-3 inline mr-1" />
              Ubicación detectada
            </div>
          )}
        </div>
      </div>
    </GoogleMapsProvider>
  );
};

export default MapView;