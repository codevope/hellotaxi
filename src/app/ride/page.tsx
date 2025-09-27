'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppHeader from '@/components/app-header';
import MapView from '@/components/map-view';
import RideRequestForm from '@/components/ride-request-form';
import RideHistory from '@/components/ride-history';
import { MapProvider } from '@/contexts/map-context';
import type { Ride } from '@/lib/types';
import { CircleDollarSign, History, Car, Siren, LayoutDashboard } from 'lucide-react';
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

function RidePageContent() {
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const { toast } = useToast();
  
  const handleSosConfirm = () => {
    toast({
      variant: 'destructive',
      title: '¡Alerta de Pánico Activada!',
      description:
        'Se ha notificado a la central de seguridad. Mantén la calma, la ayuda está en camino.',
    });
  };

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
            <Tabs defaultValue="book" className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-t-lg rounded-b-none">
                <TabsTrigger value="book">
                  <Car className="mr-2 h-4 w-4" /> Pedir Viaje
                </TabsTrigger>
                <TabsTrigger value="history">
                  <History className="mr-2 h-4 w-4" /> Historial
                </TabsTrigger>
              </TabsList>
              <TabsContent value="book" className="p-6">
                <RideRequestForm setActiveRide={setActiveRide} />
              </TabsContent>
              <TabsContent value="history" className="p-6">
                <RideHistory />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {activeRide && activeRide.status === 'in-progress' && (
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
          <SheetContent side="left" className="w-full max-w-sm">
              <SupportChat />
          </SheetContent>
        </Sheet>

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
