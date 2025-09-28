
'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Driver, Location } from '@/lib/types';
import MapView from '@/components/map-view';
import { Loader2 } from 'lucide-react';
import { getSettings } from '@/services/settings-service';
import { GoogleMapsProvider } from '../maps';

export default function RealtimeMap() {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [mapCenter, setMapCenter] = useState<Location>({ lat: -12.046374, lng: -77.042793 }); // Default to Lima
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const settings = await getSettings();
                setMapCenter({ lat: settings.mapCenterLat, lng: settings.mapCenterLng });
            } catch (error) {
                console.error("Error fetching initial settings:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();

        const driversCol = collection(db, 'drivers');
        const unsubscribe = onSnapshot(driversCol, (snapshot) => {
            const fetchedDrivers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Driver));
            setDrivers(fetchedDrivers);
        }, (error) => {
            console.error("Error fetching drivers for map:", error);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="relative w-full h-full">
            {isLoading && (
                <div className="absolute inset-0 bg-muted/80 flex items-center justify-center z-10 rounded-lg">
                    <div className='text-center space-y-2'>
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                        <p className='text-muted-foreground'>Cargando mapa...</p>
                    </div>
                </div>
            )}
             <GoogleMapsProvider>
                <div className="relative w-full h-full">
                    <MapView 
                        pickupLocation={null}
                        dropoffLocation={null}
                        interactive={true}
                        mapCenter={mapCenter}
                    >
                        {drivers.map(driver => (
                            driver.location && (
                                <MapView.Marker
                                    key={driver.id}
                                    position={driver.location}
                                    type="driver"
                                    title={`${driver.name} - ${driver.status}`}
                                />
                            )
                        ))}
                    </MapView>
                </div>
            </GoogleMapsProvider>
        </div>
    );
}
