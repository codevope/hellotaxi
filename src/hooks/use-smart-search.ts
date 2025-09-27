'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './use-auth';

export interface SmartSearchResult {
  id: string;
  title: string;
  subtitle: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  type: 'popular' | 'recent' | 'favorite' | 'nearby';
  icon: string;
  category?: string;
  distance?: string;
}

export interface UseSmartSearchReturn {
  popularPlaces: SmartSearchResult[];
  recentPlaces: SmartSearchResult[];
  favoritePlaces: SmartSearchResult[];
  nearbyPlaces: SmartSearchResult[];
  searchSuggestions: SmartSearchResult[];
  addToRecent: (place: SmartSearchResult) => void;
  addToFavorites: (place: SmartSearchResult) => void;
  removeFromFavorites: (placeId: string) => void;
  clearRecent: () => void;
  searchResults: SmartSearchResult[];
  isLoading: boolean;
}

// Lugares populares predefinidos para Lima, Perú
const POPULAR_PLACES: SmartSearchResult[] = [
  {
    id: 'aeropuerto-jorge-chavez',
    title: 'Aeropuerto Jorge Chávez',
    subtitle: 'Callao, Lima',
    coordinates: { lat: -12.0219, lng: -77.1143 },
    type: 'popular',
    icon: '✈️',
    category: 'Transporte'
  },
  {
    id: 'centro-lima',
    title: 'Plaza de Armas',
    subtitle: 'Centro Histórico de Lima',
    coordinates: { lat: -12.0464, lng: -77.0428 },
    type: 'popular',
    icon: '🏛️',
    category: 'Turismo'
  },
  {
    id: 'miraflores-centro',
    title: 'Parque Kennedy',
    subtitle: 'Miraflores, Lima',
    coordinates: { lat: -12.1203, lng: -77.0308 },
    type: 'popular',
    icon: '🌳',
    category: 'Entretenimiento'
  },
  {
    id: 'san-isidro-centro',
    title: 'Centro Financiero',
    subtitle: 'San Isidro, Lima',
    coordinates: { lat: -12.0969, lng: -77.0363 },
    type: 'popular',
    icon: '🏢',
    category: 'Negocios'
  },
  {
    id: 'barranco-centro',
    title: 'Puente de los Suspiros',
    subtitle: 'Barranco, Lima',
    coordinates: { lat: -12.1464, lng: -77.0209 },
    type: 'popular',
    icon: '🌉',
    category: 'Turismo'
  },
  {
    id: 'callao-centro',
    title: 'Real Plaza Pro',
    subtitle: 'Callao, Lima',
    coordinates: { lat: -12.0546, lng: -77.1181 },
    type: 'popular',
    icon: '🛍️',
    category: 'Compras'
  },
  {
    id: 'larcomar',
    title: 'Larcomar',
    subtitle: 'Miraflores, Lima',
    coordinates: { lat: -12.1347, lng: -77.0297 },
    type: 'popular',
    icon: '🛍️',
    category: 'Compras'
  },
  {
    id: 'hospital-rebagliati',
    title: 'Hospital Rebagliati',
    subtitle: 'Jesús María, Lima',
    coordinates: { lat: -12.0858, lng: -77.0511 },
    type: 'popular',
    icon: '🏥',
    category: 'Salud'
  }
];

const LOCAL_STORAGE_KEYS = {
  RECENT_PLACES: 'hitaxi_recent_places',
  FAVORITE_PLACES: 'hitaxi_favorite_places'
} as const;

export function useSmartSearch(userLocation?: { lat: number; lng: number }): UseSmartSearchReturn {
  const { user } = useAuth();
  const [recentPlaces, setRecentPlaces] = useState<SmartSearchResult[]>([]);
  const [favoritePlaces, setFavoritePlaces] = useState<SmartSearchResult[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<SmartSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Memoizamos userLocation para evitar cambios de referencia
  const stableUserLocation = useMemo(() => {
    console.log('🗺️ useSmartSearch - Ubicación recibida:', userLocation);
    if (userLocation) {
      console.log('📍 Coordenadas exactas: lat=' + userLocation.lat + ', lng=' + userLocation.lng);
      console.log('🎯 Tu ubicación real debería ser: lat=-6.755306, lng=-79.869622');
      
      // Calcular la diferencia en metros
      if (userLocation.lat !== -6.755306 || userLocation.lng !== -79.869622) {
        const R = 6371000; // Radio en metros
        const dLat = (-6.755306 - userLocation.lat) * Math.PI / 180;
        const dLon = (-79.869622 - userLocation.lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(-6.755306 * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        console.log('⚠️ Diferencia con tu ubicación real: ' + Math.round(distance) + ' metros');
      }
    }
    return userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : undefined;
  }, [userLocation?.lat, userLocation?.lng]);

  const formatDistance = useCallback((km: number): string => {
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1)}km`;
  }, []);

  // Cargar datos guardados al inicializar
  useEffect(() => {
    try {
      const storedRecent = localStorage.getItem(LOCAL_STORAGE_KEYS.RECENT_PLACES);
      if (storedRecent) setRecentPlaces(JSON.parse(storedRecent).slice(0, 10));

      const storedFavorites = localStorage.getItem(LOCAL_STORAGE_KEYS.FAVORITE_PLACES);
      if (storedFavorites) setFavoritePlaces(JSON.parse(storedFavorites));
    } catch (error) {
      console.error('Error loading stored search data:', error);
    }
  }, []);

  const updateNearbyPlaces = useCallback((location: { lat: number; lng: number }) => {
    const placesWithDistance = POPULAR_PLACES
      .map(place => {
        const R = 6371; // km
        const dLat = (place.coordinates.lat - location.lat) * Math.PI / 180;
        const dLon = (place.coordinates.lng - location.lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(location.lat * Math.PI / 180) * Math.cos(place.coordinates.lat * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceKm = R * c;

        return {
          ...place,
          type: 'nearby' as const,
          distance: formatDistance(distanceKm),
          _distance: distanceKm
        };
      })
      .filter(place => place._distance <= 20)
      .sort((a, b) => a._distance - b._distance)
      .slice(0, 6);

    // Solo actualizamos si cambió
    setNearbyPlaces(prev => {
      const newPlaces = placesWithDistance.map(({ _distance, ...rest }) => rest);
      return JSON.stringify(prev) !== JSON.stringify(newPlaces) ? newPlaces : prev;
    });
  }, [formatDistance]);

  // Actualizar lugares cercanos cuando cambia la ubicación
  useEffect(() => {
    if (stableUserLocation) {
      updateNearbyPlaces(stableUserLocation);
    }
  }, [stableUserLocation, updateNearbyPlaces]);

  const addToRecent = useCallback((place: SmartSearchResult) => {
    setRecentPlaces(prevRecent => {
      const updatedRecent = [
        { ...place, type: 'recent' as const },
        ...prevRecent.filter(p => p.id !== place.id)
      ].slice(0, 10);

      try {
        localStorage.setItem(LOCAL_STORAGE_KEYS.RECENT_PLACES, JSON.stringify(updatedRecent));
      } catch (error) {
        console.error('Error saving recent places:', error);
      }

      return updatedRecent;
    });
  }, []);

  const addToFavorites = useCallback((place: SmartSearchResult) => {
    setFavoritePlaces(prevFavorites => {
      if (prevFavorites.some(p => p.id === place.id)) return prevFavorites;

      const updatedFavorites = [
        ...prevFavorites,
        { ...place, type: 'favorite' as const }
      ];

      try {
        localStorage.setItem(LOCAL_STORAGE_KEYS.FAVORITE_PLACES, JSON.stringify(updatedFavorites));
      } catch (error) {
        console.error('Error saving favorite places:', error);
      }

      return updatedFavorites;
    });
  }, []);

  const removeFromFavorites = useCallback((placeId: string) => {
    setFavoritePlaces(prevFavorites => {
      const updatedFavorites = prevFavorites.filter(p => p.id !== placeId);

      try {
        localStorage.setItem(LOCAL_STORAGE_KEYS.FAVORITE_PLACES, JSON.stringify(updatedFavorites));
      } catch (error) {
        console.error('Error saving favorite places:', error);
      }

      return updatedFavorites;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecentPlaces([]);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.RECENT_PLACES);
  }, []);

  // Sugerencias inteligentes combinando todos los tipos
  const searchSuggestions = useMemo(() => {
    const suggestions: SmartSearchResult[] = [];

    suggestions.push(...favoritePlaces.slice(0, 3));
    const remainingSlots = Math.max(0, 8 - suggestions.length);
    suggestions.push(...recentPlaces.slice(0, Math.min(3, remainingSlots)));
    const finalSlots = Math.max(0, 8 - suggestions.length);
    suggestions.push(...nearbyPlaces.slice(0, finalSlots));

    return suggestions;
  }, [favoritePlaces, recentPlaces, nearbyPlaces]);

  const popularPlaces = POPULAR_PLACES;
  const searchResults = searchSuggestions;

  return {
    popularPlaces,
    recentPlaces,
    favoritePlaces,
    nearbyPlaces,
    searchSuggestions,
    addToRecent,
    addToFavorites,
    removeFromFavorites,
    clearRecent,
    searchResults,
    isLoading
  };
}
