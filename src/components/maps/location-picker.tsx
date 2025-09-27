'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Target } from 'lucide-react';
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
  title?: string;
  initialLocation?: { lat: number; lng: number };
  className?: string;
  isPickup?: boolean;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  onCancel,
  title = 'Seleccionar ubicación',
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
  const { userLocation, geocodeAddress } = useMap();

  const [mapCenter, setMapCenter] = useState<Location>(
    initialLocation ||
      userLocation?.coordinates || { lat: -12.0464, lng: -77.0428 }
  );

  const handlePlaceSelect = (location: Location) => {
    setSelectedLocation(location);
    setMapCenter(location);
  };

  const handleMapClick = async (location: Location) => {
    const geocodedLocation = await geocodeAddress(location);
    if (geocodedLocation) {
      setSelectedLocation(geocodedLocation);
    }
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
      setSelectedLocation(location);
      setMapCenter(location);
    }
  };

  return (
    <GoogleMapsProvider libraries={['places', 'geocoding']}>
      <Card className={cn('w-full mx-auto', className)}>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Buscar por dirección
            </label>
            <PlaceAutocomplete
              onPlaceSelect={handlePlaceSelect}
              placeholder="Escribe una dirección o lugar..."
              isPickup={isPickup}
            />
          </div>

          <InteractiveMap
            center={mapCenter}
            height="300px"
            zoom={15}
            onMapClick={handleMapClick}
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
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-900">
                    Ubicación seleccionada
                  </p>
                  <p className="text-sm text-blue-700 break-words">
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
