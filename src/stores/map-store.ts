
'use client';

import { create } from 'zustand';
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

export interface MapState {
  userLocation: MapLocation | null;
  pickupLocation: MapLocation | null;
  dropoffLocation: MapLocation | null;
  mapCenter: { lat: number; lng: number };
  mapZoom: number;
}

export interface MapActions {
  setUserLocation: (location: MapLocation | null) => void;
  setPickupLocation: (location: MapLocation | null) => void;
  setDropoffLocation: (location: MapLocation | null) => void;
  setMapCenter: (center: { lat: number; lng: number }) => void;
  setMapZoom: (zoom: number) => void;
  clearRideLocations: () => void;
  geocodeAddress: (addressOrCoords: string | { lat: number; lng: number }) => Promise<MapLocation | null>;
}

// Default center (Chiclayo, Perú)
const DEFAULT_CENTER = { lat: -6.7713, lng: -79.8442 };

export const useMapStore = create<MapState & MapActions>((set, get) => ({
  userLocation: null,
  pickupLocation: null,
  dropoffLocation: null,
  mapCenter: DEFAULT_CENTER,
  mapZoom: 13,
  
  setUserLocation: (location) => {
    set({ userLocation: location });
    // Center map on user only if no ride locations are set
    if (!get().pickupLocation && !get().dropoffLocation) {
        if(location) {
            set({ mapCenter: location.coordinates, mapZoom: 15 });
        }
    }
  },

  setPickupLocation: (location) => {
    set({ pickupLocation: location });
    if (location) {
      set({ mapCenter: location.coordinates, mapZoom: 16 });
    }
  },

  setDropoffLocation: (location) => {
    set({ dropoffLocation: location });
    if (location) {
      set({ mapCenter: location.coordinates, mapZoom: 16 });
    }
  },

  setMapCenter: (center) => set({ mapCenter: center }),
  setMapZoom: (zoom) => set({ mapZoom: zoom }),

  clearRideLocations: () => {
    set({ pickupLocation: null, dropoffLocation: null });
    const userLocation = get().userLocation;
    if (userLocation) {
      set({ mapCenter: userLocation.coordinates, mapZoom: 15 });
    } else {
      set({ mapCenter: DEFAULT_CENTER, mapZoom: 13 });
    }
  },

  geocodeAddress: async (addressOrCoords) => {
    try {
      let result: GeocodingResult;
      if (typeof addressOrCoords === 'string') {
        result = await GeocodingService.geocodeAddress(addressOrCoords);
      } else {
        result = await GeocodingService.reverseGeocode(addressOrCoords.lat, addressOrCoords.lng);
      }
      
      return {
        coordinates: { lat: result.lat, lng: result.lng },
        address: result.formattedAddress,
        placeId: result.placeId,
      };
    } catch (error) {
      console.error('Geocoding error in store:', error);
      return null;
    }
  },
}));

// Initialize geolocation hook and sync with store
export const useInitializeMapStore = () => {
  const { location, requestPreciseLocation } = useGoogleGeolocation();
  const setUserLocation = useMapStore(state => state.setUserLocation);

  // Effect to request location on mount
  React.useEffect(() => {
    requestPreciseLocation();
  }, [requestPreciseLocation]);
  
  // Effect to sync geolocation with store
  React.useEffect(() => {
    if (location) {
      setUserLocation({
        coordinates: { lat: location.latitude, lng: location.longitude },
        address: 'Mi ubicación actual'
      });
    }
  }, [location, setUserLocation]);
};
