'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical, User, UserCog, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, updateDoc, DocumentReference } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import type { SOSAlert, Driver, User as AppUser } from '@/lib/types';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

const statusConfig = {
  pending: { label: 'Pendiente', variant: 'destructive' as const },
  attended: { label: 'Atendida', variant: 'secondary' as const },
};

const triggeredByConfig = {
    passenger: {
        label: 'Pasajero',
        icon: <User className="h-4 w-4 mr-2" />
    },
    driver: {
        label: 'Conductor',
        icon: <UserCog className="h-4 w-4 mr-2" />
    }
}

type EnrichedSOSAlert = Omit<SOSAlert, 'driver' | 'passenger'> & { driver: Driver; passenger: AppUser };

async function getSosAlerts(): Promise<EnrichedSOSAlert[]> {
  const alertsCol = collection(db, 'sosAlerts');
  const alertSnapshot = await getDocs(alertsCol);
  const alertsList = alertSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SOSAlert));

  const enrichedAlerts: EnrichedSOSAlert[] = [];

  for (const alert of alertsList) {
    let driver: Driver | null = null;
    let passenger: AppUser | null = null;

     if (alert.driver && alert.driver instanceof DocumentReference) {
        const driverSnap = await getDoc(alert.driver);
        if (driverSnap.exists()) {
            driver = { id: driverSnap.id, ...driverSnap.data() } as Driver;
        }
    }

    if (alert.passenger && alert.passenger instanceof DocumentReference) {
        const passengerSnap = await getDoc(alert.passenger);
        if (passengerSnap.exists()) {
            passenger = { id: passengerSnap.id, ...passengerSnap.data() } as AppUser;
        }
    }
    
    if (driver && passenger) {
        enrichedAlerts.push({ ...alert, driver, passenger });
    }
  }

  return enrichedAlerts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export default function SosTable() {
  const [alerts, setAlerts] = useState<EnrichedSOSAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function loadAlerts() {
        try {
            const fetchedAlerts = await getSosAlerts();
            setAlerts(fetchedAlerts);
        } catch (error) {
            console.error("Error fetching SOS alerts:", error);
        } finally {
            setLoading(false);
        }
    }
    loadAlerts();
  }, []);

  const handleUpdateStatus = async (alertId: string) => {
    setUpdatingId(alertId);
    const alertRef = doc(db, 'sosAlerts', alertId);
    try {
        await updateDoc(alertRef, { status: 'attended' });
        setAlerts(prevAlerts => 
            prevAlerts.map(alert => 
                alert.id === alertId ? { ...alert, status: 'attended' } : alert
            )
        );
        toast({
            title: 'Alerta Atendida',
            description: 'El estado de la alerta ha sido actualizado.',
        });
    } catch (error) {
        console.error('Error updating alert status:', error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No se pudo actualizar el estado de la alerta.',
        });
    } finally {
        setUpdatingId(null);
    }
  };


  if (loading) {
    return (
        <Card>
            <CardHeader><CardTitle>Historial de Alertas SOS</CardTitle></CardHeader>
            <CardContent>
                <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </CardContent>
        </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Alertas SOS</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Iniciada por</TableHead>
              <TableHead>Detalles del Viaje</TableHead>
              <TableHead>Fecha y Hora</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.map((alert) => (
              <TableRow key={alert.id}>
                <TableCell>
                  <div className="flex items-center">
                    {triggeredByConfig[alert.triggeredBy].icon}
                    <div>
                      <div className="font-medium">{triggeredByConfig[alert.triggeredBy].label}</div>
                      <div className="text-sm text-muted-foreground">
                        {alert.triggeredBy === 'passenger' ? alert.passenger.name : alert.driver.name}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">Pasajero: {alert.passenger.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Conductor: {alert.driver.name}
                    </div>
                     <div className="text-sm text-muted-foreground">
                        ID Viaje: {alert.rideId}
                      </div>
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(alert.date).toLocaleString('es-PE')}
                </TableCell>
                <TableCell>
                  {updatingId === alert.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Badge variant={statusConfig[alert.status].variant}>
                        {statusConfig[alert.status].label}
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
                        <Link href={`/admin/rides/${alert.rideId}`}>Ver detalles del viaje</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleUpdateStatus(alert.id)}
                        disabled={alert.status === 'attended' || updatingId === alert.id}
                      >
                        Marcar como Atendida
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
