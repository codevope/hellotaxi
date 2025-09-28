
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
    const [mapCenter, setMapCenter] = useState<Location | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    useEffect(() => {
        // Step 1: Fetch the initial map center configuration
        const fetchInitialCenter = async () => {
            try {
                const settings = await getSettings();
                setMapCenter({ lat: settings.mapCenterLat, lng: settings.mapCenterLng });
            } catch (error) {
                console.error("Error fetching map settings:", error);
                // Fallback to a default center if settings fail
                setMapCenter({ lat: -12.046374, lng: -77.042793 });
            } finally {
                setIsInitialLoading(false);
            }
        };

        fetchInitialCenter();
    }, []);

    useEffect(() => {
        // Step 2: Once the map center is loaded (and only then), subscribe to driver locations
        if (isInitialLoading) return;

        const driversCol = collection(db, 'drivers');
        const unsubscribe = onSnapshot(driversCol, (snapshot) => {
            const fetchedDrivers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Driver));
            setDrivers(fetchedDrivers);
        }, (error) => {
            console.error("Error fetching drivers for map:", error);
        });

        return () => unsubscribe();
    }, [isInitialLoading]);

    if (isInitialLoading) {
        return (
            <div className="flex items-center justify-center h-full bg-muted rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <GoogleMapsProvider>
            <div className="relative w-full h-full">
                <MapView 
                    pickupLocation={null}
                    dropoffLocation={null}
                    interactive={true}
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
    );
}
