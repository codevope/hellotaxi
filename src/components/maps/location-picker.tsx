
'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Navigation } from 'lucide-react';
import {
  GoogleMapsProvider,
  PlaceAutocomplete,
  type Location,
} from './';
import { useMap } from '@/contexts/map-context';
import { cn } from '@/lib/utils';

interface LocationPickerProps {
  onLocationSelect: (location: Location) => void;
  onCancel?: () => void;
  initialLocation?: { lat: number; lng: number };
  className?: string;
  isPickup?: boolean;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  onCancel,
  initialLocation,
  className = '',
  isPickup = false,
}) => {
  const [selectedLocation, setSelectedLocation] =
    useState<Location | null>(
      initialLocation
        ? { ...initialLocation, address: 'Ubicación seleccionada' }
        : null
    );
  const { userLocation } = useMap();

  const handlePlaceSelect = (location: Location) => {
    setSelectedLocation(location);
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
    }
  };

  const handleCurrentLocation = () => {
    if (userLocation?.coordinates) {
      const location: Location = {
        lat: userLocation.coordinates.lat,
        lng: userLocation.coordinates.lng,
        address: 'Mi ubicación actual',
      };
      // Directamente confirma esta selección
      onLocationSelect(location);
    }
  };

  return (
    <GoogleMapsProvider libraries={['places', 'geocoding']}>
      <Card className={cn('w-full mx-auto shadow-none border-0', className)}>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <PlaceAutocomplete
              onPlaceSelect={handlePlaceSelect}
              placeholder="Escribe una dirección o lugar..."
              isPickup={isPickup}
              onUseCurrentLocation={handleCurrentLocation}
            />
            {isPickup && (
              <Button
                variant="outline"
                className="w-full justify-center"
                onClick={handleCurrentLocation}
              >
                <Navigation className="mr-2 h-4 w-4" />
                Usar mi ubicación actual
              </Button>
            )}
          </div>

          {selectedLocation && (
            <div className="p-3 bg-muted rounded-lg border">
              <div className="flex items-start gap-2">
                <Target className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    Ubicación seleccionada
                  </p>
                  <p className="text-sm text-muted-foreground break-words">
                    {selectedLocation.address}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleConfirm}
              disabled={!selectedLocation}
              className="flex-1"
            >
              Confirmar ubicación
            </Button>

            {onCancel && (
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancelar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </GoogleMapsProvider>
  );
};

export default LocationPicker;
