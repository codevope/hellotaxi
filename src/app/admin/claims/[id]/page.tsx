
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Calendar,
  Car,
  CircleDollarSign,
  Loader2,
  User as UserIcon,
  ShieldAlert,
  Save,
  Sparkles,
} from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { Claim, Ride, Driver, User, Vehicle } from '@/lib/types';
import { doc, getDoc, updateDoc, DocumentReference } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { assistClaimResolution } from '@/ai/flows/assist-claim-resolution';

type EnrichedClaim = Omit<Claim, 'claimant'> & { claimant: User };
type EnrichedRide = Omit<Ride, 'driver' | 'passenger' | 'vehicle'> & { driver: Driver; passenger: User, vehicle: Vehicle };

const statusConfig = {
  open: { label: 'Abierto', variant: 'destructive' as const },
  'in-progress': { label: 'En Proceso', variant: 'default' as const },
  resolved: { label: 'Resuelto', variant: 'secondary' as const },
};


export default function ClaimDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { toast } = useToast();

  const [claim, setClaim] = useState<EnrichedClaim | null>(null);
  const [ride, setRide] = useState<EnrichedRide | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);

  // Editable fields
  const [adminResponse, setAdminResponse] = useState('');
  const [claimStatus, setClaimStatus] = useState<Claim['status']>('open');

  useEffect(() => {
    if (typeof id !== 'string') return;

    async function fetchClaimData() {
      try {
        const claimDocRef = doc(db, 'claims', id as string);
        const claimSnap = await getDoc(claimDocRef);

        if (claimSnap.exists()) {
            const claimData = { id: claimSnap.id, ...claimSnap.data() } as Claim;
            
            const claimantRef = claimData.claimant as DocumentReference;
            const claimantSnap = await getDoc(claimantRef);
            const claimantData = claimantSnap.exists() ? { id: claimantSnap.id, ...claimantSnap.data() } as User : null;
            
            if (claimantData) {
                const enrichedClaim = { ...claimData, claimant: claimantData };
                setClaim(enrichedClaim);
                setAdminResponse(enrichedClaim.adminResponse || '');
                setClaimStatus(enrichedClaim.status);
            }

            // Fetch associated ride
            const rideDocRef = doc(db, 'rides', claimData.rideId);
            const rideSnap = await getDoc(rideDocRef);
             if (rideSnap.exists()) {
                const rideData = { id: rideSnap.id, ...rideSnap.data() } as Ride;
                const driverSnap = rideData.driver ? await getDoc(rideData.driver as DocumentReference) : null;
                const passengerSnap = await getDoc(rideData.passenger as DocumentReference);
                const vehicleSnap = rideData.vehicle ? await getDoc(rideData.vehicle as DocumentReference) : null;

                if (driverSnap?.exists() && passengerSnap.exists() && vehicleSnap?.exists()) {
                    const driverData = { id: driverSnap.id, ...driverSnap.data() } as Driver;
                    const passengerData = { id: passengerSnap.id, ...passengerSnap.data() } as User;
                    const vehicleData = {id: vehicleSnap.id, ...vehicleSnap.data()} as Vehicle;
                    setRide({ ...rideData, driver: driverData, passenger: passengerData, vehicle: vehicleData });
                }
            }
        }
      } catch (error) {
        console.error("Error fetching claim data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchClaimData();
  }, [id]);

  const handleSaveChanges = async () => {
    if (!claim) return;
    setIsSaving(true);
    const claimRef = doc(db, 'claims', claim.id);
    try {
        await updateDoc(claimRef, {
            status: claimStatus,
            adminResponse: adminResponse,
        });
        setClaim(prev => prev ? { ...prev, status: claimStatus, adminResponse: adminResponse } : null);
        toast({
            title: "Reclamo Actualizado",
            description: "Los cambios en el reclamo han sido guardados.",
        });
    } catch (error) {
        console.error("Error updating claim:", error);
        toast({
            variant: "destructive",
            title: "Error al Guardar",
            description: "No se pudieron guardar los cambios.",
        });
    } finally {
        setIsSaving(false);
    }
  };

  const handleGetSuggestion = async () => {
    if (!claim) return;
    setIsSuggesting(true);
    try {
      const result = await assistClaimResolution({
        reason: claim.reason,
        details: claim.details,
      });
      setAdminResponse(result.suggestedResponse);
    } catch (error) {
      console.error("Error getting AI suggestion:", error);
      toast({
        variant: "destructive",
        title: "Error de IA",
        description: "No se pudo obtener una sugerencia.",
      });
    } finally {
      setIsSuggesting(false);
    }
  };


  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="p-8">
        <h1 className="text-2xl">Reclamo no encontrado.</h1>
      </div>
    );
  }

  const { claimant } = claim;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl font-headline">
              Detalles del Reclamo
            </h1>
            <p className="text-muted-foreground">ID del Reclamo: {claim.id}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                        <CardTitle>Reclamo de {claimant.name}</CardTitle>
                        <CardDescription>
                            Registrado el {format(new Date(claim.date), "dd 'de' MMMM 'del' yyyy", { locale: es })}
                        </CardDescription>
                    </div>
                    <Badge variant={statusConfig[claimStatus].variant}>{statusConfig[claimStatus].label}</Badge>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-1">
                        <h3 className="font-semibold text-lg">Motivo: {claim.reason}</h3>
                        <p className="text-muted-foreground italic bg-muted p-4 rounded-md">"{claim.details}"</p>
                    </div>
                    <div className="space-y-4">
                         <div className="flex items-center justify-between">
                            <Label htmlFor="adminResponse" className="text-lg font-semibold">Respuesta del Administrador</Label>
                            <Button variant="outline" size="sm" onClick={handleGetSuggestion} disabled={isSuggesting}>
                                {isSuggesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                Sugerir Respuesta con IA
                            </Button>
                        </div>
                        <Textarea 
                            id="adminResponse"
                            rows={6}
                            value={adminResponse}
                            onChange={(e) => setAdminResponse(e.target.value)}
                            placeholder="Escribe una respuesta interna o una nota sobre la resolución del caso..."
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="statusSelect">Cambiar Estado</Label>
                        <Select value={claimStatus} onValueChange={(value) => setClaimStatus(value as Claim['status'])}>
                            <SelectTrigger id="statusSelect">
                                <SelectValue placeholder="Seleccionar estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="open">Abierto</SelectItem>
                                <SelectItem value="in-progress">En Proceso</SelectItem>
                                <SelectItem value="resolved">Resuelto</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" />}
                        Guardar Cambios
                    </Button>
                </CardFooter>
            </Card>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <UserIcon className="h-6 w-6 text-primary" />
                    <CardTitle>Reclamante</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center">
                 <Avatar className="h-20 w-20 mb-4">
                    <AvatarImage src={claimant.avatarUrl} alt={claimant.name} />
                    <AvatarFallback>{claimant.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="font-semibold">{claimant.name}</p>
                <p className="text-sm text-muted-foreground">{claimant.email}</p>
            </CardContent>
          </Card>

          {ride && (
              <Card>
                 <CardHeader>
                    <div className="flex items-center gap-2">
                        <Car className="h-6 w-6 text-primary" />
                        <CardTitle>Viaje Asociado</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <p><strong>De:</strong> {ride.pickup}</p>
                    <p><strong>A:</strong> {ride.dropoff}</p>
                    <p><strong>Conductor:</strong> {ride.driver.name}</p>
                    <p><strong>Tarifa:</strong> S/{ride.fare.toFixed(2)}</p>
                </CardContent>
                <CardFooter>
                    <Button asChild variant="outline" className="w-full">
                        <Link href={`/admin/rides/${ride.id}`}>
                            Ver Detalles Completos del Viaje
                        </Link>
                    </Button>
                </CardFooter>
              </Card>
          )}
        </div>
      </div>
    </div>
  );
}
