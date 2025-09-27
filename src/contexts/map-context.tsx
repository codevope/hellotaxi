
'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { GeocodingService, type GeocodingResult } from '@/services/geocoding-service';
import { useGoogleGeolocation } from '@/hooks/use-google-geolocation';

export interface MapLocation {
  coordinates: {
    lat: number;
    lng: number;
  };
  address: string;
  placeId?: string;
}

export interface MapContextType {
  // User location
  userLocation: MapLocation | null;
  isLocationLoading: boolean;
  locationAccuracy: number | null;
  locationSource: string | null;
  
  // Ride locations
  pickupLocation: MapLocation | null;
  dropoffLocation: MapLocation | null;
  
  // Map state
  mapCenter: { lat: number; lng: number };
  mapZoom: number;
  
  // Actions
  setPickupLocation: (location: MapLocation | null, centerMap?: boolean) => void;
  setDropoffLocation: (location: MapLocation | null, centerMap?: boolean) => void;
  setMapCenter: (center: { lat: number; lng: number }) => void;
  setMapZoom: (zoom: number) => void;
  geocodeAddress: (addressOrCoords: string | { lat: number; lng: number }) => Promise<MapLocation | null>;
  clearRideLocations: () => void;
  calculateDistance: () => number | null;
  
  // Location actions
  requestPreciseLocation: () => void;
  startLocationTracking: () => void;
  stopLocationTracking: () => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

// Default center (Chiclayo, Perú)
const DEFAULT_CENTER = { lat: -6.7713, lng: -79.8442 };

interface MapProviderProps {
  children: React.ReactNode;
}

export function MapProvider({ children }: MapProviderProps) {
  const { 
    location: geoLocation, 
    loading: geoLoading,
    accuracy,
    source,
    requestPreciseLocation,
    startLocationTracking,
    stopLocationTracking
  } = useGoogleGeolocation();
  
  const [pickupLocation, setPickupLocationState] = useState<MapLocation | null>(null);
  const [dropoffLocation, setDropoffLocationState] = useState<MapLocation | null>(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(13);

  // Create user location from geolocation
  const userLocation: MapLocation | null = geoLocation 
    ? {
        coordinates: {
          lat: geoLocation.latitude,
          lng: geoLocation.longitude,
        },
        address: 'Mi ubicación actual',
      }
    : null;

  // Auto-center map on user location when first available
  React.useEffect(() => {
    if (userLocation && !pickupLocation && !dropoffLocation) {
      // Solo centrar si no hay otras ubicaciones establecidas
      const isDefaultCenter = mapCenter.lat === DEFAULT_CENTER.lat && mapCenter.lng === DEFAULT_CENTER.lng;
      if (isDefaultCenter) {
        setMapCenter(userLocation.coordinates);
        setMapZoom(15); // Zoom más cercano para la ubicación del usuario
      }
    }
  }, [userLocation, pickupLocation, dropoffLocation, mapCenter.lat, mapCenter.lng]);

  const geocodeAddress = useCallback(async (addressOrCoords: string | { lat: number; lng: number }): Promise<MapLocation | null> => {
    try {
      let result: GeocodingResult;
      if (typeof addressOrCoords === 'string') {
        result = await GeocodingService.geocodeAddress(addressOrCoords);
      } else {
        result = await GeocodingService.reverseGeocode(addressOrCoords.lat, addressOrCoords.lng);
      }
      
      return {
        coordinates: {
          lat: result.lat,
          lng: result.lng,
        },
        address: result.formattedAddress,
        placeId: result.placeId,
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }, []);
  
  const setPickupLocation = useCallback((location: MapLocation | null, centerMap: boolean = true) => {
    setPickupLocationState(location);
    if (location && centerMap) {
      setMapCenter(location.coordinates);
      setMapZoom(16);
    }
  }, []);

  const setDropoffLocation = useCallback((location: MapLocation | null, centerMap: boolean = true) => {
    setDropoffLocationState(location);
    if (location && centerMap) {
      setMapCenter(location.coordinates);
      setMapZoom(16);
    }
  }, []);

  const clearRideLocations = useCallback(() => {
    setPickupLocationState(null);
    setDropoffLocationState(null);
    if (userLocation) {
      setMapCenter(userLocation.coordinates);
      setMapZoom(16);
    } else {
      setMapCenter(DEFAULT_CENTER);
      setMapZoom(13);
    }
  }, [userLocation]);

  const calculateDistance = useCallback((): number | null => {
    if (!pickupLocation || !dropoffLocation) return null;
    
    return GeocodingService.calculateDistance(
      pickupLocation.coordinates.lat,
      pickupLocation.coordinates.lng,
      dropoffLocation.coordinates.lat,
      dropoffLocation.coordinates.lng
    );
  }, [pickupLocation, dropoffLocation]);

  const contextValue: MapContextType = {
    userLocation,
    isLocationLoading: geoLoading,
    locationAccuracy: accuracy,
    locationSource: source,
    pickupLocation,
    dropoffLocation,
    mapCenter,
    mapZoom,
    setPickupLocation,
    setDropoffLocation,
    setMapCenter,
    setMapZoom,
    geocodeAddress,
    clearRideLocations,
    calculateDistance,
    requestPreciseLocation,
    startLocationTracking,
    stopLocationTracking,
  };

  return (
    <MapContext.Provider value={contextValue}>
      {children}
    </MapContext.Provider>
  );
}

export function useMap() {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
}
