'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import type { Ride, Driver, User } from '@/lib/types';
import { Loader2 } from 'lucide-react';

type EnrichedRide = Omit<Ride, 'driver' | 'passenger'> & { driver: Driver; passenger: User };

async function getRides(): Promise<EnrichedRide[]> {
  const ridesCol = collection(db, 'rides');
  const rideSnapshot = await getDocs(ridesCol);
  const ridesList = rideSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ride));

  const enrichedRides: EnrichedRide[] = [];

  for (const ride of ridesList) {
    let driver: Driver | null = null;
    let passenger: User | null = null;

    if (ride.driver && typeof ride.driver.path === 'string') {
        const driverSnap = await getDoc(doc(db, ride.driver.path));
        if (driverSnap.exists()) {
            driver = { id: driverSnap.id, ...driverSnap.data() } as Driver;
        }
    }

    if (ride.passenger && typeof ride.passenger.path === 'string') {
        const passengerSnap = await getDoc(doc(db, ride.passenger.path));
        if (passengerSnap.exists()) {
            passenger = { id: passengerSnap.id, ...passengerSnap.data() } as User;
        }
    }
    
    if (driver && passenger) {
        enrichedRides.push({ ...ride, driver, passenger });
    }
  }

  return enrichedRides.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export default function RideHistory() {
  const [rides, setRides] = useState<EnrichedRide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRides() {
        try {
            const fetchedRides = await getRides();
            setRides(fetchedRides);
        } catch (error) {
            console.error("Error fetching ride history:", error);
        } finally {
            setLoading(false);
        }
    }
    loadRides();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!rides.length) {
    return (
      <p className="text-muted-foreground text-center">No se encontraron viajes anteriores.</p>
    );
  }

  return (
    <ScrollArea className="h-96">
      <div className="space-y-4 pr-4">
        {rides.map((ride) => (
          <Card key={ride.id}>
            <CardHeader className="flex flex-row items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium">
                  {new Date(ride.date).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {ride.pickup.substring(0, 20)}... &rarr;{' '}
                  {ride.dropoff.substring(0, 20)}...
                </p>
              </div>
              <p className="font-bold text-lg">S/{ride.fare.toFixed(2)}</p>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={ride.driver.avatarUrl} alt={ride.driver.name} />
                <AvatarFallback>{ride.driver.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                con {ride.driver.name}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
