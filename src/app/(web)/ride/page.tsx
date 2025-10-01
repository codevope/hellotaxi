
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
import { History, Car, Siren, LayoutDashboard, MessageCircle, Bot, X, LogIn, Shield, MapPin } from 'lucide-react';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import SupportChat from '@/components/support-chat';
import { Loader2 } from 'lucide-react';
import { useDriverAuth } from '@/hooks/use-driver-auth';
import Link from 'next/link';
import { doc, onSnapshot, getDoc, collection, query, where, addDoc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getSettings } from '@/services/settings-service';
import Chat from '@/components/chat';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Star } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import RatingForm from '@/components/rating-form';
import { processRating } from '@/ai/flows/process-rating';
import { useRideStore } from '@/store/ride-store';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { EnrichedDriver, Vehicle, DriverWithVehicleInfo } from '@/lib/types';

// Helper function to enrich driver with vehicle information
async function enrichDriverWithVehicle(driver: Driver): Promise<DriverWithVehicleInfo> {
  try {
    const vehicleSnap = await getDoc(driver.vehicle);
    if (vehicleSnap.exists()) {
      const vehicleData = vehicleSnap.data() as Vehicle;
      return {
        ...driver,
        vehicleBrand: vehicleData.brand,
        vehicleModel: vehicleData.model,
        licensePlate: vehicleData.licensePlate,
        vehicleColor: vehicleData.color,
        vehicleYear: vehicleData.year,
      };
    }
  } catch (error) {
    console.error('Error loading vehicle data:', error);
  }
  
  // Fallback if vehicle data can't be loaded
  return {
    ...driver,
    vehicleBrand: 'N/A',
    vehicleModel: 'N/A',
    licensePlate: 'N/A',
  };
}

function RidePageContent() {
  const {
    status,
    activeRide,
    assignedDriver,
    chatMessages,
    isSupportChatOpen,
    pickupLocation,
    dropoffLocation,
    driverLocation,
    setActiveRide,
    setChatMessages,
    setDriverLocation,
    assignDriver,
    completeRideForRating,
    resetRide,
    resetAll,
    toggleSupportChat,
    setCounterOffer,
    setStatus,
  } = useRideStore();
  
  const [activeTab, setActiveTab] = useState('book');
  const [isCancelReasonDialogOpen, setIsCancelReasonDialogOpen] = useState(false);
  const [isDriverChatOpen, setIsDriverChatOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<Awaited<ReturnType<typeof getSettings>> | null>(null);
  const [isRatingSubmitting, setIsSubmittingRating] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    getSettings().then(setAppSettings);
  }, []);

  // MASTER useEffect to listen for ride document changes and update UI state
  useEffect(() => {
    if (!user?.uid) {
      if (useRideStore.getState().status !== 'idle') {
        resetRide();
      }
      return;
    }
    
    // This query finds any ride for the user that isn't in a final state.
    const q = query(
        collection(db, 'rides'), 
        where('passenger', '==', doc(db, 'users', user.uid))
    );
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
        console.log('📡 Snapshot received, docs count:', snapshot.docs.length);
        
        const activeRides = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Ride))
          .filter(ride => !['completed', 'cancelled'].includes(ride.status) || (ride.status === 'completed' && !ride.isRatedByPassenger));

        console.log('🔍 Active rides found:', activeRides.length);

        if (activeRides.length === 0) {
            // Only reset if we are not in the middle of rating a just-completed ride.
            if (useRideStore.getState().status !== 'rating') {
               console.log('🔄 No active rides, resetting');
               resetRide();
            }
            return;
        }
        
        const rideData = activeRides[0]; // Assuming user has only one active ride
        console.log('🚗 Processing ride:', { id: rideData.id, status: rideData.status });
        
        setActiveRide(rideData);

        switch (rideData.status) {
            case 'searching':
                console.log('🔍 Setting status to searching');
                setStatus('searching');
                break;
            
            case 'counter-offered':
                console.log('💰 Counter offer received:', rideData.fare);
                if (useRideStore.getState().counterOfferValue !== rideData.fare) {
                  setCounterOffer(rideData.fare);
                }
                break;
            
            case 'accepted':
            case 'arrived':
            case 'in-progress':
                console.log('👨‍💼 Driver assigned, status:', rideData.status);
                setStatus('assigned');
                if (rideData.driver) {
                    const driverSnap = await getDoc(rideData.driver);
                    if (driverSnap.exists()) {
                        const driverData = { id: driverSnap.id, ...driverSnap.data() } as Driver;
                        const enrichedDriver = await enrichDriverWithVehicle(driverData);
                        assignDriver(enrichedDriver);
                        if (driverData.location) {
                            setDriverLocation(driverData.location);
                        }
                    }
                }
                break;
            
            case 'completed':
                 console.log('✅ Ride completed');
                 if (!rideData.isRatedByPassenger) {
                    if(rideData.driver) {
                        const driverSnap = await getDoc(rideData.driver);
                         if (driverSnap.exists()) {
                            const driverData = { id: driverSnap.id, ...driverSnap.data() } as Driver;
                            const enrichedDriver = await enrichDriverWithVehicle(driverData);
                            completeRideForRating(enrichedDriver);
                        }
                    }
                 }
                break;
                
            default:
                console.log('⚠️ Unknown ride status:', rideData.status);
                break;
        }
    });

    return () => unsubscribe();
  }, [user?.uid, assignDriver, resetRide, setActiveRide, setCounterOffer, setDriverLocation, setStatus, completeRideForRating]);


  // Listener for chat messages
  useEffect(() => {
    if (!activeRide || status !== 'assigned') return;

    const chatQuery = query(collection(db, 'rides', activeRide.id, 'chatMessages'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(chatQuery, (querySnapshot) => {
        const messages = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
        setChatMessages(messages);
    });

    return () => unsubscribe();
  }, [activeRide, status, setChatMessages]);


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

  const handleCancelRide = async (reason: CancellationReason) => {
    const currentRide = useRideStore.getState().activeRide;
    if (!currentRide) return;

    const rideRef = doc(db, 'rides', currentRide.id);
    
    try {
        await updateDoc(rideRef, {
            status: 'cancelled',
            cancellationReason: reason,
            cancelledBy: 'passenger'
        });
        
        toast({
            title: 'Viaje Cancelado',
            description: `Motivo: ${reason.reason}.`,
        });
        resetRide();
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
    const currentRide = useRideStore.getState().activeRide;
    const currentDriver = useRideStore.getState().assignedDriver;
    if (!currentDriver || !currentRide) return;
    
    setIsSubmittingRating(true);

    try {
      await processRating({
        ratedUserId: currentDriver.id,
        isDriver: true,
        rating,
        comment,
      });

      const rideRef = doc(db, 'rides', currentRide.id);
      await updateDoc(rideRef, { isRatedByPassenger: true });
      
      toast({
        title: '¡Gracias por tu calificación!',
        description: 'Tu opinión ayuda a mantener la calidad de nuestra comunidad.',
      });
      completeRideForRating(currentDriver); // This will set the status to 'rating'
      resetAll(); // This will clear everything including pickup/dropoff locations
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
                        pickupLocation={pickupLocation}
                        dropoffLocation={dropoffLocation}
                    />

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
                            <TabsTrigger value="book">
                            <Car className="mr-2 h-4 w-4" /> Pedir Viaje
                            </TabsTrigger>
                            <TabsTrigger value="history">
                            <History className="mr-2 h-4 w-4" /> Historial
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="book" className="p-6">
                            
                            {status === 'searching' && (
                                <div className="space-y-6">
                                    {/* Trip Details Card */}
                                    <Card>
                                        <CardContent className="p-6">
                                            <h3 className="font-semibold text-lg mb-4">Detalles de tu viaje</h3>
                                            <div className="space-y-4">
                                                <div className="flex items-start space-x-3">
                                                    <MapPin className="h-5 w-5 text-green-600 mt-1" />
                                                    <div>
                                                        <p className="font-medium text-gray-900">Recojo</p>
                                                        <p className="text-gray-600 text-sm">{pickupLocation?.address || activeRide?.pickup}</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-start space-x-3">
                                                    <MapPin className="h-5 w-5 text-red-600 mt-1" />
                                                    <div>
                                                        <p className="font-medium text-gray-900">Destino</p>
                                                        <p className="text-gray-600 text-sm">{dropoffLocation?.address || activeRide?.dropoff}</p>
                                                    </div>
                                                </div>
                                                
                                                {activeRide && (
                                                    <div className="border-t pt-4">
                                                        <div className="flex justify-between items-center">
                                                            <span className="font-semibold">Precio</span>
                                                            <span className="font-bold text-primary text-lg">S/ {activeRide.fare.toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                    
                                    {/* Searching Status */}
                                    <div className="flex flex-col items-center justify-center text-center space-y-4 p-8">
                                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                        <p className="font-semibold text-lg">Buscando conductor...</p>
                                        <p className="text-muted-foreground">Estamos encontrando el mejor conductor para ti.</p>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="outline" className="mt-4">
                                                    <X className="mr-2 h-4 w-4" /> Cancelar Búsqueda
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>¿Cancelar la búsqueda?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    ¿Estás seguro de que quieres cancelar la búsqueda de tu viaje?
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>No, continuar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleCancelRide({code: 'PASSENGER_CANCELLED_SEARCH', reason: 'Pasajero canceló búsqueda'})}>
                                                    Sí, cancelar
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
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
                            {status === 'counter-offered' && useRideStore.getState().counterOfferValue && activeRide && (
                                <Card className="border-blue-200 shadow-lg">
                                  <CardContent className="p-0">
                                    <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 text-white">
                                      <div className="text-center space-y-4">
                                        <h3 className="text-xl font-bold">
                                          Nueva Contraoferta Recibida
                                        </h3>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                                          <div className="flex justify-between items-center mb-3">
                                            <span className="text-blue-100">Tarifa Original:</span>
                                            <span className="font-semibold text-white">S/{activeRide.fare.toFixed(2)}</span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-blue-100">Contraoferta del Conductor:</span>
                                            <span className="font-bold text-2xl text-yellow-300">S/{useRideStore.getState().counterOfferValue?.toFixed(2)}</span>
                                          </div>
                                        </div>
                                        <p className="text-blue-100">
                                          ¿Deseas aceptar esta nueva tarifa?
                                        </p>
                                      </div>
                                    </div>
                                    <div className="p-6">
                                      <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                                        <Button 
                                          className='w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 rounded-lg shadow-md transition-all duration-200' 
                                          onClick={async () => {
                                        try {
                                          const rideRef = doc(db, 'rides', activeRide.id);
                                          
                                          // Get the driver reference from offeredTo field
                                          const currentRideDoc = await getDoc(rideRef);
                                          if (!currentRideDoc.exists()) {
                                            throw new Error('Ride not found');
                                          }
                                          
                                          const currentRideData = currentRideDoc.data();
                                          const driverRef = currentRideData.offeredTo; // This is the driver who made the counter-offer
                                          
                                          if (!driverRef) {
                                            throw new Error('Driver reference not found');
                                          }
                                          
                                          console.log('🎯 Accepting counter-offer and assigning driver:', driverRef.id);
                                          
                                          await updateDoc(rideRef, { 
                                            status: 'accepted',
                                            fare: useRideStore.getState().counterOfferValue,
                                            driver: driverRef, // Assign the driver to the ride
                                            offeredTo: null 
                                          });
                                          
                                          setCounterOffer(null);
                                          setStatus('assigned');
                                          toast({
                                            title: 'Contraoferta aceptada',
                                            description: `Has aceptado la tarifa de S/${useRideStore.getState().counterOfferValue?.toFixed(2)}`,
                                          });
                                        } catch (error) {
                                          console.error('Error accepting counter-offer:', error);
                                          toast({
                                            variant: 'destructive',
                                            title: 'Error',
                                            description: 'No se pudo aceptar la contraoferta.',
                                          });
                                        }
                                      }}
                                    >
                                          Aceptar Contraoferta S/{useRideStore.getState().counterOfferValue?.toFixed(2)}
                                        </Button>
                                        <Button 
                                          className='w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 rounded-lg shadow-md transition-all duration-200' 
                                          onClick={() => {
                                            handleCancelRide({code: 'REJECTED_COUNTER', reason: 'Contraoferta rechazada'})
                                          }}
                                        >
                                          Rechazar y Cancelar
                                        </Button>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                            )}
                            {(status === 'idle' || status === 'calculating' || status === 'calculated' || status === 'confirmed') && (
                                <RideRequestForm onRideCreated={(ride) => {
                                  console.log('🚗 Ride created:', ride);
                                  setActiveRide(ride);
                                  setStatus('searching');
                                }} />
                            )}
                            {status === 'rating' && assignedDriver && (
                            <RatingForm
                                userToRate={assignedDriver}
                                isDriver={true}
                                onSubmit={handleRatingSubmit}
                                isSubmitting={isRatingSubmitting}
                            />
                            )}
                            
                            {/* Fallback for unexpected states */}
                            {!['searching', 'assigned', 'rating', 'counter-offered', 'idle', 'calculating', 'calculated', 'confirmed'].includes(status) && (
                                <div className="text-center p-8">
                                    <p className="text-muted-foreground">Estado inesperado: {status}</p>
                                    <Button onClick={() => {
                                        console.log('🔄 Resetting ride state');
                                        resetRide();
                                    }}>
                                        Reiniciar
                                    </Button>
                                </div>
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
                        onClick={() => { 
                            handleCancelRide(reason);
                            setIsCancelReasonDialogOpen(false);
                         }}
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
    const { user, appUser, loading } = useAuth();
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

    // Check if user has complete profile (Google + Password + Phone)
    const providerIds = user.providerData.map((p) => p.providerId);
    const hasGoogle = providerIds.includes('google.com');
    const hasPassword = providerIds.includes('password');
    const hasPhoneInProfile = appUser?.phone && appUser.phone.trim().length > 0;
    const isProfileComplete = hasGoogle && hasPassword && hasPhoneInProfile;

    if (!isProfileComplete) {
        return (
            <>
            <AppHeader />
            <main className="flex flex-col items-center justify-center p-4 py-16 text-center md:py-24">
                <Card className="max-w-md p-8">
                    <CardHeader>
                        <div className="flex flex-col items-center gap-4">
                            <Shield className="h-16 w-16 text-amber-500" />
                            <CardTitle>Perfil Incompleto</CardTitle>
                        </div>
                        <CardDescription>
                            Para pedir un viaje necesitas completar tu perfil de seguridad:
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-left space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                {hasGoogle ? (
                                    <div className="h-4 w-4 rounded-full bg-green-500" />
                                ) : (
                                    <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                                )}
                                <span className={hasGoogle ? 'text-green-700' : 'text-gray-500'}>
                                    Cuenta Google vinculada
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                {hasPassword ? (
                                    <div className="h-4 w-4 rounded-full bg-green-500" />
                                ) : (
                                    <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                                )}
                                <span className={hasPassword ? 'text-green-700' : 'text-gray-500'}>
                                    Contraseña configurada
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                {hasPhoneInProfile ? (
                                    <div className="h-4 w-4 rounded-full bg-green-500" />
                                ) : (
                                    <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                                )}
                                <span className={hasPhoneInProfile ? 'text-green-700' : 'text-gray-500'}>
                                    Teléfono registrado
                                </span>
                            </div>
                        </div>
                        <Button asChild size="lg" className="w-full">
                            <Link href="/profile">
                                <Shield className="mr-2 h-4 w-4"/>
                                Completar mi Perfil
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
