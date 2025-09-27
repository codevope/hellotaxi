'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Map } from '@vis.gl/react-google-maps';
import type { MapMouseEvent } from '@vis.gl/react-google-maps';

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface InteractiveMapProps {
  center?: Location;
  zoom?: number;
  height?: string;
  onMapClick?: (location: Location) => void;
  children?: React.ReactNode;
  className?: string;
  mapId?: string;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({
  center = { lat: -12.0464, lng: -77.0428 },
  zoom = 13,
  height = '100%',
  onMapClick,
  children,
  className = '',
  mapId = 'DEMO_MAP_ID'
}) => {
  const [isLoading, setIsLoading] = useState(true);

  const handleMapLoad = useCallback(() => {
    setIsLoading(false);
    setTimeout(() => {
      if (window.google && window.google.maps) {
        window.google.maps.event.trigger(window, 'resize');
      }
    }, 100);
  }, []);

  const handleClick = useCallback(
    (event: MapMouseEvent) => {
      if (event.detail.latLng && onMapClick) {
        const lat = event.detail.latLng.lat;
        const lng = event.detail.latLng.lng;
        onMapClick({ lat, lng });
      }
    },
    [onMapClick]
  );

  useEffect(() => {
    const handleResize = () => {
      if (window.google && window.google.maps) {
        window.google.maps.event.trigger(window, 'resize');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      className={`relative rounded-lg ${className}`}
      style={{
        height,
        width: '100%',
        minWidth: '100%',
        flex: 1
      }}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Cargando mapa...</p>
          </div>
        </div>
      )}

      <Map
        mapId={mapId}
        defaultCenter={center}
        defaultZoom={zoom}
        gestureHandling="greedy"
        disableDefaultUI={false}
        onClick={handleClick}
        onTilesLoaded={handleMapLoad}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={false}
        style={{
          width: '100%',
          height: '100%',
          flex: 1
        }}
      >
        {children}
      </Map>
    </div>
  );
};

export default InteractiveMap;
