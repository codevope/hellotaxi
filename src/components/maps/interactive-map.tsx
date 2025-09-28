
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
  center: newCenter,
  zoom: initialZoom = 13,
  height = '100%',
  onMapClick,
  children,
  className = '',
  mapId = 'DEMO_MAP_ID'
}) => {
  const [isTilesLoaded, setTilesLoaded] = useState(false);
  
  // Internal state for map's viewport to allow user interaction
  const [internalCenter, setInternalCenter] = useState(newCenter);
  const [internalZoom, setInternalZoom] = useState(initialZoom);

  // Update internal state only when the external `center` prop changes meaningfully.
  useEffect(() => {
    if (newCenter && (newCenter.lat !== internalCenter?.lat || newCenter.lng !== internalCenter?.lng)) {
      setInternalCenter(newCenter);
      setInternalZoom(16); // Reset zoom when center changes programmatically
    }
  }, [newCenter, internalCenter]);
  
  const handleTilesLoaded = useCallback(() => {
    setTilesLoaded(true);
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
  
  return (
    <div
      className={className}
      style={{
        height,
        width: '100%',
        position: 'relative',
      }}
    >
       {!isTilesLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10 pointer-events-none">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Cargando mapa...</p>
          </div>
        </div>
      )}
      
      <Map
        mapId={mapId}
        center={internalCenter}
        zoom={internalZoom}
        gestureHandling="greedy"
        disableDefaultUI={false}
        onClick={handleClick}
        onTilesLoaded={handleTilesLoaded}
        onCameraChanged={(ev) => {
            setInternalZoom(ev.detail.zoom);
            setInternalCenter(ev.detail.center);
        }}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={false}
        style={{
          width: '100%',
          height: '100%',
          opacity: isTilesLoaded ? 1 : 0
        }}
      >
        {children}
      </Map>
    </div>
  );
};

export default InteractiveMap;
