
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
import { GeocodingService } from '@/services/geocoding-service';
import { useToast } from '@/hooks/use-toast';

interface MapViewProps {
  onLocationSelect?: (location: Location, type: 'pickup' | 'dropoff') => void;
  activeRide?: Ride | null;
  className?: string;
  height?: string;
  interactive?: boolean;
}

const MapView: React.FC<MapViewProps> = ({
  onLocationSelect,
  activeRide,
  className = '',
  height = '100%',
  interactive = true
}) => {
  const { location: userLocation, error: locationError, requestLocation, loading } = useGeolocation();
  const { 
    pickupLocation,
    dropoffLocation,
    mapCenter,
    setPickupLocation,
    setDropoffLocation,
    setMapCenter,
    requestPreciseLocation,
    startLocationTracking,
    locationAccuracy,
    locationSource
  } = useMap();
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const { toast } = useToast();

  // Solicitar ubicación automáticamente al montar el componente
  React.useEffect(() => {
    if (!userLocation && !locationError) {
      requestLocation();
    }
  }, [userLocation, locationError, requestLocation]);

  // Convertir ubicación del usuario al formato Location
  const userPos: Location | undefined = userLocation ? {
    lat: userLocation.latitude,
    lng: userLocation.longitude,
    address: 'Tu ubicación actual'
  } : undefined;

  const handleMapClick = async (location: Location) => {
    if (!interactive) return;

    try {
        const geocoded = await GeocodingService.reverseGeocode(location.lat, location.lng);
        const mapLocation = {
            coordinates: { lat: geocoded.lat, lng: geocoded.lng },
            address: geocoded.formattedAddress,
            placeId: geocoded.placeId,
        };

        if (!pickupLocation) {
            setPickupLocation(mapLocation);
        } else if (!dropoffLocation) {
            setDropoffLocation(mapLocation);
        } else {
             // Si ambos están seleccionados, el siguiente clic resetea y elige el pickup.
             setDropoffLocation(null);
             setPickupLocation(mapLocation);
        }

    } catch (error) {
        console.error("Error en geocodificación inversa:", error);
        toast({
            variant: "destructive",
            title: "Error de ubicación",
            description: "No se pudo obtener la dirección para el punto seleccionado.",
        });
        
        // Fallback a coordenadas si la geocodificación falla
        const fallbackLocation = {
          coordinates: { lat: location.lat, lng: location.lng },
          address: `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
        };
        if (!pickupLocation) {
            setPickupLocation(fallbackLocation);
        } else if (!dropoffLocation) {
            setDropoffLocation(fallbackLocation);
        }
    }
  };

  const handleMarkerClick = (type: string) => {
    setSelectedMarker(selectedMarker === type ? null : type);
  };
  
  const pickupLocationForMarker: Location | undefined = pickupLocation ? { ...pickupLocation.coordinates, address: pickupLocation.address } : undefined;
  const dropoffLocationForMarker: Location | undefined = dropoffLocation ? { ...dropoffLocation.coordinates, address: dropoffLocation.address } : undefined;


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
          {pickupLocationForMarker && (
            <MapMarker
              position={pickupLocationForMarker}
              type="pickup"
              showInfoWindow={selectedMarker === 'pickup'}
              onClick={() => handleMarkerClick('pickup')}
              onInfoWindowClose={() => setSelectedMarker(null)}
            />
          )}

          {/* Punto de destino */}
          {dropoffLocationForMarker && (
            <MapMarker
              position={dropoffLocationForMarker}
              type="dropoff"
              showInfoWindow={selectedMarker === 'dropoff'}
              onClick={() => handleMarkerClick('dropoff')}
              onInfoWindowClose={() => setSelectedMarker(null)}
            />
          )}

          {/* Ruta entre pickup y dropoff */}
          {pickupLocationForMarker && dropoffLocationForMarker && (
            <RouteDisplay
              origin={pickupLocationForMarker}
              destination={dropoffLocationForMarker}
              onRouteCalculated={(route) => {
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
