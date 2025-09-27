
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, X, Loader2, Navigation } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { useMap } from '@/contexts/map-context';

interface PlacePrediction {
  description: string;
  place_id: string;
}

interface AutocompleteInputProps {
  onPlaceSelect: (address: string, coordinates?: { lat: number; lng: number }) => void;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  showCurrentLocationButton?: boolean;
  disabled?: boolean;
  error?: string;
}

export default function AutocompleteInput({
  onPlaceSelect,
  placeholder,
  value = '',
  onChange,
  showCurrentLocationButton = true,
  disabled = false,
  error,
}: AutocompleteInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const places = useMapsLibrary('places');
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const geocoder = useRef<google.maps.Geocoder | null>(null);

  const { userLocation } = useMap();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (places) {
      autocompleteService.current = new places.AutocompleteService();
      geocoder.current = new places.Geocoder();
    }
  }, [places]);

  useEffect(() => {
    if (value !== inputValue) {
        setInputValue(value);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
        setPredictions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchPredictions = useCallback((input: string) => {
    if (!autocompleteService.current || input.length < 3) {
      setPredictions([]);
      return;
    }
    setIsLoading(true);
    autocompleteService.current.getPlacePredictions(
      {
        input,
        componentRestrictions: { country: 'pe' }, // Restrict to Peru
      },
      (results, status) => {
        setIsLoading(false);
        if (status === 'OK' && results) {
          setPredictions(results);
        } else {
          setPredictions([]);
        }
      }
    );
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if(onChange) onChange(newValue);
    fetchPredictions(newValue);
  };

  const handleSelectPrediction = (prediction: PlacePrediction) => {
    if (!geocoder.current) return;
    setIsLoading(true);
    geocoder.current.geocode({ placeId: prediction.place_id }, (results, status) => {
      setIsLoading(false);
      if (status === 'OK' && results && results[0].geometry) {
        const location = results[0].geometry.location;
        const address = results[0].formatted_address;
        setInputValue(address);
        setPredictions([]);
        setIsFocused(false); // Close dropdown
        if (onChange) onChange(address); // Sync form state
        onPlaceSelect(address, { lat: location.lat(), lng: location.lng() });
      } else {
        // Fallback for safety
        setInputValue(prediction.description);
        setIsFocused(false);
        onPlaceSelect(prediction.description, undefined);
      }
    });
  };

  const handleCurrentLocationSelect = () => {
    if (userLocation) {
        const address = 'Mi ubicación actual';
        setInputValue(address);
        setPredictions([]);
        setIsFocused(false);
        if (onChange) onChange(address);
        onPlaceSelect(address, userLocation.coordinates);
    }
  };

  const handleClear = () => {
    setInputValue('');
    if(onChange) onChange('');
    setPredictions([]);
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10 pr-10"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
          {inputValue && !isLoading && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {isFocused && (predictions.length > 0 || (showCurrentLocationButton && userLocation)) && (
        <Card className="absolute z-50 w-full mt-1 shadow-lg">
          <CardContent className="p-2">
            {showCurrentLocationButton && userLocation && (
                <div
                    className="flex items-center gap-3 p-3 hover:bg-accent rounded-md cursor-pointer"
                    onClick={handleCurrentLocationSelect}
                >
                    <Navigation className="h-5 w-5 text-primary" />
                    <div>
                        <p className="font-semibold">Usar mi ubicación actual</p>
                        <p className="text-sm text-muted-foreground">Cerca de tu ubicación</p>
                    </div>
                </div>
            )}
            {predictions.map((p) => (
              <div
                key={p.place_id}
                className="flex items-center gap-3 p-3 hover:bg-accent rounded-md cursor-pointer"
                onClick={() => handleSelectPrediction(p)}
              >
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm">{p.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {error && <p className="text-sm text-destructive mt-1">{error}</p>}
    </div>
  );
}
