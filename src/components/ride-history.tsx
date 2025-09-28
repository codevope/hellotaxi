
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, query, where, getDoc } from 'firebase/firestore';
import type { Ride, Driver, User } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { format } from 'date-fns';

type EnrichedRide = Omit<Ride, 'driver' | 'passenger'> & { driver: Driver; passenger: User };

const statusConfig = {
  completed: { label: 'Completado', variant: 'secondary' },
  'in-progress': { label: 'En Progreso', variant: 'default' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
};


export default function RideHistory() {
  const [rides, setRides] = useState<EnrichedRide[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function getRidesForUser(userId: string): Promise<EnrichedRide[]> {
      const userDocRef = doc(db, 'users', userId);
      const ridesCol = collection(db, 'rides');
      const q = query(ridesCol, where('passenger', '==', userDocRef));
      
      const rideSnapshot = await getDocs(q);
      const ridesList = rideSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ride));
      
      const enrichedRides: EnrichedRide[] = [];

      for (const ride of ridesList) {
        let driver: Driver | null = null;
        const passenger = (await getDoc(ride.passenger)).data() as User; // We already have the user

        if (ride.driver && typeof ride.driver.path === 'string') {
            const driverSnap = await getDoc(doc(db, ride.driver.path));
            if (driverSnap.exists()) {
                driver = { id: driverSnap.id, ...driverSnap.data() } as Driver;
            }
        }
        
        if (driver && passenger) {
            enrichedRides.push({ ...ride, driver, passenger });
        }
      }

      return enrichedRides.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    
    async function loadRides() {
        if (!user) {
            setLoading(false);
            return;
        };

        try {
            const fetchedRides = await getRidesForUser(user.uid);
            setRides(fetchedRides);
        } catch (error) {
            console.error("Error fetching ride history:", error);
        } finally {
            setLoading(false);
        }
    }
    loadRides();
  }, [user]);

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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ruta</TableHead>
            <TableHead>Conductor</TableHead>
            <TableHead className="text-right">Tarifa</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rides.map((ride) => (
            <TableRow key={ride.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium truncate max-w-[150px]">{ride.pickup}</span>
                  <span className="text-muted-foreground truncate max-w-[150px]">&rarr; {ride.dropoff}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={ride.driver.avatarUrl} alt={ride.driver.name} />
                    <AvatarFallback>{ride.driver.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{ride.driver.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-right font-bold text-primary">S/{ride.fare.toFixed(2)}</TableCell>
              <TableCell>
                <Badge variant={statusConfig[ride.status].variant}>
                  {statusConfig[ride.status].label}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
