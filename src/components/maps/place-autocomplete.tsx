'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, X, Loader2 } from 'lucide-react';

interface Location {
  lat: number;
  lng: number;
  address?: string;
  placeId?: string;
}

interface PlaceAutocompleteProps {
  onPlaceSelect: (location: Location) => void;
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  restrictions?: {
    country?: string[];
    types?: string[];
  };
  disabled?: boolean;
}

const PlaceAutocomplete: React.FC<PlaceAutocompleteProps> = ({
  onPlaceSelect,
  placeholder = "Buscar ubicación...",
  className = "",
  value,
  onChange,
  onFocus,
  restrictions,
  disabled = false
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Cargar la librería de Places
  const places = useMapsLibrary('places');

  // Sincronizar con prop value
  useEffect(() => {
    if (value !== undefined && value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);

  React.useEffect(() => {
    if (!places || !inputRef.current) return;

    try {
      const options: google.maps.places.AutocompleteOptions = {
        fields: ['place_id', 'geometry', 'name', 'formatted_address', 'address_components'],
        componentRestrictions: restrictions?.country ? { country: restrictions.country } : undefined,
        types: restrictions?.types || ['establishment', 'geocode']
      };

      autocompleteRef.current = new places.Autocomplete(inputRef.current, options);

      const listener = autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        
        if (place?.geometry?.location) {
          setIsLoading(true);
          setError(null);
          
          try {
            const location: Location = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              address: place.formatted_address || place.name || '',
              placeId: place.place_id
            };

            setInputValue(location.address || '');
            
            // Llamar onChange si está disponible
            if (onChange) {
              onChange(location.address || '');
            }
            
            onPlaceSelect(location);
          } catch (err) {
            setError('Error al procesar la ubicación seleccionada');
            console.error('Error processing place:', err);
          } finally {
            setIsLoading(false);
          }
        } else {
          setError('No se pudo obtener la ubicación para el lugar seleccionado');
        }
      });

      return () => {
        if (listener) {
          google.maps.event.removeListener(listener);
        }
      };
    } catch (err) {
      setError('Error al inicializar el autocompletado');
      console.error('Error initializing autocomplete:', err);
    }
  }, [places, onPlaceSelect, onChange, restrictions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Limpiar error cuando el usuario empiece a escribir
    if (error) {
      setError(null);
    }
    
    // Llamar onChange si está disponible
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleClear = () => {
    setInputValue('');
    setError(null);
    if (onChange) {
      onChange('');
    }
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permitir que Enter active el autocompletado
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const handleFocus = () => {
    if (onFocus) {
      onFocus();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={`pl-10 pr-10 ${error ? 'border-red-500' : ''}`}
          disabled={isLoading || disabled}
        />
        
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          )}
          
          {inputValue && !isLoading && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 w-6 p-0 hover:bg-gray-100"
              tabIndex={-1}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};

export default PlaceAutocomplete;