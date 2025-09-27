'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Target } from 'lucide-react';
import {
  GoogleMapsProvider,
  InteractiveMap,
  MapMarker,
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

  const [mapCenter, setMapCenter] = useState<Location>(
    initialLocation ||
      userLocation?.coordinates || { lat: -12.0464, lng: -77.0428 }
  );

  const handlePlaceSelect = (location: Location) => {
    setSelectedLocation(location);
    setMapCenter(location);
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
      handlePlaceSelect(location);
    }
  };

  return (
    <GoogleMapsProvider>
      <Card className={cn('w-full mx-auto shadow-none border-0', className)}>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <PlaceAutocomplete
              onPlaceSelect={handlePlaceSelect}
              placeholder="Escribe una dirección o lugar..."
              isPickup={isPickup}
              onUseCurrentLocation={handleCurrentLocation}
            />
          </div>

          <InteractiveMap
            center={mapCenter}
            height="300px"
            zoom={15}
            className="rounded-lg border"
            mapId="LOCATION_PICKER_MAP"
          >
            {selectedLocation && (
              <MapMarker
                position={selectedLocation}
                type="custom"
                title="Ubicación seleccionada"
              />
            )}
          </InteractiveMap>

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
