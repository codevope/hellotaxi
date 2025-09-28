
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
                // Fetch initial map center from settings
                const settings = await getSettings();
                setMapCenter({ lat: settings.mapCenterLat, lng: settings.mapCenterLng });

                // Set up the realtime listener for drivers
                const driversCol = collection(db, 'drivers');
                const unsubscribe = onSnapshot(driversCol, (snapshot) => {
                    const fetchedDrivers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Driver));
                    setDrivers(fetchedDrivers);
                    // Stop loading once we have the first batch of data
                    setIsLoading(false); 
                }, (error) => {
                    console.error("Error fetching drivers for map:", error);
                    setIsLoading(false); // Stop loading even on error
                });

                // Return unsubscribe function for cleanup
                return unsubscribe;
            } catch (error) {
                console.error("Error fetching initial settings:", error);
                setIsLoading(false); // Stop loading if settings fail
            }
        };

        const unsubscribePromise = fetchInitialData();

        return () => {
            unsubscribePromise.then(unsubscribe => {
                if (unsubscribe) {
                    unsubscribe();
                }
            });
        };
    }, []);

    return (
        <div className="relative w-full h-full">
            {isLoading && (
                <div className="absolute inset-0 bg-muted/80 flex items-center justify-center z-10 rounded-lg">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
