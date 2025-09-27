
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

  React.useEffect(() => {
    if (!userLocation && !locationError) {
      requestLocation();
    }
  }, [userLocation, locationError, requestLocation]);

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
          {userPos && (
            <MapMarker
              position={userPos}
              type="user"
              showInfoWindow={selectedMarker === 'user'}
              onClick={() => handleMarkerClick('user')}
              onInfoWindowClose={() => setSelectedMarker(null)}
            />
          )}

          {pickupLocationForMarker && (
            <MapMarker
              position={pickupLocationForMarker}
              type="pickup"
              showInfoWindow={selectedMarker === 'pickup'}
              onClick={() => handleMarkerClick('pickup')}
              onInfoWindowClose={() => setSelectedMarker(null)}
            />
          )}

          {dropoffLocationForMarker && (
            <MapMarker
              position={dropoffLocationForMarker}
              type="dropoff"
              showInfoWindow={selectedMarker === 'dropoff'}
              onClick={() => handleMarkerClick('dropoff')}
              onInfoWindowClose={() => setSelectedMarker(null)}
            />
          )}

          {pickupLocationForMarker && dropoffLocationForMarker && (
            <RouteDisplay
              origin={pickupLocationForMarker}
              destination={dropoffLocationForMarker}
              onRouteCalculated={(route) => {
                
              }}
              onError={(error) => {
                console.error('Route error:', error);
              }}
            />
          )}
        </InteractiveMap>

        <div className="absolute top-2 right-2 space-y-2">
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

        <div className="absolute bottom-2 left-2 space-y-1">
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
