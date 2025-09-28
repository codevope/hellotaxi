'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppHeader from '@/components/app-header';
import MapView from '@/components/map-view';
import RideRequestForm from '@/components/ride-request-form';
import RideHistory from '@/components/ride-history';
import { MapProvider } from '@/contexts/map-context';
import type { Ride, Driver, ChatMessage, CancellationReason, User } from '@/lib/types';
import { History, Car, Siren, LayoutDashboard, MessageSquare as ChatIcon } from 'lucide-react';
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
import { Loader2, MessageSquare } from 'lucide-react';
import { useDriverAuth } from '@/hooks/use-driver-auth';
import Link from 'next/link';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getSettings } from '@/services/settings-service';
import Chat from '@/components/chat';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Star, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import RatingForm from '@/components/rating-form';
import { processRating } from '@/ai/flows/process-rating';


function RidePageContent() {
  const [activeTab, setActiveTab] = useState('book');
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [assignedDriver, setAssignedDriver] = useState<Driver | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isCancelReasonDialogOpen, setIsCancelReasonDialogOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<Awaited<ReturnType<typeof getSettings>> | null>(null);
  const [status, setStatus] = useState<'idle' | 'completed' | 'rating'>('idle');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const { toast } = useToast();
  
  useEffect(() => {
    getSettings().then(setAppSettings);
  }, []);

  const handleSosConfirm = () => {
    toast({
      variant: 'destructive',
      title: '¡Alerta de Pánico Activada!',
      description:
        'Se ha notificado a la central de seguridad. Mantén la calma, la ayuda está en camino.',
    });
  };

  const handleRideAssigned = (ride: Ride, driver: Driver) => {
    setActiveRide(ride);
    setAssignedDriver(driver);
    setChatMessages([
        { sender: driver.name, text: '¡Hola! Ya estoy en camino.', timestamp: new Date().toISOString(), isDriver: true, },
    ]);
    setActiveTab('active-ride');
  }

  const resetRide = () => {
    setActiveRide(null);
    setAssignedDriver(null);
    setChatMessages([]);
    setActiveTab('book');
    setStatus('idle');
  }

  const handleCancelRide = async (reason: CancellationReason) => {
    if (!activeRide || !assignedDriver) return;

    const rideRef = doc(db, 'rides', activeRide.id);
    const driverRef = doc(db, 'drivers', assignedDriver.id);

    try {
      const batch = writeBatch(db);
      batch.update(rideRef, {
        status: 'cancelled',
        cancellationReason: reason,
        cancelledBy: 'passenger'
      });
      batch.update(driverRef, { status: 'available' });
      await batch.commit();

      toast({
        title: 'Viaje Cancelado',
        description: `Motivo: ${reason.reason}.`,
      });
      resetRide();
    } catch (error) {
      console.error('Error cancelling ride:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cancelar el viaje.' });
    }
  }

  const handleSendMessage = (text: string) => {
    const newMessage: ChatMessage = {
      sender: 'Tú',
      text,
      timestamp: new Date().toISOString(),
      isDriver: false,
    };
    setChatMessages((prev) => [...prev, newMessage]);

    if (assignedDriver) {
      setTimeout(() => {
        const reply: ChatMessage = {
          sender: assignedDriver.name,
          text: 'Entendido. Llego en 5 minutos.',
          timestamp: new Date().toISOString(),
          isDriver: true,
        };
        setChatMessages((prev) => [...prev, reply]);
      }, 2000);
    }
  }

  const handleRatingSubmit = async (rating: number, comment: string) => {
    if (!assignedDriver) return;
    setIsSubmittingRating(true);

    try {
      await processRating({
        ratedUserId: assignedDriver.id,
        isDriver: true,
        rating,
        comment,
      });
      toast({
        title: '¡Gracias por tu calificación!',
        description:
          'Tu opinión ayuda a mantener la calidad de nuestra comunidad.',
      });
      resetRide();
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        variant: 'destructive',
        title: 'Error al Calificar',
        description:
          'No se pudo guardar tu calificación. Por favor, intenta de nuevo.',
      });
    } finally {
      setIsSubmittingRating(false);
    }
  }


  return (
    <MapProvider>
      <div className="flex flex-col h-screen bg-background">
        <AppHeader />
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 p-4 lg:p-8 min-h-0">
            <div className="lg:col-span-2 flex flex-col min-h-0 rounded-xl overflow-hidden shadow-lg">
            <MapView activeRide={activeRide} />
          </div>
   
        <Card className="shadow-lg">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 rounded-t-lg rounded-b-none">
                <TabsTrigger value="book" disabled={!!activeRide}>
                  <Car className="mr-2 h-4 w-4" /> Pedir Viaje
                </TabsTrigger>
                <TabsTrigger value="history" disabled={!!activeRide}>
                  <History className="mr-2 h-4 w-4" /> Historial
                </TabsTrigger>
                <TabsTrigger value="active-ride" disabled={!activeRide}>
                    <ChatIcon className="mr-2 h-4 w-4" /> Viaje en Curso
                </TabsTrigger>
              </TabsList>

              <TabsContent value="book" className="p-6">
                 {status !== 'rating' ? (
                  <RideRequestForm onRideAssigned={handleRideAssigned} />
                 ) : assignedDriver && (
                  <RatingForm
                    userToRate={assignedDriver}
                    isDriver={true}
                    onSubmit={handleRatingSubmit}
                    isSubmitting={isSubmittingRating}
                  />
                 )}
              </TabsContent>
              <TabsContent value="history" className="p-6">
                <RideHistory />
              </TabsContent>
              <TabsContent value="active-ride" className="p-0">
                {assignedDriver && activeRide && (
                   <div className="space-y-4 h-full flex flex-col p-4">
                      <CardHeader className="p-2">
                        <CardTitle>¡Tu conductor está en camino!</CardTitle>
                        <CardDescription>Llegada estimada: 5 minutos.</CardDescription>
                      </CardHeader>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={assignedDriver.avatarUrl}
                            alt={assignedDriver.name}
                          />
                          <AvatarFallback>
                            {assignedDriver.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-md">{assignedDriver.name}</p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />{' '}
                            {assignedDriver.rating}
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
                       <Card className="flex-1 flex flex-col">
                        <CardHeader className="p-4 flex-row items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            <CardTitle className="text-xl">Chat con el Conductor</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 flex flex-col">
                            <Chat
                            messages={chatMessages}
                            onSendMessage={handleSendMessage}
                            />
                        </CardContent>
                      </Card>
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
                    </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {activeRide && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                className="absolute bottom-20 right-8 lg:right-[calc(33.33%+2rem)] lg:bottom-20 h-16 w-16 rounded-full shadow-2xl animate-pulse"
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
        )}

        <Sheet>
          <SheetTrigger asChild>
              <Button
              variant="outline"
              size="icon"
              className="absolute bottom-4 left-4 h-14 w-14 rounded-full shadow-lg border-2 border-primary/50"
            >
              <MessageSquare className="h-7 w-7 text-primary" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full max-w-sm p-0">
              <SupportChat />
          </SheetContent>
        </Sheet>

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
    </MapProvider>
  );
}

export default function RidePage() {
    const { user, loading, signInWithGoogle } = useAuth();
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
            <div className="flex flex-col items-center justify-center text-center flex-1 p-8">
                <Card className="max-w-md p-8">
                    <CardHeader>
                        <CardTitle>Inicia sesión para viajar</CardTitle>
                        <CardDescription>
                            Para solicitar un viaje y acceder a todas las funciones, por favor, inicia sesión.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Button onClick={signInWithGoogle} size="lg">Iniciar Sesión con Google</Button>
                    </CardContent>
                </Card>
            </div>
            </>
        )
    }

    if (isDriver) {
        return (
             <>
                <AppHeader />
                <div className="flex flex-col items-center justify-center text-center flex-1 p-8">
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
                </div>
            </>
        )
    }

    return <RidePageContent />;
}
