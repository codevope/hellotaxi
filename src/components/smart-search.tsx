'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Clock, 
  MapPin, 
  Star, 
  Trash2,
  Navigation
} from 'lucide-react';
import { useSmartSearch, type SmartSearchResult } from '@/hooks/use-smart-search';
import { useMap } from '@/contexts/map-context';

interface SmartSearchProps {
  onPlaceSelect: (place: SmartSearchResult) => void;
  userLocation?: { lat: number; lng: number };
  className?: string;
}

const SmartSearch: React.FC<SmartSearchProps> = ({
  onPlaceSelect,
  userLocation,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'suggestions' | 'popular' | 'recent' | 'favorites'>('suggestions');
  
  const {
    popularPlaces,
    recentPlaces,
    favoritePlaces,
    searchSuggestions,
    addToRecent,
    addToFavorites,
    removeFromFavorites,
    clearRecent
  } = useSmartSearch(userLocation);

  const handlePlaceSelect = (place: SmartSearchResult) => {
    addToRecent(place);
    onPlaceSelect(place);
  };

  const handleFavoriteToggle = (place: SmartSearchResult) => {
    const isFavorite = favoritePlaces.some(p => p.id === place.id);
    
    if (isFavorite) {
      removeFromFavorites(place.id);
    } else {
      addToFavorites(place);
    }
  };

  const renderPlaceItem = (place: SmartSearchResult, showFavoriteButton = true) => {
    const isFavorite = favoritePlaces.some(p => p.id === place.id);
    
    return (
      <div
        key={place.id}
        className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
        onClick={() => handlePlaceSelect(place)}
      >
        <div className="flex items-center space-x-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
            {place.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{place.title}</p>
            <p className="text-sm text-gray-500 truncate">{place.subtitle}</p>
            <div className="flex items-center space-x-2 mt-1">
              {place.category && (
                <Badge variant="secondary" className="text-xs">
                  {place.category}
                </Badge>
              )}
              {place.distance && (
                <span className="text-xs text-gray-400 flex items-center">
                  <Navigation className="w-3 h-3 mr-1" />
                  {place.distance}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {showFavoriteButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleFavoriteToggle(place);
            }}
            className="ml-2"
          >
            <Heart 
              className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} 
            />
          </Button>
        )}
      </div>
    );
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'suggestions':
        return <Star className="w-4 h-4" />;
      case 'popular':
        return <MapPin className="w-4 h-4" />;
      case 'recent':
        return <Clock className="w-4 h-4" />;
      case 'favorites':
        return <Heart className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getPlacesForTab = () => {
    switch (activeTab) {
      case 'suggestions':
        return searchSuggestions;
      case 'popular':
        return popularPlaces;
      case 'recent':
        return recentPlaces;
      case 'favorites':
        return favoritePlaces;
      default:
        return [];
    }
  };

  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'recent':
        return 'No has visitado ningún lugar recientemente';
      case 'favorites':
        return 'No tienes lugares favoritos guardados';
      default:
        return 'No hay lugares disponibles';
    }
  };

  const places = getPlacesForTab();

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">¿A dónde quieres ir?</CardTitle>
          {activeTab === 'recent' && recentPlaces.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearRecent}
              className="text-gray-500"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { key: 'suggestions', label: 'Sugerencias' },
            { key: 'popular', label: 'Populares' },
            { key: 'recent', label: 'Recientes' },
            { key: 'favorites', label: 'Favoritos' }
          ].map(tab => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(tab.key as any)}
              className="flex-1 flex items-center space-x-1"
            >
              {getTabIcon(tab.key)}
              <span className="hidden sm:inline">{tab.label}</span>
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="px-6 pb-6">
            {places.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>{getEmptyMessage()}</p>
              </div>
            ) : (
              <div className="space-y-1">
                {places.map(place => renderPlaceItem(place, activeTab !== 'favorites'))}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default SmartSearch;