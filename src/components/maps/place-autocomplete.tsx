'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2, X } from 'lucide-react';
import { Button } from '../ui/button';

interface PlaceAutocompleteProps {
  onPlaceSelect: (place: google.maps.places.PlaceResult | null) => void;
  placeholder?: string;
  className?: string;
  defaultValue?: string;
}

export const PlaceAutocomplete = ({
  onPlaceSelect,
  placeholder = 'Buscar una dirección...',
  className,
  defaultValue = '',
}: PlaceAutocompleteProps) => {
  const [placeAutocomplete, setPlaceAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const places = useMapsLibrary('places');

  useEffect(() => {
    if (!places || !inputRef.current) return;

    const options = {
      fields: ['geometry', 'name', 'formatted_address', 'place_id'],
      componentRestrictions: { country: 'pe' }, // Restringir a Perú
    };
    
    const autocomplete = new places.Autocomplete(inputRef.current, options);
    setPlaceAutocomplete(autocomplete);
    
    // Clear listeners on cleanup
    return () => {
        if (autocomplete) {
            google.maps.event.clearInstanceListeners(autocomplete);
        }
    }
  }, [places]);

  useEffect(() => {
    if (!placeAutocomplete) return;

    const listener = placeAutocomplete.addListener('place_changed', () => {
      onPlaceSelect(placeAutocomplete.getPlace());
    });

    return () => {
        if(listener) {
            google.maps.event.removeListener(listener);
        }
    }
  }, [onPlaceSelect, placeAutocomplete]);

  return (
    <div className={cn("relative", className)}>
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input ref={inputRef} placeholder={placeholder} className="pl-10"/>
    </div>
  );
};
