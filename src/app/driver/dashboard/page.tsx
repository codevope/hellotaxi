
'use client';

import AppHeader from '@/components/app-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Car, ShieldCheck, ShieldAlert, ShieldX, FileText, Star, AlertCircle, User as UserIcon } from 'lucide-react';
import { useDriverAuth } from '@/hooks/use-driver-auth';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getDocumentStatus } from '@/lib/document-status';
import type { DocumentName, DocumentStatus, Ride, User } from '@/lib/types';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, getDoc, writeBatch, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import RatingForm from '@/components/rating-form';
import { processRating } from '@/ai/flows/process-rating';
import { Separator } from '@/components/ui/separator';


const overallDocStatusConfig = {
  approved: { 
    label: 'Aprobados',
    variant: 'default',
    icon: <ShieldCheck className="h-4 w-4" />,
    description: '¡Todo en orden! Ya puedes activarte para recibir viajes.'
  },
  pending: { 
    label: 'Pendientes de Revisión',
    variant: 'outline',
    icon: <ShieldAlert className="h-4 w-4" />,
    description: 'Nuestro equipo está revisando tus documentos. Te notificaremos pronto.'
  },
  rejected: { 
    label: 'Rechazados',
    variant: 'destructive',
    icon: <ShieldX className="h-4 w-4" />,
    description: 'Hemos encontrado un problema con tus documentos. Revisa los detalles y vuelve a subirlos.'
  },
};

const individualDocStatusConfig: Record<DocumentStatus, { label: string; variant: 'default' | 'outline' | 'destructive' }> = {
    approved: { label: 'Aprobado', variant: 'default' },
    pending: { label: 'Pendiente', variant: 'outline' },
    rejected: { label: 'Rechazado', variant: 'destructive' },
};


const statusConfig: Record<'available' | 'unavailable' | 'on-ride', { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    available: { label: 'Disponible', variant: 'default' },
    unavailable: { label: 'No Disponible', variant: 'secondary' },
    'on-ride': { label: 'En Viaje', variant: 'outline' },
}

type EnrichedRide = Omit<Ride, 'passenger' | 'driver'> & { passenger: User, driver: Driver };

function DriverDashboardPageContent() {
  const { driver, loading } = useDriverAuth();
  const { toast } = useToast();
  const [completedRides, setCompletedRides] = useState<EnrichedRide[]>([]);
  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [activeRide, setActiveRide] = useState<EnrichedRide | null>(null);
  const [isCompletingRide, setIsCompletingRide] = useState(false);

  useEffect(() => {
    if (!driver) return;
    
    let unsubscribeActiveRide: Unsubscribe | null = null;
    let unsubscribeCompletedRides: Unsubscribe | null = null;

    // Listener for active ride
    const driverRef = doc(db, 'drivers', driver.id);
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
        }
    });

    // Listener for completed rides to rate
    const completedRidesQuery = query(
        collection(db, 'rides'),
        where('driver', '==', driverRef),
        where('status', '==', 'completed')
    );
     unsubscribeCompletedRides = onSnapshot(completedRidesQuery, async (snapshot) => {
        const ridesPromises = snapshot.docs.map(async (rideDoc) => {
            const rideData = { id: rideDoc.id, ...rideDoc.data() } as Ride;
            const passengerSnap = await getDoc(rideData.passenger);
            return { ...rideData, driver, passenger: passengerSnap.data() as User };
        });
        const results = await Promise.all(ridesPromises);
        // Here you could filter out rides that have already been rated by the driver
        setCompletedRides(results.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });
    
    return () => {
        if(unsubscribeActiveRide) unsubscribeActiveRide();
        if(unsubscribeCompletedRides) unsubscribeCompletedRides();
    }

  }, [driver]);

  const handleAvailabilityChange = (isAvailable: boolean) => {
    console.log('Cambiando disponibilidad a:', isAvailable);
    toast({
      title: `Estado actualizado: ${isAvailable ? 'Disponible' : 'No Disponible'}`,
      description: isAvailable ? 'Ahora recibirás solicitudes de viaje.' : 'Has dejado de recibir solicitudes.',
    });
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
      // TODO: Marcar el viaje como calificado para que no vuelva a aparecer
      setIsRatingDialogOpen(false);
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
            description: 'Has completado el viaje exitosamente.',
        });
        // The listener will automatically update the UI
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
  const overallDocStatus = overallDocStatusConfig[driver.documentsStatus];
  const driverStatus = driver.status === 'on-ride' ? 'available' : driver.status;

  const getIndividualDocStatus = (docName: DocumentName) => {
      const status = driver.documentStatus?.[docName] || 'pending';
      return individualDocStatusConfig[status];
  }

  const documentDetails: { name: DocumentName, label: string, expiryDate?: string }[] = [
      { name: 'license', label: 'Licencia de Conducir', expiryDate: driver.licenseExpiry },
      { name: 'insurance', label: 'SOAT / Póliza de Seguro', expiryDate: driver.insuranceExpiry },
      { name: 'technicalReview', label: 'Revisión Técnica', expiryDate: driver.technicalReviewExpiry },
      { name: 'backgroundCheck', label: 'Certificado de Antecedentes', expiryDate: driver.backgroundCheckExpiry },
  ];


  return (
    <div className="flex flex-col min-h-screen bg-secondary/30">
      <AppHeader />
      <main className="flex-1 p-4 sm:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-3xl font-headline">Panel del Conductor</CardTitle>
                  <CardDescription>Gestiona tu estado y visualiza tus viajes.</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                   <Switch
                    id="availability-switch"
                    checked={driverStatus === 'available'}
                    onCheckedChange={handleAvailabilityChange}
                    disabled={!isApproved || driver.status === 'on-ride'}
                    aria-label="Estado de disponibilidad"
                  />
                  <Label htmlFor="availability-switch">
                    <Badge variant={statusConfig[driver.status].variant}>
                       {statusConfig[driver.status].label}
                    </Badge>
                  </Label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
                <Alert variant={overallDocStatus.variant}>
                    {overallDocStatus.icon}
                    <AlertTitle>Estado General: Documentos {overallDocStatus.label}</AlertTitle>
                    <AlertDescription>{overallDocStatus.description}</AlertDescription>
                </Alert>
            </CardContent>
          </Card>
          
          {activeRide && (
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
          )}

          {!activeRide && (
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

          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Star className="h-6 w-6 text-primary" />
                    <span>Viajes por Calificar</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {completedRides.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Pasajero</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead className="text-right">Acción</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {completedRides.map(ride => (
                            <TableRow key={ride.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={ride.passenger.avatarUrl} alt={ride.passenger.name} />
                                            <AvatarFallback>{ride.passenger.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{ride.passenger.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{format(new Date(ride.date), 'dd/MM/yyyy')}</TableCell>
                                <TableCell className="text-right">
                                     <Dialog open={isRatingDialogOpen} onOpenChange={setIsRatingDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm">Calificar Pasajero</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Calificar a {ride.passenger.name}</DialogTitle>
                                            </DialogHeader>
                                            <RatingForm 
                                                userToRate={ride.passenger}
                                                isDriver={false}
                                                isSubmitting={isRatingSubmitting}
                                                onSubmit={(rating, comment) => handleRatingSubmit(ride.passenger, rating, comment)}
                                            />
                                        </DialogContent>
                                    </Dialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                ) : (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No hay viajes por calificar</AlertTitle>
                    <AlertDescription>
                        Cuando completes un viaje, aparecerá aquí para que puedas calificar al pasajero.
                    </AlertDescription>
                </Alert>
                )}
            </CardContent>
          </Card>
          

           <Card>
            <CardHeader>
              <CardTitle>Gestión de Documentos</CardTitle>
              <CardDescription>
                Mantén tus documentos al día para poder recibir viajes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <ul className="space-y-3">
                   {documentDetails.map(docDetail => {
                       const statusInfo = docDetail.expiryDate ? getDocumentStatus(docDetail.expiryDate) : { label: 'Fecha no disponible', icon: <ShieldAlert className="h-5 w-5" />, color: 'text-yellow-600' };
                       const approvalStatus = getIndividualDocStatus(docDetail.name);
                       return (
                          <li key={docDetail.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                    <span>{docDetail.label}</span>
                                    <Badge variant={approvalStatus.variant}>{approvalStatus.label}</Badge>
                                </div>
                                <div className={cn("flex items-center gap-1.5 text-sm font-medium ml-7", statusInfo.color)}>
                                    {statusInfo.icon}
                                    {docDetail.expiryDate ? (
                                      <span>{statusInfo.label} (Vence: {format(new Date(docDetail.expiryDate), 'dd/MM/yyyy')})</span>
                                    ) : (
                                      <span>{statusInfo.label}</span>
                                    )}
                                </div>
                            </div>
                            <Button variant="outline" size="sm" disabled>
                              Subir PDF (Próximamente)
                            </Button>
                        </li>
                       )
                   })}
                </ul>
            </CardContent>
          </Card>

        </div>
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
                <main className="flex flex-col items-center p-4 text-center py-16 md:py-24">
                    <Card className="max-w-md p-8">
                        <CardHeader>
                            <CardTitle>Acceso de Conductores</CardTitle>
                            <CardDescription>
                                Inicia sesión para acceder a tu panel de control.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={signInWithGoogle} size="lg">Iniciar Sesión con Google</Button>
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
