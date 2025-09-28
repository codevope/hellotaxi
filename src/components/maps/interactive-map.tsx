
'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  const lastExternalCenterRef = useRef(newCenter);
  
  // Internal state for map's viewport to allow user interaction
  const [internalCenter, setInternalCenter] = useState(newCenter);
  const [internalZoom, setInternalZoom] = useState(initialZoom);

  // Update internal state only when the external `center` prop changes meaningfully from outside
  useEffect(() => {
    if (newCenter && 
        (!lastExternalCenterRef.current || 
         (newCenter.lat !== lastExternalCenterRef.current.lat || 
          newCenter.lng !== lastExternalCenterRef.current.lng))) {
      
      lastExternalCenterRef.current = newCenter;
      setInternalCenter(newCenter);
      
      // Only reset zoom if we don't have a specific zoom prop and it's a significant change
      if (initialZoom === 13) {
        setInternalZoom(16);
      }
    }
  }, [newCenter, initialZoom]);
  
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

  const handleCameraChanged = useCallback((ev: any) => {
    // Only update internal state if the change is from user interaction
    // Don't update if we're programmatically setting the center
    const newCenter = ev.detail.center;
    const newZoom = ev.detail.zoom;
    
    // Prevent infinite loops by checking if this is really a different value
    if (newZoom !== internalZoom) {
      setInternalZoom(newZoom);
    }
    
    if (newCenter && 
        (!internalCenter || 
         newCenter.lat !== internalCenter.lat || 
         newCenter.lng !== internalCenter.lng)) {
      setInternalCenter(newCenter);
    }
  }, [internalZoom, internalCenter]);
  
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
        onCameraChanged={handleCameraChanged}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={false}
        zoomControl={true}
        scrollwheel={true}
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
