'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical, Loader2, User, UserCog } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Ride, Driver, User as AppUser } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, query, where, DocumentReference } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import Link from 'next/link';

type EnrichedRide = Omit<Ride, 'driver' | 'passenger'> & { driver: Driver; passenger: AppUser };

async function getCancelledRides(): Promise<EnrichedRide[]> {
  const ridesCol = collection(db, 'rides');
  const q = query(ridesCol, where('status', '==', 'cancelled'));
  const rideSnapshot = await getDocs(q);
  const ridesList = rideSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ride));

  const enrichedRides: EnrichedRide[] = [];

  for (const ride of ridesList) {
    let driver: Driver | null = null;
    let passenger: AppUser | null = null;

    if (ride.driver && ride.driver instanceof DocumentReference) {
        const driverSnap = await getDoc(ride.driver);
        if (driverSnap.exists()) {
            driver = { id: driverSnap.id, ...driverSnap.data() } as Driver;
        }
    }

    if (ride.passenger && ride.passenger instanceof DocumentReference) {
        const passengerSnap = await getDoc(ride.passenger);
        if (passengerSnap.exists()) {
            passenger = { id: passengerSnap.id, ...passengerSnap.data() } as AppUser;
        }
    }
    
    if (driver && passenger) {
        enrichedRides.push({ ...ride, driver, passenger });
    }
  }

  return enrichedRides.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

const cancelledByConfig = {
    passenger: {
        label: 'Pasajero',
        icon: <User className="h-4 w-4" />
    },
    driver: {
        label: 'Conductor',
        icon: <UserCog className="h-4 w-4" />
    },
    system: {
        label: 'Sistema',
        icon: <UserCog className="h-4 w-4" />
    }
}

export default function CancellationsTable() {
  const [rides, setRides] = useState<EnrichedRide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRides() {
        try {
            const fetchedRides = await getCancelledRides();
            setRides(fetchedRides);
        } catch (error) {
            console.error("Error fetching cancelled rides:", error);
        } finally {
            setLoading(false);
        }
    }
    loadRides();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Viajes Cancelados</CardTitle>
        <CardDescription>Un registro de todos los viajes que fueron cancelados por pasajeros o conductores.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
            <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cancelado Por</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Pasajero</TableHead>
              <TableHead>Conductor</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rides.map((ride) => (
              <TableRow key={ride.id}>
                <TableCell>
                    {ride.cancelledBy && (
                        <div className="flex items-center gap-2 font-medium">
                            {cancelledByConfig[ride.cancelledBy].icon}
                            <span>{cancelledByConfig[ride.cancelledBy].label}</span>
                        </div>
                    )}
                </TableCell>
                <TableCell>
                  <div className="font-medium max-w-xs">{ride.cancellationReason?.reason || 'No especificado'}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={ride.passenger.avatarUrl} alt={ride.passenger.name} />
                      <AvatarFallback>{ride.passenger.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{ride.passenger.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={ride.driver.avatarUrl} alt={ride.driver.name} />
                      <AvatarFallback>{ride.driver.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                     <span className="font-medium">{ride.driver.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(ride.date).toLocaleDateString('es-PE')}
                </TableCell>
                <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Abrir menú</span>
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={`/admin/rides/${ride.id}`}>
                                Ver detalles del viaje
                            </Link>
                        </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        )}
      </CardContent>
    </Card>
  );
}
