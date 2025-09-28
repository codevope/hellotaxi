

'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppHeader from '@/components/app-header';
import MapView from '@/components/map-view';
import RideRequestForm from '@/components/ride-request-form';
import RideHistory from '@/components/ride-history';
import type { Ride, Driver, ChatMessage, CancellationReason, User } from '@/lib/types';
import { History, Car, Siren, LayoutDashboard, MessageCircle, Bot, X, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import SupportChat from '@/components/support-chat';
import { Loader2 } from 'lucide-react';
import { useDriverAuth } from '@/hooks/use-driver-auth';
import Link from 'next/link';
import { doc, onSnapshot, getDoc, collection, query, where, addDoc, updateDoc, orderBy, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getSettings } from '@/services/settings-service';
import Chat from '@/components/chat';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Star } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import RatingForm from '@/components/rating-form';
import { processRating } from '@/ai/flows/process-rating';
import { GoogleIcon } from '@/components/google-icon';
import { useRouteSimulator } from '@/hooks/use-route-simulator';
import type { Location } from '@/lib/types';
import { useRideStore } from '@/store/ride-store';

function RidePageContent() {
  const {
    status,
    activeRide,
    assignedDriver,
    chatMessages,
    isSupportChatOpen,
    pickupLocation,
    dropoffLocation,
    setActiveRide,
    setAssignedDriver,
    setChatMessages,
    setPickupLocation,
    setDropoffLocation,
    startSearch,
    assignDriver,
    updateRideStatus,
    completeRideForRating,
    resetRide,
    toggleSupportChat,
  } = useRideStore();
  
  const [activeTab, setActiveTab] = useState('book');
  const [isCancelReasonDialogOpen, setIsCancelReasonDialogOpen] = useState(false);
  const [isDriverChatOpen, setIsDriverChatOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<Awaited<ReturnType<typeof getSettings>> | null>(null);
  const [isRatingSubmitting, setIsSubmittingRating] = useState(false);
  const { startSimulation, stopSimulation, simulatedLocation: driverLocation } = useRouteSimulator();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    getSettings().then(setAppSettings);
  }, []);

  // Listener for active ride changes
  useEffect(() => {
    if (!user?.uid) return;
    
    let unsubscribe: () => void;

    const q = query(
        collection(db, 'rides'), 
        where('passenger', '==', doc(db, 'users', user.uid)), 
        where('status', 'in', ['searching', 'accepted', 'arrived', 'in-progress', 'completed'])
    );
    
    unsubscribe = onSnapshot(q, async (snapshot) => {
        if (snapshot.empty) {
            resetRide();
            return;
        }

        const rideDoc = snapshot.docs.find(doc => doc.data().status !== 'completed' && doc.data().status !== 'cancelled') || snapshot.docs[0];
        const rideData = { id: rideDoc.id, ...rideDoc.data() } as Ride;
        const previousStatus = activeRide?.status;
        setActiveRide(rideData);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = null;
        }

        if (rideData.status === 'completed') {
            const isRated = (rideData as any).isRatedByPassenger === true;
            if (!isRated && rideData.driver) {
                const driverSnap = await getDoc(rideData.driver);
                 if (driverSnap.exists()) {
                    const driverData = { id: driverSnap.id, ...driverSnap.data() } as Driver;
                    completeRideForRating(driverData);
                 }
            } else {
                resetRide();
            }
            return;
        }

        if (rideData.driver) {
             const driverSnap = await getDoc(rideData.driver);
             if (driverSnap.exists()) {
                const driverData = {id: driverSnap.id, ...driverSnap.data()} as Driver;
                if (assignedDriver?.id !== driverData.id) {
                  assignDriver(driverData);
                }
                
                const pLoc = pickupLocation || { lat: -12.05, lng: -77.05, address: rideData.pickup };
                const dLoc = dropoffLocation || { lat: -12.10, lng: -77.03, address: rideData.dropoff };
                const driverInitialPos = (driverData as any).location || { lat: -12.045, lng: -77.03 };

                if (rideData.status === 'accepted' && previousStatus !== 'accepted') {
                  toast({ title: '¡Conductor Encontrado!', description: `${driverData.name} está en camino.`});
                  updateRideStatus('assigned');
                  startSimulation(driverInitialPos, pLoc);
                } else if (rideData.status === 'arrived' && previousStatus !== 'arrived') {
                  toast({ title: '¡Tu conductor ha llegado!', description: 'Por favor, acércate al punto de recojo.'});
                  updateRideStatus('assigned');
                } else if (rideData.status === 'in-progress') {
                   if(previousStatus !== 'in-progress') toast({ title: '¡Viaje iniciado!', description: 'Que tengas un buen viaje.'});
                   updateRideStatus('assigned');
                   startSimulation(pLoc, dLoc);
                }
             }
        } else {
          startSearch();
        }
    });

    return () => {
        if(unsubscribe) unsubscribe();
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);


  // Listener for chat messages
  useEffect(() => {
    if (!activeRide || status !== 'assigned') return;

    const chatQuery = query(collection(db, 'rides', activeRide.id, 'chatMessages'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(chatQuery, (querySnapshot) => {
        const messages = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
        setChatMessages(messages);
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRide, status]);


  const handleSosConfirm = async () => {
    if (!activeRide || !user || !assignedDriver) return;

    try {
        await addDoc(collection(db, 'sosAlerts'), {
            rideId: activeRide.id,
            passenger: doc(db, 'users', user.uid),
            driver: doc(db, 'drivers', assignedDriver.id),
            date: new Date().toISOString(),
            status: 'pending',
            triggeredBy: 'passenger'
        });
        toast({
            variant: 'destructive',
            title: '¡Alerta de Pánico Activada!',
            description: 'Se ha notificado a la central de seguridad. Mantén la calma, la ayuda está en camino.',
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

  const handleRideCreated = (ride: Ride) => {
    setActiveRide(ride);
    startSearch();

    // Set a timeout to cancel the search if no driver is found
    searchTimeoutRef.current = setTimeout(async () => {
        const currentRideSnap = await getDoc(doc(db, 'rides', ride.id));
        if (currentRideSnap.exists() && currentRideSnap.data().status === 'searching') {
            await handleCancelRide({ code: 'NO_DRIVERS', reason: 'No se encontraron conductores' }, true);
        }
    }, 60000); // 60 seconds
  }

  const handleCancelRide = async (reason: CancellationReason, isAutomatic: boolean = false) => {
    if (!activeRide) return;

    const rideRef = doc(db, 'rides', activeRide.id);
    
    try {
        await updateDoc(rideRef, {
            status: 'cancelled',
            cancellationReason: reason,
            cancelledBy: isAutomatic ? 'system' : 'passenger'
        });
        
        if(isAutomatic) {
             toast({
                variant: 'destructive',
                title: 'Búsqueda de Conductor Expirada',
                description: 'No hemos encontrado conductores disponibles. Intenta ofrecer una tarifa más alta o prueba más tarde.',
            });
        } else {
             toast({
                title: 'Viaje Cancelado',
                description: `Motivo: ${reason.reason}.`,
            });
        }
        resetRide();
        stopSimulation();
        setActiveTab('book');

    } catch (error) {
        console.error('Error cancelling ride:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cancelar el viaje.' });
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

  const handleRatingSubmit = async (rating: number, comment: string) => {
    if (!assignedDriver || !activeRide) return;
    setIsSubmittingRating(true);

    try {
      await processRating({
        ratedUserId: assignedDriver.id,
        isDriver: true,
        rating,
        comment,
      });

      // Mark the ride as rated by the passenger
      const rideRef = doc(db, 'rides', activeRide.id);
      await updateDoc(rideRef, { isRatedByPassenger: true });
      
      toast({
        title: '¡Gracias por tu calificación!',
        description: 'Tu opinión ayuda a mantener la calidad de nuestra comunidad.',
      });
      resetRide();
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        variant: 'destructive',
        title: 'Error al Calificar',
        description: 'No se pudo guardar tu calificación. Por favor, intenta de nuevo.',
      });
    } finally {
      setIsSubmittingRating(false);
    }
  }


  return (
      <div className="flex flex-col h-screen bg-background">
        <AppHeader />
        <main className="flex-1 p-4 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 flex flex-col min-h-[60vh] rounded-xl overflow-hidden shadow-lg relative">
                    <MapView 
                        driverLocation={driverLocation}
                        activeRide={activeRide} 
                    />

                    {/* Floating Action Buttons */}
                    <Sheet open={isSupportChatOpen} onOpenChange={toggleSupportChat}>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="absolute top-4 left-4 h-14 w-14 rounded-full shadow-lg border-2 border-primary/50 bg-background"
                            >
                                <Bot className="h-7 w-7 text-primary" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-full max-w-sm p-0">
                            <SupportChat />
                        </SheetContent>
                    </Sheet>

                    {status === 'assigned' && (
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
                                seguridad con tu ubicación actual y los detalles de tu
                                viaje. Úsalo solo en caso de una emergencia real.
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
                                    <span>Chat con {assignedDriver?.name}</span>
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
        
                <Card className="shadow-lg">
                    <CardContent className="p-0">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 rounded-t-lg rounded-b-none">
                            <TabsTrigger value="book" disabled={status !== 'idle'}>
                            <Car className="mr-2 h-4 w-4" /> Pedir Viaje
                            </TabsTrigger>
                            <TabsTrigger value="history">
                            <History className="mr-2 h-4 w-4" /> Historial
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="book" className="p-6">
                            {status === 'searching' && (
                                <div className="flex flex-col items-center justify-center text-center space-y-4 p-8">
                                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                    <p className="font-semibold text-lg">Buscando conductor...</p>
                                    <p className="text-muted-foreground">Estamos encontrando el mejor conductor para ti.</p>
                                </div>
                            )}
                            {status === 'assigned' && activeRide && assignedDriver && (
                            <Card className="border-0 shadow-none">
                                <CardHeader>
                                <CardTitle>
                                    {activeRide.status === 'accepted' && '¡Tu conductor está en camino!'}
                                    {activeRide.status === 'arrived' && '¡Tu conductor ha llegado!'}
                                    {activeRide.status === 'in-progress' && 'Viaje en Progreso'}
                                </CardTitle>
                                <CardDescription>
                                    {activeRide.status === 'accepted' && 'Mantente atento al punto de recojo.'}
                                    {activeRide.status === 'arrived' && 'Por favor, acércate a tu conductor.'}
                                    {activeRide.status === 'in-progress' && 'Disfruta tu viaje a tu destino.'}
                                </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-12 w-12">
                                    <AvatarImage src={assignedDriver.avatarUrl} alt={assignedDriver.name}/>
                                    <AvatarFallback>{assignedDriver.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                    <p className="font-bold text-md">{assignedDriver.name}</p>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />{' '}
                                        {assignedDriver.rating.toFixed(1)}
                                    </div>
                                    <p className="text-xs">
                                        {assignedDriver.vehicleBrand} {assignedDriver.vehicleModel} -{' '}
                                        {assignedDriver.licensePlate}
                                    </p>
                                    </div>
                                    <p className="font-bold text-lg text-right flex-1">
                                    S/{activeRide.fare.toFixed(2)}
                                    </p>
                                </div>
                                <Separator />
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" className="w-full">
                                        <X className="mr-2 h-4 w-4" /> Cancelar Viaje
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>¿Seguro que quieres cancelar?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta acción podría afectar negativamente tu calificación como pasajero. ¿Aún deseas cancelar?
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>No, continuar viaje</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => setIsCancelReasonDialogOpen(true)}
                                        >
                                            Sí, cancelar
                                        </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                    </AlertDialog>
                                </CardContent>
                            </Card>
                            )}
                            {status === 'idle' && (
                                <RideRequestForm 
                                    onRideCreated={handleRideCreated}
                                />
                            )}
                            {status === 'rating' && assignedDriver && activeRide && (
                            <RatingForm
                                userToRate={assignedDriver}
                                isDriver={true}
                                onSubmit={handleRatingSubmit}
                                isSubmitting={isRatingSubmitting}
                            />
                            )}
                        </TabsContent>
                        <TabsContent value="history" className="p-6">
                            <RideHistory />
                        </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>

            <Dialog
                open={isCancelReasonDialogOpen}
                onOpenChange={setIsCancelReasonDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                    <DialogTitle>¿Por qué estás cancelando?</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 py-4">
                    {appSettings?.cancellationReasons.map((reason) => (
                        <Button
                        key={reason.code}
                        variant="outline"
                        className="w-full justify-start text-left h-auto py-3"
                        onClick={() => handleCancelRide(reason)}
                        >
                        {reason.reason}
                        </Button>
                    ))}
                    </div>
                </DialogContent>
            </Dialog>

        </main>
      </div>
  );
}

export default function RidePage() {
    const { user, loading } = useAuth();
    const { isDriver, loading: driverLoading } = useDriverAuth();
    
    if (loading || driverLoading) {
      return (
         <div className="flex h-screen w-full items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )
    }
    
    if (!user) {
        return (
            <>
            <AppHeader />
            <main className="flex flex-col items-center justify-center p-4 py-16 text-center md:py-24">
                <Card className="max-w-md p-8">
                    <CardHeader>
                        <CardTitle>Inicia sesión para viajar</CardTitle>
                        <CardDescription>
                            Para solicitar un viaje y acceder a todas las funciones, por favor, inicia sesión.
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

    if (isDriver) {
        return (
             <>
                <AppHeader />
                <main className="flex flex-col items-center justify-center p-8 text-center md:py-24">
                    <Card className="max-w-md p-8">
                        <CardHeader>
                            <CardTitle>Función solo para Pasajeros</CardTitle>
                            <CardDescription>
                                Estás en tu rol de conductor. Para pedir un viaje, necesitas volver a tu rol de pasajero desde tu perfil.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild>
                                <Link href="/driver/dashboard">
                                    <LayoutDashboard className="mr-2"/>
                                    Ir a mi Panel de Conductor
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </main>
            </>
        )
    }

    return <RidePageContent />;
}

    

