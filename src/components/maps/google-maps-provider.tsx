'use client';

import React from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';

interface GoogleMapsProviderProps {
  children: React.ReactNode;
  libraries?: string[];
}

const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({
  children,
  libraries = ['places', 'marker', 'routes', 'geocoding']
}) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg border border-red-200">
        <div className="text-center">
          <p className="text-red-600 font-medium">Error de configuración</p>
          <p className="text-sm text-red-500">Google Maps API key no configurada</p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider
      apiKey={apiKey}
      libraries={libraries}
      version="weekly"
      language="es"
      region="PE"
    >
      {children}
    </APIProvider>
  );
};

export default GoogleMapsProvider;
