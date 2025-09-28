
'use client';

import AppHeader from '@/components/app-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Car, ShieldCheck, ShieldAlert, ShieldX, FileText, Star, AlertCircle, User as UserIcon, History, UserCog, Wallet } from 'lucide-react';
import { useDriverAuth } from '@/hooks/use-driver-auth';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import type { Ride, User, Driver, Location } from '@/lib/types';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, getDoc, writeBatch, onSnapshot, Unsubscribe, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import RatingForm from '@/components/rating-form';
import { processRating } from '@/ai/flows/process-rating';
import { GoogleIcon } from '@/components/google-icon';
import { useGeolocation } from '@/hooks/use-geolocation-improved';
import MapView from '@/components/map-view';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DriverDocuments from '@/components/driver/documents';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const overallDocStatusConfig = {
  approved: { 
    label: 'Aprobados',
    variant: 'default' as const,
    icon: <ShieldCheck className="h-4 w-4" />,
    description: '¡Todo en orden! Ya puedes activarte para recibir viajes.'
  },
  pending: { 
    label: 'Pendientes',
    variant: 'outline' as const,
    icon: <ShieldAlert className="h-4 w-4" />,
    description: 'Nuestro equipo está revisando tus documentos.'
  },
  rejected: { 
    label: 'Rechazados',
    variant: 'destructive' as const,
    icon: <ShieldX className="h-4 w-4" />,
    description: 'Hay un problema con tus documentos.'
  },
};

const statusConfig: Record<'available' | 'unavailable' | 'on-ride', { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    available: { label: 'Disponible', variant: 'default' },
    unavailable: { label: 'No Disponible', variant: 'secondary' },
    'on-ride': { label: 'En Viaje', variant: 'outline' },
}

const rideStatusConfig: Record<Ride['status'], { label: string; variant: 'secondary' | 'default' | 'destructive' }> = {
  completed: { label: 'Completado', variant: 'secondary' },
  'in-progress': { label: 'En Progreso', variant: 'default' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
};


type EnrichedRide = Omit<Ride, 'passenger' | 'driver'> & { passenger: User, driver: Driver };

function DriverDashboardPageContent() {
  const { driver, setDriver, loading } = useDriverAuth();
  const { toast } = useToast();
  const [allRides, setAllRides] = useState<EnrichedRide[]>([]);
  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);
  const [activeRide, setActiveRide] = useState<EnrichedRide | null>(null);
  const [isCompletingRide, setIsCompletingRide] = useState(false);
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<Location | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!driver) return;
    
    let unsubscribeActiveRide: Unsubscribe | null = null;
    let unsubscribeAllRides: Unsubscribe | null = null;

    const driverRef = doc(db, 'drivers', driver.id);

    // Listener for active ride
    const activeRideQuery = query(
        collection(db, 'rides'),
        where('driver', '==', driverRef),
        where('status', '==', 'in-progress')
    );
    unsubscribeActiveRide = onSnapshot(activeRideQuery, async (snapshot) => {
        if (!snapshot.empty) {
            const rideDoc = snapshot.docs[0];
            const rideData = { id: rideDoc.id, ...rideDoc.data() } as Ride;
            const passengerSnap = await getDoc(rideData.passenger);
            const passengerData = passengerSnap.data() as User;
            setActiveRide({ ...rideData, driver, passenger: passengerData });
        } else {
            setActiveRide(null);
            setPickupLocation(null);
            setDropoffLocation(null);
        }
    });

    // Listener for all driver's rides (for history)
    const allRidesQuery = query(
        collection(db, 'rides'),
        where('driver', '==', driverRef)
    );
     unsubscribeAllRides = onSnapshot(allRidesQuery, async (snapshot) => {
        const ridesPromises = snapshot.docs.map(async (rideDoc) => {
            const rideData = { id: rideDoc.id, ...rideDoc.data() } as Ride;
            const passengerSnap = await getDoc(rideData.passenger);
            return { ...rideData, driver, passenger: passengerSnap.data() as User };
        });
        const results = await Promise.all(ridesPromises);
        setAllRides(results.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });
    
    return () => {
        if(unsubscribeActiveRide) unsubscribeActiveRide();
        if(unsubscribeAllRides) unsubscribeAllRides();
    }

  }, [driver]);

  const handleAvailabilityChange = async (isAvailable: boolean) => {
    if (!driver) return;
    setIsUpdatingStatus(true);
    const newStatus = isAvailable ? 'available' : 'unavailable';
    const driverRef = doc(db, 'drivers', driver.id);
    
    try {
        await updateDoc(driverRef, { status: newStatus });
        setDriver({ ...driver, status: newStatus });
        toast({
          title: `Estado actualizado: ${isAvailable ? 'Disponible' : 'No Disponible'}`,
          description: isAvailable ? 'Ahora recibirás solicitudes de viaje.' : 'Has dejado de recibir solicitudes.',
        });
    } catch (error) {
        console.error("Error updating availability:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar tu estado.'})
    } finally {
        setIsUpdatingStatus(false);
    }
  };

  const handleRatingSubmit = async (passenger: User, rating: number, comment: string) => {
    setIsRatingSubmitting(true);
    try {
      await processRating({
        ratedUserId: passenger.id,
        isDriver: false,
        rating,
        comment,
      });
      toast({
        title: 'Pasajero Calificado',
        description: `Has calificado a ${passenger.name} con ${rating} estrellas.`,
      });
    } catch (error) {
      console.error('Error submitting passenger rating:', error);
      toast({
        variant: 'destructive',
        title: 'Error al Calificar',
        description: 'No se pudo guardar la calificación. Inténtalo de nuevo.',
      });
    } finally {
      setIsRatingSubmitting(false);
    }
  }

  const handleCompleteRide = async () => {
    if (!activeRide) return;
    setIsCompletingRide(true);

    const rideRef = doc(db, 'rides', activeRide.id);
    const driverRef = doc(db, 'drivers', activeRide.driver.id);
    
    try {
        const batch = writeBatch(db);
        batch.update(rideRef, { status: 'completed' });
        batch.update(driverRef, { status: 'available' });
        await batch.commit();

        toast({
            title: '¡Viaje Finalizado!',
            description: 'Has completado el viaje exitosamente. Ahora estás disponible.',
        });
    } catch (error) {
        console.error('Error completing ride:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo finalizar el viaje.'});
    } finally {
        setIsCompletingRide(false);
    }
  }
  
  if (loading || !driver) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const isApproved = driver.documentsStatus === 'approved';

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
       <main className="flex-1 p-4 lg:p-8">
        <Tabs defaultValue="dashboard">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto">
            <TabsTrigger value="dashboard"><UserCog className="mr-2 h-4 w-4" />Panel</TabsTrigger>
            <TabsTrigger value="documents"><FileText className="mr-2 h-4 w-4" />Documentos</TabsTrigger>
            <TabsTrigger value="history"><History className="mr-2 h-4 w-4" />Historial</TabsTrigger>
            <TabsTrigger value="profile"><Wallet className="mr-2 h-4 w-4" />Perfil</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="mt-6">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 flex flex-col min-h-[60vh] rounded-xl overflow-hidden shadow-lg relative">
                    <MapView 
                        pickupLocation={pickupLocation}
                        dropoffLocation={dropoffLocation}
                        activeRide={activeRide} 
                        interactive={false}
                    />
                </div>
                 <div className="flex flex-col gap-8">
                   <Card>
                        <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                            <CardTitle className="text-2xl font-headline">Panel Principal</CardTitle>
                            <CardDescription>Gestiona tu estado y tus viajes.</CardDescription>
                            </div>
                            <div className="flex items-center space-x-2">
                            <Switch
                                id="availability-switch"
                                checked={driver.status === 'available'}
                                onCheckedChange={handleAvailabilityChange}
                                disabled={!isApproved || driver.status === 'on-ride' || isUpdatingStatus}
                                aria-label="Estado de disponibilidad"
                            />
                            <Label htmlFor="availability-switch">
                                <Badge variant={statusConfig[driver.status].variant}>
                                {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin"/> : statusConfig[driver.status].label}
                                </Badge>
                            </Label>
                            </div>
                        </div>
                        </CardHeader>
                        <CardContent>
                             {!isApproved && (
                                <Alert variant="destructive">
                                    <ShieldAlert className="h-4 w-4" />
                                    <AlertTitle>Acción Requerida</AlertTitle>
                                    <AlertDescription>
                                        Tus documentos no están aprobados. No puedes recibir viajes.
                                        Revisa la pestaña "Documentos".
                                    </AlertDescription>
                                </Alert>
                             )}
                        </CardContent>
                    </Card>

                    {activeRide ? (
                        <Card className="border-primary border-2 animate-pulse">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-primary">
                                    <Car className="h-6 w-6" />
                                    <span>¡Viaje en Progreso!</span>
                                </CardTitle>
                                <CardDescription>Estás llevando a un pasajero a su destino.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 bg-muted rounded-lg flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={activeRide.passenger.avatarUrl} alt={activeRide.passenger.name} />
                                            <AvatarFallback>{activeRide.passenger.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{activeRide.passenger.name}</p>
                                            <p className="text-sm text-muted-foreground">Destino: <span className="font-medium truncate">{activeRide.dropoff}</span></p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-muted-foreground">Tarifa</p>
                                        <p className="font-bold text-lg">S/{activeRide.fare.toFixed(2)}</p>
                                    </div>
                                </div>
                                <Button className="w-full" onClick={handleCompleteRide} disabled={isCompletingRide}>
                                    {isCompletingRide ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : null}
                                    Finalizar Viaje
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Car className="h-6 w-6 text-primary" />
                                <span>Solicitudes de Viaje</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>No hay solicitudes pendientes</AlertTitle>
                                <AlertDescription>
                                    Cuando un pasajero solicite un viaje cerca de ti, aparecerá aquí.
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                        </Card>
                    )}

                 </div>
             </div>
          </TabsContent>

          <TabsContent value="documents">
             <DriverDocuments driver={driver} onUpdate={setDriver} />
          </TabsContent>

          <TabsContent value="history">
            <Card>
                <CardHeader>
                    <CardTitle>Historial de Viajes</CardTitle>
                    <CardDescription>Aquí puedes ver todos los viajes que has realizado.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Pasajero</TableHead>
                                <TableHead>Ruta</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead className="text-right">Tarifa</TableHead>
                                <TableHead>Estado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allRides.map(ride => (
                                <TableRow key={ride.id}>
                                    <TableCell>{ride.passenger.name}</TableCell>
                                    <TableCell className="max-w-xs truncate">{ride.pickup} &rarr; {ride.dropoff}</TableCell>
                                    <TableCell>{format(new Date(ride.date), "dd/MM/yy HH:mm", {locale: es})}</TableCell>
                                    <TableCell className="text-right font-semibold">S/{ride.fare.toFixed(2)}</TableCell>
                                    <TableCell><Badge variant={rideStatusConfig[ride.status].variant}>{rideStatusConfig[ride.status].label}</Badge></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="profile">
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle>Mi Perfil y Estadísticas</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Información del Conductor</h3>
                        <div className="flex items-center gap-4">
                             <Avatar className="h-20 w-20">
                                <AvatarImage src={driver.avatarUrl} alt={driver.name} />
                                <AvatarFallback>{driver.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-2xl font-bold">{driver.name}</p>
                                <p className="text-muted-foreground">{driver.serviceType} / {driver.paymentModel}</p>
                            </div>
                        </div>
                        <h3 className="font-semibold text-lg mt-6">Vehículo</h3>
                        <p>{driver.vehicleBrand} {driver.vehicleModel}</p>
                        <p className="font-mono bg-muted p-2 rounded-md inline-block">{driver.licensePlate}</p>
                     </div>
                     <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Estadísticas</h3>
                         <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 bg-muted rounded-lg text-center">
                                <p className="text-4xl font-bold">{allRides.filter(r => r.status === 'completed').length}</p>
                                <p className="text-muted-foreground">Viajes Completados</p>
                              </div>
                              <div className="p-4 bg-muted rounded-lg text-center">
                                <p className="text-4xl font-bold flex items-center justify-center gap-1">
                                    <Star className="h-8 w-8 text-yellow-400 fill-yellow-400" />
                                    {(driver.rating || 0).toFixed(1)}
                                </p>
                                <p className="text-muted-foreground">Tu Calificación</p>
                              </div>
                            </div>
                     </div>
                </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}


export default function DriverDashboardPage() {
    const { user, loading: authLoading, signInWithGoogle, isDriver } = useDriverAuth();

    if (authLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!user) {
        return (
             <>
                <AppHeader />
                <main className="flex flex-col items-center justify-center text-center p-4 py-16 md:py-24">
                    <Card className="max-w-md p-8">
                        <CardHeader>
                            <CardTitle>Acceso de Conductores</CardTitle>
                            <CardDescription>
                                Inicia sesión para acceder a tu panel de control.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={signInWithGoogle} size="lg" variant="outline">
                               <GoogleIcon className="mr-2 h-5 w-5" />
                                Iniciar Sesión con Google
                            </Button>
                        </CardContent>
                    </Card>
                </main>
            </>
        )
    }

    if (!isDriver) {
         return (
             <>
                <AppHeader />
                <div className="flex flex-col items-center justify-center text-center flex-1 p-8">
                    <Card className="max-w-md p-8">
                        <CardHeader>
                            <CardTitle>No eres un conductor</CardTitle>
                            <CardDescription>
                                Esta sección es solo para conductores registrados.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </>
        )
    }

    return <DriverDashboardPageContent />;
}
