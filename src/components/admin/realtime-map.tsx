
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
    const [mapCenter, setMapCenter] = useState<Location>({ lat: -12.046374, lng: -77.042793 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInitialCenter = async () => {
            const settings = await getSettings();
            setMapCenter({ lat: settings.mapCenterLat, lng: settings.mapCenterLng });
        };
        fetchInitialCenter();

        const driversCol = collection(db, 'drivers');
        const unsubscribe = onSnapshot(driversCol, (snapshot) => {
            const fetchedDrivers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Driver));
            setDrivers(fetchedDrivers);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-muted">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <GoogleMapsProvider>
            <div className="relative w-full h-full bg-gray-300 rounded-lg overflow-hidden">
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
