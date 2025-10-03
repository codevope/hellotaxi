
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
import type { Ride, Driver, User, Vehicle, RideStatus } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, DocumentReference } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const statusConfig: Record<RideStatus, { label: string; variant: 'secondary' | 'default' | 'destructive' }> = {
  completed: { label: 'Completado', variant: 'secondary' },
  'in-progress': { label: 'En Progreso', variant: 'default' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
  searching: { label: 'Buscando', variant: 'default' },
  accepted: { label: 'Aceptado', variant: 'default' },
  arrived: { label: 'Ha llegado', variant: 'default' },
  'counter-offered': { label: 'Contraoferta', variant: 'default' }
};

const serviceTypeConfig = {
  economy: 'Económico',
  comfort: 'Confort',
  exclusive: 'Exclusivo',
};

type EnrichedRide = Omit<Ride, 'driver' | 'passenger' | 'vehicle'> & { driver?: Driver; passenger?: User; vehicle?: Vehicle };

async function getRides(): Promise<EnrichedRide[]> {
  // 1. Cargar todas las colecciones relevantes en mapas para acceso rápido
  const [usersSnap, driversSnap, vehiclesSnap] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'drivers')),
    getDocs(collection(db, 'vehicles')),
  ]);

  const usersMap = new Map<string, User>(usersSnap.docs.map(d => [d.id, { id: d.id, ...d.data() } as User]));
  const driversMap = new Map<string, Driver>(driversSnap.docs.map(d => [d.id, { id: d.id, ...d.data() } as Driver]));
  const vehiclesMap = new Map<string, Vehicle>(vehiclesSnap.docs.map(d => [d.id, { id: d.id, ...d.data() } as Vehicle]));

  // 2. Obtener todos los viajes
  const ridesCol = collection(db, 'rides');
  const rideSnapshot = await getDocs(ridesCol);
  const ridesList = rideSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ride));

  // 3. Enriquecer los datos del viaje usando los mapas locales (sin más consultas)
  const enrichedRides = ridesList.map(ride => {
    const passenger = ride.passenger instanceof DocumentReference ? usersMap.get(ride.passenger.id) : undefined;
    const driver = ride.driver instanceof DocumentReference ? driversMap.get(ride.driver.id) : undefined;
    const vehicle = ride.vehicle instanceof DocumentReference ? vehiclesMap.get(ride.vehicle.id) : undefined;
    
    return {
      ...ride,
      passenger,
      driver,
      vehicle,
    };
  });

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
                  {ride.driver ? (
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
                  ) : (
                    <span className="text-muted-foreground text-xs">No asignado</span>
                  )}
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
