'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Loader2, X } from 'lucide-react';
import { useMap } from '@/contexts/map-context';
import { PlaceAutocomplete } from './maps';
import { useSmartSearch, type SmartSearchResult } from '@/hooks/use-smart-search';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface AutocompleteInputProps {
  onPlaceSelect: (address: string, coordinates?: { lat: number; lng: number }) => void;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  showCurrentLocationButton?: boolean;
  showSmartSearch?: boolean;
  disabled?: boolean;
  error?: string;
}

export default function AutocompleteInput({
  onPlaceSelect,
  placeholder,
  value = '',
  onChange,
  showCurrentLocationButton = true,
  showSmartSearch = true,
  disabled = false,
  error,
}: AutocompleteInputProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const { userLocation } = useMap();
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    searchSuggestions,
    addToRecent
  } = useSmartSearch(
    userLocation?.coordinates ? {
      lat: userLocation.coordinates.lat,
      lng: userLocation.coordinates.lng
    } : undefined
  );

  // Manejar clicks fuera del componente
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle current location button
  const handleCurrentLocation = useCallback(() => {
    if (!userLocation) return;
    
    setIsLoading(true);
    try {
      const address = 'Mi ubicación actual';
      const coordinates = userLocation.coordinates;
      
      onPlaceSelect(address, coordinates);
      
      // Update input value if onChange is provided
      if (onChange) {
        onChange(address);
      }
    } catch (err) {
      console.error('Error setting current location:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userLocation]);

  // Handle place selection from Google Places API
  const handlePlaceSelect = useCallback((location: { lat: number; lng: number; address?: string; placeId?: string }) => {
    const coordinates = {
      lat: location.lat,
      lng: location.lng
    };
    
    const address = location.address || 'Ubicación seleccionada';
    onPlaceSelect(address, coordinates);
    
    // Update input value if onChange is provided
    if (onChange) {
      onChange(address);
    }
    
    setShowSuggestions(false);
  }, []);

  // Handle place selection from smart search
  const handleSmartSearchSelect = useCallback((place: SmartSearchResult) => {
    const address = place.title;
    const coordinates = place.coordinates;
    
    addToRecent(place);
    onPlaceSelect(address, coordinates);
    
    if (onChange) {
      onChange(address);
    }
    
    setShowSuggestions(false);
    setIsFocused(false);
  }, []);

  // Handle input focus
  const handleInputFocus = () => {
    setIsFocused(true);
    if (showSmartSearch && (!value || value.trim() === '')) {
      setShowSuggestions(true);
    }
  };

  // Handle input change
  const handleInputChange = (newValue: string) => {
    if (onChange) {
      onChange(newValue);
    }
    
    // Ocultar sugerencias cuando hay texto
    if (newValue.trim() !== '') {
      setShowSuggestions(false);
    } else if (showSmartSearch && isFocused) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className="space-y-2" ref={containerRef}>
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <PlaceAutocomplete
            onPlaceSelect={handlePlaceSelect}
            placeholder={placeholder || 'Ingresa una dirección'}
            value={value}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            disabled={disabled || isLoading}
            restrictions={{
              country: ['PE'] // Restricción a Perú
            }}
            className="pl-10"
          />
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
        </div>

        {showCurrentLocationButton && userLocation && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleCurrentLocation}
            disabled={isLoading || disabled}
            title="Usar mi ubicación actual"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
      
      {/* Smart Search Suggestions */}
      {showSuggestions && showSmartSearch && searchSuggestions.length > 0 && (
        <Card className="absolute z-50 w-full mt-1 shadow-lg">
          <CardContent className="p-0">
            <ScrollArea className="max-h-[300px]">
              <div className="p-2">
                <div className="text-xs text-gray-500 px-2 py-1 border-b mb-2">
                  Sugerencias para ti
                </div>
                {searchSuggestions.slice(0, 6).map(place => (
                  <div
                    key={place.id}
                    className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                    onClick={() => handleSmartSearchSelect(place)}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">
                      {place.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{place.title}</p>
                      <p className="text-xs text-gray-500 truncate">{place.subtitle}</p>
                      {(place.distance || place.category) && (
                        <div className="flex items-center space-x-1 mt-1">
                          {place.category && (
                            <Badge variant="secondary" className="text-xs px-1 py-0">
                              {place.category}
                            </Badge>
                          )}
                          {place.distance && (
                            <span className="text-xs text-gray-400">{place.distance}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
      
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
