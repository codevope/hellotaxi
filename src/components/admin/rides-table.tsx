
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Ride, Driver, User, Vehicle, RideStatus } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, DocumentReference, query, orderBy, limit } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DataTable } from '../ui/data-table';
import { columns } from './rides-table-columns';


type EnrichedRide = Omit<Ride, 'driver' | 'passenger' | 'vehicle'> & { driver?: Driver; passenger?: User; vehicle?: Vehicle };

async function getRides(): Promise<EnrichedRide[]> {
  const [usersSnap, driversSnap, vehiclesSnap] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'drivers')),
    getDocs(collection(db, 'vehicles')),
  ]);

  const usersMap = new Map<string, User>(usersSnap.docs.map(d => [d.id, { id: d.id, ...d.data() } as User]));
  const driversMap = new Map<string, Driver>(driversSnap.docs.map(d => [d.id, { id: d.id, ...d.data() } as Driver]));
  const vehiclesMap = new Map<string, Vehicle>(vehiclesSnap.docs.map(d => [d.id, { id: d.id, ...d.data() } as Vehicle]));

  const ridesQuery = query(
    collection(db, 'rides'), 
    orderBy('date', 'desc'), 
    limit(100)
  );
  const rideSnapshot = await getDocs(ridesQuery);
  const ridesList = rideSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ride));

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

  return enrichedRides;
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

  // Add an action column to the existing columns
  const tableColumns = [
    ...columns,
    {
      id: "actions",
      cell: ({ row }: { row: { original: EnrichedRide } }) => {
        const ride = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/admin/rides/${ride.id}`}>Ver detalles</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Viajes</CardTitle>
        <CardDescription>Mostrando los últimos 100 viajes registrados en la plataforma.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
            <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : (
          <DataTable 
            columns={tableColumns} 
            data={rides}
            searchKey="passenger"
            searchPlaceholder="Buscar por nombre de pasajero..."
          />
        )}
      </CardContent>
    </Card>
  );
}
