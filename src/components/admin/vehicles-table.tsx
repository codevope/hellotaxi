
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
import type { Vehicle, Driver } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import Link from 'next/link';

type EnrichedVehicle = Vehicle & { driver?: Driver };

async function getVehicles(): Promise<EnrichedVehicle[]> {
  const vehiclesCol = collection(db, 'vehicles');
  const vehicleSnapshot = await getDocs(vehiclesCol);
  const vehicleList = vehicleSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));

  const enrichedVehicles: EnrichedVehicle[] = [];

  for (const vehicle of vehicleList) {
    let driver: Driver | undefined = undefined;
    if (vehicle.driverId) {
      const driverRef = doc(db, 'drivers', vehicle.driverId);
      const driverSnap = await getDoc(driverRef);
      if (driverSnap.exists()) {
        driver = { id: driverSnap.id, ...driverSnap.data() } as Driver;
      }
    }
    enrichedVehicles.push({ ...vehicle, driver });
  }

  return enrichedVehicles;
}

export default function VehiclesTable() {
  const [vehicles, setVehicles] = useState<EnrichedVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVehicles() {
        try {
            const fetchedVehicles = await getVehicles();
            setVehicles(fetchedVehicles);
        } catch (error) {
            console.error("Error fetching vehicles:", error);
        } finally {
            setLoading(false);
        }
    }
    loadVehicles();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Todos los Vehículos</CardTitle>
        <CardDescription>Un registro de todos los vehículos en la plataforma y sus conductores asignados.</CardDescription>
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
              <TableHead>Vehículo</TableHead>
              <TableHead>Placa</TableHead>
              <TableHead>Tipo de Servicio</TableHead>
              <TableHead>Conductor Asignado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map((vehicle) => (
              <TableRow key={vehicle.id}>
                <TableCell>
                    <div className="font-medium">{vehicle.brand} {vehicle.model}</div>
                    <div className="text-sm text-muted-foreground">{vehicle.year} - {vehicle.color}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{vehicle.licensePlate}</Badge>
                </TableCell>
                <TableCell>
                    <Badge variant="outline" className="capitalize">{vehicle.serviceType}</Badge>
                </TableCell>
                <TableCell>
                  {vehicle.driver ? (
                     <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={vehicle.driver.avatarUrl} alt={vehicle.driver.name} />
                        <AvatarFallback>{vehicle.driver.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{vehicle.driver.name}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No asignado</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {vehicle.driver && (
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/drivers/${vehicle.driver.id}`}>
                        Ver Conductor
                      </Link>
                    </Button>
                  )}
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
