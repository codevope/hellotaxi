
'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Navigation } from 'lucide-react';
import {
  GoogleMapsProvider,
  PlaceAutocomplete,
  type Location,
  InteractiveMap,
  MapMarker,
} from './';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useGeolocation } from '@/hooks/use-geolocation-improved';

interface LocationPickerProps {
  onLocationSelect: (location: Location) => void;
  onCancel?: () => void;
  initialLocation?: Location | null;
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
    useState<Location | null>(initialLocation);
  const { location: userLocation, requestLocation: requestGeoLocation } = useGeolocation();
  const { toast } = useToast();

  const handlePlaceSelect = (location: Location) => {
    setSelectedLocation(location);
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
    }
  };

  const handleCurrentLocation = () => {
    if (userLocation) {
      const location: Location = {
        lat: userLocation.latitude,
        lng: userLocation.longitude,
        address: userLocation.address || 'Mi ubicación actual',
      };
      // Directamente confirma esta selección
      onLocationSelect(location);
    } else {
        requestGeoLocation();
        toast({
            variant: "destructive",
            title: "Ubicación no disponible",
            description: "No pudimos obtener tu ubicación actual. Asegúrate de tener los permisos activados.",
        })
    }
  };

  return (
    <GoogleMapsProvider libraries={['places', 'geocoding', 'marker']}>
      <Card className={cn('w-full mx-auto shadow-none border-0', className)}>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <PlaceAutocomplete
              onPlaceSelect={handlePlaceSelect}
              placeholder="Escribe una dirección o lugar..."
              isPickup={isPickup}
              defaultValue={selectedLocation?.address}
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

          <div className="h-48 w-full bg-muted rounded-lg overflow-hidden border">
             {selectedLocation ? (
                 <InteractiveMap
                    center={selectedLocation}
                    zoom={16}
                 >
                     <MapMarker
                        position={selectedLocation}
                        type={isPickup ? 'pickup' : 'dropoff'}
                     />
                 </InteractiveMap>
             ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    El mapa aparecerá aquí
                </div>
             )}
          </div>

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
