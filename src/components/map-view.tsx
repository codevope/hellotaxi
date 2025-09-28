
'use client';

import React, { useState, useEffect } from 'react';
import { useGeolocation } from '@/hooks/use-geolocation-improved';
import type { Ride } from '@/lib/types';
import {
  GoogleMapsProvider,
  InteractiveMap,
  MapMarker,
  RouteDisplay,
  type Location,
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
  const { location: userLocation, requestLocation, loading } = useGeolocation();
  const { toast } = useToast();
  
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<Location | null>(null);
  const [mapCenter, setMapCenter] = useState<Location>({ lat: -12.046374, lng: -77.042793 }); // Default to Lima
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);

  useEffect(() => {
    if (!userLocation && !loading) {
      requestLocation();
    }
    if (userLocation) {
      setMapCenter({
        lat: userLocation.latitude,
        lng: userLocation.longitude,
      });
    }
  }, [userLocation, loading, requestLocation]);

  useEffect(() => {
    // When a location is selected, center the map on it
    if(pickupLocation && !dropoffLocation) {
        setMapCenter(pickupLocation);
    } else if (dropoffLocation) {
        setMapCenter(dropoffLocation);
    }
  }, [pickupLocation, dropoffLocation]);


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
            lat: geocoded.lat,
            lng: geocoded.lng,
            address: geocoded.formattedAddress,
        };

        if (!pickupLocation) {
            setPickupLocation(mapLocation);
            if(onLocationSelect) onLocationSelect(mapLocation, 'pickup');

        } else if (!dropoffLocation) {
            setDropoffLocation(mapLocation);
            if(onLocationSelect) onLocationSelect(mapLocation, 'dropoff');
        } else {
             setDropoffLocation(null);
             setPickupLocation(mapLocation);
             if(onLocationSelect) onLocationSelect(mapLocation, 'pickup');
        }

    } catch (error) {
        console.error("Error en geocodificación inversa:", error);
        toast({
            variant: "destructive",
            title: "Error de ubicación",
            description: "No se pudo obtener la dirección para el punto seleccionado.",
        });
        
        const fallbackLocation = {
          lat: location.lat,
          lng: location.lng,
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

          {pickupLocation && (
            <MapMarker
              position={pickupLocation}
              type="pickup"
              showInfoWindow={selectedMarker === 'pickup'}
              onClick={() => handleMarkerClick('pickup')}
              onInfoWindowClose={() => setSelectedMarker(null)}
            />
          )}

          {dropoffLocation && (
            <MapMarker
              position={dropoffLocation}
              type="dropoff"
              showInfoWindow={selectedMarker === 'dropoff'}
              onClick={() => handleMarkerClick('dropoff')}
              onInfoWindowClose={() => setSelectedMarker(null)}
            />
          )}

          {pickupLocation && dropoffLocation && (
            <RouteDisplay
              origin={pickupLocation}
              destination={dropoffLocation}
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
