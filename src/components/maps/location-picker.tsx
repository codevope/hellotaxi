
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Navigation, Loader2 } from 'lucide-react';
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
import { GeocodingService } from '@/services/geocoding-service';


interface LocationPickerProps {
  onLocationSelect: (location: Location) => void;
  onCancel?: () => void;
  initialLocation?: Location | null;
  className?: string;
  isPickup?: boolean;
}

const COOLDOWN_SECONDS = 5; // Tiempo de cooldown después de obtener ubicación

const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  onCancel,
  initialLocation,
  className = '',
  isPickup = false,
}) => {
  const [selectedLocation, setSelectedLocation] =
    useState<Location | null>(initialLocation || null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const { location: userLocation, requestLocation, loading: isLoadingLocation, error } = useGeolocation();
  const { toast } = useToast();
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Efecto para reaccionar a la nueva ubicación del hook
  useEffect(() => {
    if (userLocation && isLoadingLocation === false) {
      const geocodeAndUpdate = async () => {
        try {
          const address = await GeocodingService.reverseGeocode(userLocation.latitude, userLocation.longitude);
          setSelectedLocation({
            lat: userLocation.latitude,
            lng: userLocation.longitude,
            address: address,
          });
          
          // Iniciar cooldown después de obtener ubicación exitosamente
          startCooldown();
        } catch (geocodingError) {
           toast({
            variant: 'destructive',
            title: 'Error de Geocodificación',
            description: 'No se pudo obtener la dirección para tu ubicación.',
          });
          setSelectedLocation({
            lat: userLocation.latitude,
            lng: userLocation.longitude,
            address: `Coords: ${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`,
          });
          
          // Iniciar cooldown incluso si falla la geocodificación
          startCooldown();
        }
      }
      geocodeAndUpdate();
    }
  }, [userLocation, isLoadingLocation, toast]);
  

  useEffect(() => {
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Ubicación no disponible',
        description: 'No pudimos obtener tu ubicación actual. Asegúrate de tener los permisos activados.',
      });
    }
  }, [error, toast]);


  const handlePlaceSelect = (location: Location) => {
    setSelectedLocation(location);
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
    }
  };

  // Función para iniciar el cooldown
  const startCooldown = () => {
    setCooldownRemaining(COOLDOWN_SECONDS);
    
    // Limpiar timer anterior si existe
    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current);
    }
    
    // Crear nuevo timer que decrementa cada segundo
    cooldownTimerRef.current = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          if (cooldownTimerRef.current) {
            clearInterval(cooldownTimerRef.current);
            cooldownTimerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }
    };
  }, []);

  const handleCurrentLocation = () => {
    // Llama al hook para forzar una nueva lectura de alta precisión.
    // El useEffect se encargará de actualizar el estado cuando la tenga.
    requestLocation();
  };

  const isButtonDisabled = isLoadingLocation || cooldownRemaining > 0;

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
                disabled={isButtonDisabled}
              >
                {isLoadingLocation ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Navigation className="mr-2 h-4 w-4" />
                )}
                {isLoadingLocation 
                  ? 'Obteniendo ubicación...' 
                  : cooldownRemaining > 0 
                    ? `Espera ${cooldownRemaining}s...`
                    : 'Usar mi ubicación actual'
                }
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
