

'use client';

import AppHeader from '@/components/app-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Car, ShieldAlert, FileText, Star, UserCog, Wallet, History, MessageCircle, LogIn, Siren, CircleDollarSign } from 'lucide-react';
import { useDriverAuth } from '@/hooks/use-driver-auth';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import type { Ride, User, Driver, ChatMessage } from '@/lib/types';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, writeBatch, onSnapshot, Unsubscribe, updateDoc, increment, getDoc, limit, addDoc, orderBy, runTransaction, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import RatingForm from '@/components/rating-form';
import { processRating } from '@/ai/flows/process-rating';
import MapView from '@/components/map-view';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DriverDocuments from '@/components/driver/documents';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouteSimulator } from '@/hooks/use-route-simulator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import Chat from '@/components/chat';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogHeader, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useDriverRideStore } from '@/store/driver-ride-store';


const statusConfig: Record<'available' | 'unavailable' | 'on-ride', { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    available: { label: 'Disponible', variant: 'default' },
    unavailable: { label: 'No Disponible', variant: 'secondary' },
    'on-ride': { label: 'En Viaje', variant: 'outline' },
}

const rideStatusConfig: Record<Ride['status'], { label: string; variant: 'secondary' | 'default' | 'destructive' }> = {
  searching: { label: 'Buscando', variant: 'default' },
  accepted: { label: 'Aceptado', variant: 'default' },
  arrived: { label: 'Ha llegado', variant: 'default' },
  'in-progress': { label: 'En Progreso', variant: 'default' },
  completed: { label: 'Completado', variant: 'secondary' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
  'counter-offered': { label: 'Contraoferta', variant: 'default'}
};

type EnrichedRide = Omit<Ride, 'passenger' | 'driver'> & { passenger: User, driver: Driver };

function DriverDashboardPageContent() {
  const { 
    isAvailable,
    incomingRequest, 
    activeRide,
    isCountering,
    setAvailability,
    setIncomingRequest,
    setActiveRide,
    resetDriverState,
    setIsCountering,
  } = useDriverRideStore();

  const { user, driver, setDriver, loading } = useDriverAuth();
  const { toast } = useToast();
  const [allRides, setAllRides] = useState<EnrichedRide[]>([]);
  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);
  const [completedRideForRating, setCompletedRideForRating] = useState<EnrichedRide | null>(null);
  const [isCompletingRide, setIsCompletingRide] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const { startSimulation, stopSimulation, simulatedLocation: driverLocation } = useRouteSimulator();
  const [isDriverChatOpen, setIsDriverChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [rejectedRideIds, setRejectedRideIds] = useState<string[]>([]);
  const [counterOfferAmount, setCounterOfferAmount] = useState(0);

  // MASTER useEffect for driver's active ride
  useEffect(() => {
    if (!driver) return;
    const driverRef = doc(db, 'drivers', driver.id);

    const q = query(
      collection(db, 'rides'),
      where('driver', '==', driverRef),
      where('status', 'in', ['accepted', 'arrived', 'in-progress'])
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (!snapshot.empty) {
        const rideDoc = snapshot.docs[0];
        const rideData = { id: rideDoc.id, ...rideDoc.data() } as Ride;
        
        if (rideData.passenger && driver) {
            const passengerSnap = await getDoc(rideData.passenger);
            if (passengerSnap.exists()) {
                const passengerData = passengerSnap.data() as User;
                const rideWithPassenger = { ...rideData, driver, passenger: passengerData };
                setActiveRide(rideWithPassenger);

                const pickup = { lat: -12.05, lng: -77.05, address: rideData.pickup }; 
                const dropoff = { lat: -12.1, lng: -77.0, address: rideData.dropoff }; 
                
                if (rideData.status === 'accepted' || rideData.status === 'arrived') {
                    const driverInitialPos = driver.location || { lat: -12.045, lng: -77.03 };
                    startSimulation(driverInitialPos, pickup);
                } else if (rideData.status === 'in-progress') {
                    startSimulation(pickup, dropoff);
                }
            }
        }
      } else {
         if (useDriverRideStore.getState().activeRide !== null) {
            stopSimulation();
            setActiveRide(null); 
         }
      }
    });

    return () => unsubscribe();
  }, [driver, setActiveRide, startSimulation, stopSimulation]);

  // MASTER useEffect for new ride requests
  useEffect(() => {
    if (!driver || !isAvailable || activeRide || incomingRequest) return;
    
    // Simpler query, filtering is done client-side
    let q = query(
        collection(db, 'rides'),
        where('status', '==', 'searching')
    );
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
        if (useDriverRideStore.getState().activeRide || useDriverRideStore.getState().incomingRequest) {
            return;
        }

        const potentialRides = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Ride))
            .filter(ride => {
              const alreadyOffered = !!ride.offeredTo;
              const alreadyRejected = rejectedRideIds.includes(ride.id) || ride.rejectedBy?.some(ref => ref.id === driver.id);
              return !alreadyOffered && !alreadyRejected;
            });
        
        if (potentialRides.length === 0) return;
        
        const rideData = potentialRides[0]; 
        const rideRef = doc(db, 'rides', rideData.id);
        
        try {
            await runTransaction(db, async (transaction) => {
                const freshRideDoc = await transaction.get(rideRef);
                if (!freshRideDoc.exists() || freshRideDoc.data().offeredTo) {
                    // Ride was taken by another driver in the meantime
                    return; 
                }
                transaction.update(rideRef, { offeredTo: doc(db, 'drivers', driver.id) });
            });

            // If transaction succeeds, set the incoming request
            const passengerSnap = await getDoc(rideData.passenger);
            if (passengerSnap.exists()) {
                const passengerData = passengerSnap.data() as User;
                setIncomingRequest({ ...rideData, passenger: passengerData });
            }

        } catch (error) {
            console.log("Could not secure ride offer, another driver was faster or ride was cancelled.", error);
        }
    });

    return () => unsubscribe();
  }, [driver, isAvailable, activeRide, incomingRequest, rejectedRideIds, setIncomingRequest]);

    // Listener for chat messages
  useEffect(() => {
    if (!activeRide) return;

    const chatQuery = query(collection(db, 'rides', activeRide.id, 'chatMessages'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(chatQuery, (querySnapshot) => {
        const messages = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
        setChatMessages(messages);
    });

    return () => unsubscribe();
  }, [activeRide, setChatMessages]);


  const handleAvailabilityChange = async (available: boolean) => {
    if (!driver) return;
    setIsUpdatingStatus(true);
    const newStatus = available ? 'available' : 'unavailable';
    const driverRef = doc(db, 'drivers', driver.id);
    
    try {
        await updateDoc(driverRef, { status: newStatus });
        setDriver({ ...driver, status: newStatus });
        setAvailability(available);
        toast({
          title: `Estado actualizado: ${available ? 'Disponible' : 'No Disponible'}`,
          description: available ? 'Ahora recibirás solicitudes de viaje.' : 'Has dejado de recibir solicitudes.',
        });
    } catch (error) {
        console.error("Error updating availability:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar tu estado.'})
    } finally {
        setIsUpdatingStatus(false);
    }
  };

  const handleRideRequestResponse = async (accepted: boolean) => {
    if (!incomingRequest || !driver) return;
    
    const rideId = incomingRequest.id;
    const rideRef = doc(db, 'rides', rideId);
    
    setIncomingRequest(null); 

    if (accepted) {
        try {
            await runTransaction(db, async (transaction) => {
                const rideDoc = await transaction.get(rideRef);
                if (!rideDoc.exists() || !['searching', 'counter-offered'].includes(rideDoc.data().status)) {
                    throw new Error("El viaje ya no está disponible.");
                }
                
                transaction.update(rideRef, {
                    status: 'accepted',
                    driver: doc(db, 'drivers', driver.id),
                    offeredTo: null, 
                });
                transaction.update(doc(db, 'drivers', driver.id), { status: 'on-ride' });
            });
            
            setAvailability(false);
            // setActiveRide({ ...incomingRequest, driver: driver, status: 'accepted' });

        } catch (e: any) {
            console.error("Error accepting ride:", e);
            toast({ variant: 'destructive', title: 'Error', description: e.message || "No se pudo aceptar el viaje."});
        }
    } else {
        setRejectedRideIds(prev => [...prev, rideId]);
        await updateDoc(rideRef, {
            rejectedBy: arrayUnion(doc(db, 'drivers', driver.id)),
            offeredTo: null, 
        });
    }
  };

  const handleCounterOffer = async () => {
    if (!incomingRequest || !counterOfferAmount || !driver) return;
    const rideRef = doc(db, 'rides', incomingRequest.id);

    try {
        await updateDoc(rideRef, {
            fare: counterOfferAmount,
            status: 'counter-offered',
            offeredTo: doc(db, 'drivers', driver.id) 
        });
        toast({ title: 'Contraoferta Enviada', description: `Has propuesto una tarifa de S/${counterOfferAmount.toFixed(2)}`});
        setIncomingRequest(null); 
        setIsCountering(false);
    } catch(e) {
        console.error('Error submitting counter offer:', e);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo enviar la contraoferta.'})
    }
  }


  const handleUpdateRideStatus = async (newStatus: 'arrived' | 'in-progress' | 'completed') => {
    if (!activeRide) return;
    setIsCompletingRide(true);

    const rideRef = doc(db, 'rides', activeRide.id);
    const driverRef = doc(db, 'drivers', activeRide.driver.id);
    
    try {
        if (newStatus === 'completed') {
            const batch = writeBatch(db);
            batch.update(rideRef, { status: 'completed' });
            batch.update(driverRef, { status: 'available' });
            batch.update(doc(db, 'users', activeRide.passenger.id), { totalRides: increment(1) });
            await batch.commit();

            toast({ title: '¡Viaje Finalizado!', description: 'Ahora califica al pasajero.' });
            
            stopSimulation();
            setCompletedRideForRating(activeRide);
            setActiveRide(null);
            setAvailability(true);
        } else {
            await updateDoc(rideRef, { status: newStatus });
            // setActiveRide({...activeRide, status: newStatus}); 
            toast({ title: `¡Estado del viaje actualizado: ${newStatus}!`});
        }
    } catch (error) {
        console.error('Error updating ride status:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el estado del viaje.'});
    } finally {
        setIsCompletingRide(false);
    }
  };

  const handleSosConfirm = async () => {
    if (!activeRide || !user || !driver) return;

    try {
        await addDoc(collection(db, 'sosAlerts'), {
            rideId: activeRide.id,
            passenger: doc(db, 'users', activeRide.passenger.id),
            driver: doc(db, 'drivers', driver.id),
            date: new Date().toISOString(),
            status: 'pending',
            triggeredBy: 'driver'
        });
        toast({
            variant: 'destructive',
            title: '¡Alerta de Pánico Activada!',
            description: 'Se ha notificado a la central de seguridad.',
        });
    } catch (error) {
        console.error("Error creating SOS alert:", error);
         toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No se pudo activar la alerta de pánico.',
        });
    }
  };


  const handleRatingSubmit = async (passengerId: string, rating: number, comment: string) => {
    if (!completedRideForRating) return;
    setIsRatingSubmitting(true);
    try {
      await processRating({
        ratedUserId: passengerId,
        isDriver: false,
        rating,
        comment,
      });
      toast({
        title: 'Pasajero Calificado',
        description: `Has calificado al pasajero con ${rating} estrellas.`,
      });
      setCompletedRideForRating(null);
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

  const handleSendMessage = async (text: string) => {
    if (!user || !activeRide) return;
    
    const chatMessagesRef = collection(db, 'rides', activeRide.id, 'chatMessages');
    await addDoc(chatMessagesRef, {
      userId: user.uid,
      text,
      timestamp: new Date().toISOString()
    });
  }

  
  if (loading || !driver) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const isApproved = driver.documentsStatus === 'approved';

  const renderDashboardContent = () => {
    if(incomingRequest) {
        return (
            <Dialog open={!!incomingRequest} onOpenChange={(open) => { if(!open && !isCountering) handleRideRequestResponse(false)}}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>¡Nueva Solicitud de Viaje!</DialogTitle>
                   <CardDescription>Tienes 30 segundos para responder.</CardDescription>
                </DialogHeader>
                 <div className="space-y-4 py-4">
                    <div className="p-4 bg-muted rounded-lg">
                       <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm">De: <span className="font-medium">{incomingRequest.pickup}</span></p>
                                <p className="text-sm">A: <span className="font-medium">{incomingRequest.dropoff}</span></p>
                            </div>
                            <p className="font-bold text-lg">S/{incomingRequest.fare.toFixed(2)}</p>
                        </div>
                    </div>
                    {isCountering ? (
                      <div className='space-y-2'>
                        <Label htmlFor='counter-offer'>Tu contraoferta (S/)</Label>
                        <Input id='counter-offer' type='number' value={counterOfferAmount} onChange={e => setCounterOfferAmount(Number(e.target.value))} />
                        <Button className='w-full' onClick={handleCounterOffer}>Enviar Contraoferta</Button>
                        <Button className='w-full' variant={'ghost'} onClick={() => setIsCountering(false)}>Cancelar</Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                         <Button className="w-full" onClick={() => handleRideRequestResponse(true)}>Aceptar</Button>
                         <Button className="w-full" variant="outline" onClick={() => { setCounterOfferAmount(incomingRequest.fare); setIsCountering(true); }}>Contraofertar</Button>
                         <Button className="w-full" variant="destructive" onClick={() => handleRideRequestResponse(false)}>Rechazar</Button>
                    </div>
                    )}
                </div>
              </DialogContent>
            </Dialog>
        )
    }
    if (activeRide) {
        return (
             <Card className="border-primary border-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                        <Car className="h-6 w-6" />
                        <span>Viaje Activo</span>
                    </CardTitle>
                    <CardDescription>
                        {activeRide.status === 'accepted' && 'Dirígete al punto de recojo del pasajero.'}
                        {activeRide.status === 'arrived' && 'Esperando al pasajero.'}
                        {activeRide.status === 'in-progress' && 'Llevando al pasajero a su destino.'}
                    </CardDescription>
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
                    {activeRide.status === 'accepted' && <Button className="w-full" onClick={() => handleUpdateRideStatus('arrived')} disabled={isCompletingRide}>He Llegado</Button>}
                    {activeRide.status === 'arrived' && <Button className="w-full" onClick={() => handleUpdateRideStatus('in-progress')} disabled={isCompletingRide}>Iniciar Viaje</Button>}
                    {activeRide.status === 'in-progress' && <Button className="w-full" onClick={() => handleUpdateRideStatus('completed')} disabled={isCompletingRide}>Finalizar Viaje</Button>}
                </CardContent>
            </Card>
        );
    }

    if (completedRideForRating) {
       return (
             <RatingForm
                userToRate={completedRideForRating.passenger}
                isDriver={false}
                onSubmit={(rating, comment) => handleRatingSubmit(completedRideForRating!.passenger.id, rating, comment)}
                isSubmitting={isRatingSubmitting}
            />
        );
    }
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Car className="h-6 w-6 text-primary" />
                    <span>Esperando Solicitudes</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Alert>
                    <AlertTitle>No hay solicitudes pendientes</AlertTitle>
                    <AlertDescription>
                        Cuando un pasajero solicite un viaje, aparecerá aquí.
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
     );
    
  }

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
                        driverLocation={driverLocation}
                        pickupLocation={activeRide ? {lat: 0, lng: 0, address: activeRide.pickup} : null}
                        dropoffLocation={activeRide ? {lat: 0, lng: 0, address: activeRide.dropoff} : null}
                        interactive={false}
                    />
                    {activeRide && (
                       <>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                            <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-4 right-4 h-16 w-16 rounded-full shadow-2xl animate-pulse"
                            >
                                <Siren className="h-8 w-8" />
                            </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                ¿Estás seguro de que quieres activar la alerta de pánico?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                Esta acción notificará inmediatamente a nuestra central de
                                seguridad. Úsalo solo en caso de una emergencia real.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                className="bg-destructive hover:bg-destructive/90"
                                onClick={handleSosConfirm}
                                >
                                Sí, Activar Alerta
                                </AlertDialogAction>
                            </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <Sheet open={isDriverChatOpen} onOpenChange={setIsDriverChatOpen}>
                            <SheetTrigger asChild>
                            <Button
                                size="icon"
                                className="absolute bottom-4 left-4 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
                            >
                                <MessageCircle className="h-7 w-7" />
                            </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-full max-w-sm p-0">
                                <SheetHeader className="p-4 border-b text-left">
                                <SheetTitle className="flex items-center gap-2">
                                    <MessageCircle className="h-5 w-5" />
                                    <span>Chat con {activeRide?.passenger.name}</span>
                                </SheetTitle>
                                </SheetHeader>
                                <Chat
                                    messages={chatMessages}
                                    onSendMessage={handleSendMessage}
                                />
                            </SheetContent>
                        </Sheet>
                        </>
                    )}
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
                                checked={isAvailable}
                                onCheckedChange={handleAvailabilityChange}
                                disabled={!isApproved || !!activeRide || isUpdatingStatus}
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

                    {renderDashboardContent()}

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
                                    <TableCell><Badge variant={rideStatusConfig[ride.status]?.variant || 'secondary'}>{rideStatusConfig[ride.status]?.label || ride.status}</Badge></TableCell>
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
    const { user, loading: authLoading } = useDriverAuth();
    const { isDriver, loading: driverAuthLoading } = useDriverAuth();

    if (authLoading || driverAuthLoading) {
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
                            <Button asChild size="lg">
                                <Link href="/login">
                                    <LogIn className="mr-2"/>
                                    Ir a Iniciar Sesión
                                </Link>
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
                         <CardContent>
                            <Button asChild>
                                <Link href="/driver/register">
                                    ¡Regístrate como Conductor!
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </>
        )
    }

    return <DriverDashboardPageContent />;
}

    
