
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
import { MoreVertical, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Ride, Driver, User } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, DocumentReference } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const statusConfig = {
  completed: { label: 'Completado', variant: 'secondary' },
  'in-progress': { label: 'En Progreso', variant: 'default' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
};

const serviceTypeConfig = {
  economy: 'Económico',
  comfort: 'Confort',
  exclusive: 'Exclusivo',
};

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

export default function RidesTable() {
  const [rides, setRides] = useState<EnrichedRide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRides() {
        try {
            const fetchedRides = await getRides();
            setRides(fetchedRides);
        } catch (error) {
            console.error("Error fetching rides:", error);
        } finally {
            setLoading(false);
        }
    }
    loadRides();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Todos los Viajes</CardTitle>
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
              <TableHead>Ruta</TableHead>
              <TableHead>Conductor</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Tarifa</TableHead>
              <TableHead>Servicio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rides.map((ride) => (
              <TableRow key={ride.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium truncate max-w-xs">
                      De: {ride.pickup}
                    </span>
                    <span className="text-muted-foreground truncate max-w-xs">
                      A: {ride.dropoff}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={ride.driver.avatarUrl}
                        alt={ride.driver.name}
                      />
                      <AvatarFallback>
                        {ride.driver.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{ride.driver.name}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(ride.date).toLocaleDateString('es-PE')}
                </TableCell>
                <TableCell>
                  <div className="font-medium">S/{ride.fare.toFixed(2)}</div>
                </TableCell>
                <TableCell>
                  {serviceTypeConfig[ride.serviceType]}
                </TableCell>
                <TableCell>
                  <Badge variant={statusConfig[ride.status].variant}>
                    {statusConfig[ride.status].label}
                  </Badge>
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
