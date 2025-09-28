
'use client';

import React, { useState, useEffect } from 'react';
import { useGeolocation } from '@/hooks/use-geolocation-improved';
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
import { useMapStore } from '@/stores/map-store'; // Importando el store

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
  const { location: userLocation, requestLocation, loading } = useGeolocation();
  const { toast } = useToast();
  
  // Usando el store de Zustand en lugar de estado local
  const { 
    pickupLocation,
    dropoffLocation,
    mapCenter,
    setPickupLocation,
    setDropoffLocation,
    setUserLocation,
  } = useMapStore();

  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);

  useEffect(() => {
    if (!userLocation && !loading) {
      requestLocation();
    }
    if (userLocation) {
      setUserLocation({
        coordinates: { lat: userLocation.latitude, lng: userLocation.longitude },
        address: userLocation.address || 'Tu ubicación actual',
      });
    }
  }, [userLocation, loading, requestLocation, setUserLocation]);

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
        
      </div>
    </GoogleMapsProvider>
  );
};

export default MapView;
