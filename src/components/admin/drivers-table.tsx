
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
import { MoreVertical, ShieldCheck, ShieldAlert, ShieldX, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import type { Driver, PaymentModel, MembershipStatus, Vehicle } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, DocumentReference } from 'firebase/firestore';
import { useEffect, useState } from 'react';

const documentStatusConfig = {
  approved: {
    label: 'Aprobado',
    icon: <ShieldCheck className="text-green-500" />,
    variant: 'secondary' as const,
  },
  pending: {
    label: 'Pendiente',
    icon: <ShieldAlert className="text-yellow-500" />,
    variant: 'outline' as const,
  },
  rejected: {
    label: 'Rechazado',
    icon: <ShieldX className="text-red-200" />,
    variant: 'destructive' as const,
  },
};

const statusConfig = {
  available: { label: 'Disponible', variant: 'default' as const },
  unavailable: { label: 'No Disponible', variant: 'secondary' as const },
  'on-ride': { label: 'En Viaje', variant: 'outline' as const },
};

const paymentModelConfig: Record<PaymentModel, string> = {
  commission: 'Comisión por Viaje',
  membership: 'Membresía Mensual',
};

const membershipStatusConfig: Record<MembershipStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    active: { label: 'Activa', variant: 'default' },
    pending: { label: 'Pendiente', variant: 'outline' },
    expired: { label: 'Vencida', variant: 'destructive' },
}

type EnrichedDriver = Omit<Driver, 'vehicle'> & { vehicle: Vehicle };

async function getDrivers(): Promise<EnrichedDriver[]> {
    const driversCol = collection(db, 'drivers');
    const driverSnapshot = await getDocs(driversCol);
    const driverList = driverSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as Driver);
    
    const enrichedDrivers: EnrichedDriver[] = [];
    for(const driver of driverList) {
        if(driver.vehicle) {
            const vehicleSnap = await getDoc(driver.vehicle as DocumentReference);
            if(vehicleSnap.exists()){
                enrichedDrivers.push({ ...driver, vehicle: vehicleSnap.data() as Vehicle });
            }
        }
    }
    return enrichedDrivers;
}

export default function DriversTable() {
    const [drivers, setDrivers] = useState<EnrichedDriver[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadDrivers() {
            try {
                const fetchedDrivers = await getDrivers();
                setDrivers(fetchedDrivers);
            } catch (error) {
                console.error("Error fetching drivers:", error);
            } finally {
                setLoading(false);
            }
        }
        loadDrivers();
    }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Todos los Conductores</CardTitle>
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
              <TableHead>Conductor</TableHead>
              <TableHead>Vehículo</TableHead>
              <TableHead>Tipo de Servicio</TableHead>
              <TableHead>Estado Actual</TableHead>
              <TableHead>Documentos</TableHead>
              <TableHead>Modelo de Pago</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.map((driver) => (
              <TableRow key={driver.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={driver.avatarUrl} alt={driver.name} />
                      <AvatarFallback>{driver.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{driver.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Rating: {driver.rating.toFixed(1)} ★
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>{driver.vehicle.brand} {driver.vehicle.model}</div>
                  <div className="text-sm text-muted-foreground">
                    {driver.vehicle.licensePlate}
                  </div>
                </TableCell>
                <TableCell>
                    <Badge variant="outline" className="capitalize">{driver.vehicle.serviceType}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={statusConfig[driver.status].variant}>
                    {statusConfig[driver.status].label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      documentStatusConfig[driver.documentsStatus].variant
                    }
                    className="flex items-center gap-1.5"
                  >
                    {documentStatusConfig[driver.documentsStatus].icon}
                    <span>
                      {documentStatusConfig[driver.documentsStatus].label}
                    </span>
                  </Badge>
                </TableCell>
                <TableCell>
                    <div className="font-medium">{paymentModelConfig[driver.paymentModel]}</div>
                    {driver.paymentModel === 'membership' && (
                        <Badge variant={membershipStatusConfig[driver.membershipStatus].variant} className="mt-1">
                            {membershipStatusConfig[driver.membershipStatus].label}
                        </Badge>
                    )}
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
                        <Link href={`/admin/drivers/${driver.id}`}>
                          Ver detalles
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
