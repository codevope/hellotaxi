'use client';

import { useEffect, useState } from 'react';
import { Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Driver } from '@/lib/types';
import { GoogleMapsProvider } from '../maps';

// Coordenadas de Chiclayo, Perú
const CHICLAYO_CENTER = {
  lat: -6.7714,
  lng: -79.8370
};

export default function AdminMap() {
  const [drivers, setDrivers] = useState<Driver[]>([]);

  useEffect(() => {
    const driversCol = collection(db, 'drivers');
    const unsubscribe = onSnapshot(driversCol, (snapshot) => {
      const fetchedDrivers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Driver));
      console.log('Drivers cargados en admin map:', fetchedDrivers.length);
      setDrivers(fetchedDrivers);
    }, (error) => {
      console.error("Error cargando conductores:", error);
    });

    return () => unsubscribe();
  }, []);

  // Filtrar conductores activos con ubicación
  const activeDrivers = drivers.filter(driver => 
    driver.location && 
    (driver.status === 'available' || driver.status === 'on-ride')
  );

  return (
    <GoogleMapsProvider>
      <div className="w-full h-full">
        <Map
          defaultCenter={CHICLAYO_CENTER}
          defaultZoom={13}
          gestureHandling="cooperative"
          disableDefaultUI={false}
          mapId="admin-dashboard-map"
        >
          {activeDrivers.map((driver) => (
            <AdvancedMarker
              key={driver.id}
              position={driver.location!}
              title={`${driver.name} - ${driver.status}`}
            >
              <Pin
                background="#1f2937"
                borderColor="#000"
                glyphColor="#fff"
              />
            </AdvancedMarker>
          ))}
        </Map>
      </div>
    </GoogleMapsProvider>
  );
}