

'use client';

import React, { useState, useEffect, Children, isValidElement } from 'react';
import { useGeolocation } from '@/hooks/use-geolocation-improved';
import type { Ride, Location } from '@/lib/types';
import {
  GoogleMapsProvider,
  InteractiveMap,
  MapMarker,
  RouteDisplay,
} from './maps';
import { GeocodingService } from '@/services/geocoding-service';
import { useToast } from '@/hooks/use-toast';

interface MapViewProps {
  onLocationSelect?: (location: Location, type: 'pickup' | 'dropoff') => void;
  pickupLocation: Location | null;
  dropoffLocation: Location | null;
  driverLocation?: Location | null;
  className?: string;
  height?: string;
  interactive?: boolean;
  children?: React.ReactNode;
  mapCenter?: Location;
}

const MapView: React.FC<MapViewProps> & { Marker: typeof MapMarker } = ({
  onLocationSelect,
  pickupLocation,
  dropoffLocation,
  driverLocation,
  className = '',
  height = '100%',
  interactive = true,
  children,
  mapCenter: initialMapCenter
}) => {
  const { location: userLocation, requestLocation, loading } = useGeolocation();
  const { toast } = useToast();
  
  const [mapCenter, setMapCenter] = useState<Location>(initialMapCenter || { lat: -12.046374, lng: -77.042793 }); // Default to Lima
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);

  useEffect(() => {
    if(initialMapCenter) {
      setMapCenter(initialMapCenter);
    } else if (!userLocation && !loading) {
      requestLocation();
    } else if (userLocation) {
      setMapCenter({
        lat: userLocation.latitude,
        lng: userLocation.longitude,
      });
    }
  }, [userLocation, loading, requestLocation, initialMapCenter]);

  useEffect(() => {
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
    if (!interactive || !onLocationSelect) return;

    try {
        const geocodedAddress = await GeocodingService.reverseGeocode(location.lat, location.lng);
        const mapLocation = {
            lat: location.lat,
            lng: location.lng,
            address: geocodedAddress,
        };

        if (!pickupLocation) {
            onLocationSelect(mapLocation, 'pickup');
        } else if (!dropoffLocation) {
            onLocationSelect(mapLocation, 'dropoff');
        } else {
             onLocationSelect(mapLocation, 'pickup');
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
            onLocationSelect(fallbackLocation, 'pickup');
        } else if (!dropoffLocation) {
            onLocationSelect(fallbackLocation, 'dropoff');
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
          {userPos && !driverLocation && (
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

           {driverLocation && (
            <MapMarker
              position={driverLocation}
              type="driver"
              title="Conductor"
            />
          )}

          {pickupLocation && dropoffLocation && (
            <RouteDisplay
              origin={pickupLocation}
              destination={dropoffLocation}
            />
          )}

          {Children.map(children, (child) => {
              if (isValidElement(child)) {
                  // This allows passing Marker components as children
                  return React.cloneElement(child);
              }
              return null;
          })}

        </InteractiveMap>
      </div>
    </GoogleMapsProvider>
  );
};


MapView.Marker = MapMarker;

export default MapView;
