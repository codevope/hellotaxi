'use client';

import React from 'react';
import { AdvancedMarker, InfoWindow, Pin } from '@vis.gl/react-google-maps';

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

type MarkerType = 'user' | 'pickup' | 'dropoff' | 'custom';

interface MapMarkerProps {
  position: Location;
  type?: MarkerType;
  title?: string;
  showInfoWindow?: boolean;
  onClick?: () => void;
  onInfoWindowClose?: () => void;
  customIcon?: string;
}

const MarkerConfig = {
  user: { color: '#3B82F6', emoji: '�', label: 'Tu ubicación' },
  pickup: { color: '#10B981', emoji: '🚗', label: 'Punto de recogida' },
  dropoff: { color: '#EF4444', emoji: '🏁', label: 'Destino' },
  custom: { color: '#6B7280', emoji: '📍', label: 'Ubicación' }
};

const MapMarker: React.FC<MapMarkerProps> = ({
  position,
  type = 'custom',
  title,
  showInfoWindow = false,
  onClick,
  onInfoWindowClose,
  customIcon
}) => {
  const config = MarkerConfig[type];
  
  return (
    <>
      <AdvancedMarker
        position={position}
        onClick={onClick}
        title={title}
      >
        <Pin
          background={config.color}
          borderColor={config.color}
          glyphColor="white"
        >
          <div className="text-lg">{customIcon || config.emoji}</div>
        </Pin>
      </AdvancedMarker>
      
      {showInfoWindow && (
        <InfoWindow
          position={position}
          onCloseClick={onInfoWindowClose}
          pixelOffset={[0, -40]}
        >
          <div className="p-2 min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: config.color }}
              ></div>
              <span className="font-medium text-sm">
                {title || config.label}
              </span>
            </div>
            
            {position.address ? (
              <p className="text-sm text-gray-600">{position.address}</p>
            ) : (
              <p className="text-xs text-gray-500">
                {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
              </p>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
};

export default MapMarker;