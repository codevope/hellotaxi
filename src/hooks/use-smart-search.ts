'use client';

import { useState, useEffect, useMemo } from 'react';
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

  // Cargar datos guardados al inicializar
  useEffect(() => {
    loadStoredData();
  }, [user]);

  // Actualizar lugares cercanos cuando cambia la ubicación del usuario
  useEffect(() => {
    if (userLocation) {
      updateNearbyPlaces(userLocation);
    }
  }, [userLocation]);

  const loadStoredData = () => {
    try {
      // Cargar lugares recientes
      const storedRecent = localStorage.getItem(LOCAL_STORAGE_KEYS.RECENT_PLACES);
      if (storedRecent) {
        const parsed = JSON.parse(storedRecent);
        setRecentPlaces(parsed.slice(0, 10)); // Limitar a 10 más recientes
      }

      // Cargar lugares favoritos
      const storedFavorites = localStorage.getItem(LOCAL_STORAGE_KEYS.FAVORITE_PLACES);
      if (storedFavorites) {
        setFavoritePlaces(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.error('Error loading stored search data:', error);
    }
  };

  const saveToStorage = (key: string, data: SmartSearchResult[]) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${key} to storage:`, error);
    }
  };

  const calculateDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const formatDistance = (km: number): string => {
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1)}km`;
  };

  const updateNearbyPlaces = (location: { lat: number; lng: number }) => {
    const placesWithDistance = POPULAR_PLACES
      .map(place => {
        const distance = calculateDistance(
          location.lat,
          location.lng,
          place.coordinates.lat,
          place.coordinates.lng
        );
        return {
          ...place,
          type: 'nearby' as const,
          distance: formatDistance(distance),
          _distance: distance
        };
      })
      .filter(place => place._distance <= 20) // Filtrar lugares dentro de 20km
      .sort((a, b) => a._distance - b._distance)
      .slice(0, 6); // Limitar a 6 lugares cercanos

    setNearbyPlaces(placesWithDistance.map(({ _distance, ...place }) => place));
  };

  const addToRecent = (place: SmartSearchResult) => {
    const updatedRecent = [
      { ...place, type: 'recent' as const },
      ...recentPlaces.filter(p => p.id !== place.id)
    ].slice(0, 10);

    setRecentPlaces(updatedRecent);
    saveToStorage(LOCAL_STORAGE_KEYS.RECENT_PLACES, updatedRecent);
  };

  const addToFavorites = (place: SmartSearchResult) => {
    if (favoritePlaces.some(p => p.id === place.id)) return;

    const updatedFavorites = [
      ...favoritePlaces,
      { ...place, type: 'favorite' as const }
    ];

    setFavoritePlaces(updatedFavorites);
    saveToStorage(LOCAL_STORAGE_KEYS.FAVORITE_PLACES, updatedFavorites);
  };

  const removeFromFavorites = (placeId: string) => {
    const updatedFavorites = favoritePlaces.filter(p => p.id !== placeId);
    setFavoritePlaces(updatedFavorites);
    saveToStorage(LOCAL_STORAGE_KEYS.FAVORITE_PLACES, updatedFavorites);
  };

  const clearRecent = () => {
    setRecentPlaces([]);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.RECENT_PLACES);
  };

  // Sugerencias inteligentes combinando todos los tipos
  const searchSuggestions = useMemo(() => {
    const suggestions: SmartSearchResult[] = [];
    
    // Agregar favoritos primero (máxima prioridad)
    suggestions.push(...favoritePlaces.slice(0, 3));
    
    // Agregar recientes si hay espacio
    const remainingSlots = Math.max(0, 8 - suggestions.length);
    suggestions.push(...recentPlaces.slice(0, Math.min(3, remainingSlots)));
    
    // Completar con lugares cercanos si hay espacio
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