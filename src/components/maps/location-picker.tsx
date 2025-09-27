'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Target } from 'lucide-react';
import { 
  GoogleMapsProvider, 
  InteractiveMap, 
  MapMarker, 
  PlaceAutocomplete,
  type Location 
} from './';

interface LocationPickerProps {
  onLocationSelect: (location: Location) => void;
  onCancel?: () => void;
  title?: string;
  initialLocation?: Location;
  restrictions?: {
    country?: string[];
    types?: string[];
  };
  className?: string;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  onCancel,
  title = "Seleccionar ubicación",
  initialLocation,
  restrictions = { country: ['PE'] },
  className = ''
}) => {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(initialLocation || null);
  const [mapCenter, setMapCenter] = useState<Location>(
    initialLocation || { lat: -12.0464, lng: -77.0428, address: 'Lima, Perú' }
  );

  const handlePlaceSelect = (location: Location) => {
    setSelectedLocation(location);
    setMapCenter(location);
  };

  const handleMapClick = (location: Location) => {
    setSelectedLocation(location);
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
    }
  };

  const handleCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: 'Ubicación actual'
          };
          setSelectedLocation(location);
          setMapCenter(location);
        },
        (error) => {
          console.error('Error al obtener ubicación:', error);
        }
      );
    }
  };

  return (
    <GoogleMapsProvider>
      <Card className={`w-full max-w-2xl mx-auto ${className}`}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-500" />
            {title}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Buscador de lugares */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Buscar por dirección
            </label>
            <PlaceAutocomplete
              onPlaceSelect={handlePlaceSelect}
              placeholder="Escribe una dirección o lugar..."
              restrictions={restrictions}
            />
          </div>

          {/* Botón de ubicación actual */}
          <Button
            type="button"
            variant="outline"
            onClick={handleCurrentLocation}
            className="w-full flex items-center gap-2"
          >
            <Navigation className="h-4 w-4" />
            Usar mi ubicación actual
          </Button>

          {/* Mapa interactivo */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              O selecciona en el mapa
            </label>
            
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
                  showInfoWindow={true}
                />
              )}
            </InteractiveMap>
          </div>

          {/* Información de la ubicación seleccionada */}
          {selectedLocation && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-900">
                    Ubicación seleccionada
                  </p>
                  {selectedLocation.address ? (
                    <p className="text-sm text-blue-700 break-words">
                      {selectedLocation.address}
                    </p>
                  ) : (
                    <p className="text-xs text-blue-600">
                      {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleConfirm}
              disabled={!selectedLocation}
              className="flex-1"
            >
              Confirmar ubicación
            </Button>
            
            {onCancel && (
              <Button
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
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