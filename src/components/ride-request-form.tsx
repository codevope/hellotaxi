'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Car, Star, X, MessageSquare, Calendar as CalendarIcon, Wallet, CreditCard } from 'lucide-react';
import type { Ride, Driver, ChatMessage, User, PaymentMethod, ServiceType, ServiceTypeConfig, Settings, FareBreakdown, CancellationReason } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import FareNegotiation from './fare-negotiation';
import RatingForm from './rating-form';
import Chat from './chat';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, query, where, limit, doc, addDoc, updateDoc, getDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getSettings } from '@/services/settings-service';
import { useAuth } from '@/hooks/use-auth';
import { useMap } from '@/contexts/map-context';
import { useGeolocation } from '@/hooks/use-geolocation-improved';
import { Separator } from './ui/separator';
import AutocompleteInput from './autocomplete-input';
import { Input } from './ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { processRating } from '@/ai/flows/process-rating';
import ETADisplay from './eta-display';
import { useETACalculator, type RouteInfo } from '@/hooks/use-eta-calculator';

const formSchema = z.object({
  pickup: z.string().min(5, 'Por favor, introduce una ubicación de recojo válida.'),
  dropoff: z.string().min(5, 'Por favor, introduce una ubicación de destino válida.'),
  serviceType: z.enum(['economy', 'comfort', 'exclusive']).default('economy'),
  paymentMethod: z.enum(['cash', 'yape', 'plin', 'card']).default('cash'),
  scheduledTime: z.date().optional(),
});

type RideRequestFormProps = {
  setActiveRide: (ride: Ride | null) => void;
};

const paymentMethodIcons: Record<PaymentMethod, React.ReactNode> = {
    cash: <Wallet className="h-6 w-6" />,
    yape: <span className="font-bold text-lg">Y</span>,
    plin: <span className="font-bold text-lg">P</span>,
    card: <CreditCard className="h-6 w-6" />,
}

export default function RideRequestForm({
  setActiveRide,
}: RideRequestFormProps) {
  const [status, setStatus] = useState<
    'idle' | 'negotiating' | 'searching' | 'assigned' | 'completed' | 'rating' | 'scheduling'
  >('idle');
  const [assignedDriver, setAssignedDriver] = useState<Driver | null>(null);
  const [finalFare, setFinalFare] = useState<number | null>(null);
  const [currentRide, setCurrentRide] = useState<Omit<Ride, 'id' | 'driver' | 'passenger'> & { driver: Driver, passenger: User, fareBreakdown?: FareBreakdown } | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [appSettings, setAppSettings] = useState<Settings | null>(null);
  const [pickupCoordinates, setPickupCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [dropoffCoordinates, setDropoffCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isCancelReasonDialogOpen, setIsCancelReasonDialogOpen] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [hasAutoFilledPickup, setHasAutoFilledPickup] = useState(false);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  
  const { user } = useAuth();
  const { location: userLocation, loading: locationLoading } = useGeolocation();
  const { 
    pickupLocation: contextPickupLocation,
    dropoffLocation: contextDropoffLocation,
    setPickupLocation, 
    setDropoffLocation, 
    calculateDistance 
  } = useMap();
  const { toast } = useToast();
  const { calculateRoute } = useETACalculator();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { pickup: '', dropoff: '', serviceType: 'economy', paymentMethod: 'cash' },
  });
  
  // Handlers simples sin useCallback para evitar bucles
  const handlePickupSelect = (address: string, coordinates?: { lat: number; lng: number }) => {
    setPickupCoordinates(coordinates || null);
    
    if (coordinates) {
      setPickupLocation({
        coordinates,
        address
      });
    }
  };

  const handleDropoffSelect = (address: string, coordinates?: { lat: number; lng: number }) => {
    setDropoffCoordinates(coordinates || null);
    
    if (coordinates) {
      setDropoffLocation({
        coordinates,
        address
      });
    }
  };
  
  useEffect(() => {
    getSettings().then(settings => setAppSettings(settings));
  }, []);

  // Auto-rellenar pickup con ubicación actual del usuario (como Uber)
  useEffect(() => {
    if (userLocation && userLocation.address && !hasAutoFilledPickup && !contextPickupLocation) {
      const address = userLocation.address || 'Mi ubicación actual';
      const coordinates = {
        lat: userLocation.latitude,
        lng: userLocation.longitude
      };
      
      // Actualizar formulario
      form.setValue('pickup', address);
      
      // Actualizar estado local
      setPickupCoordinates(coordinates);
      setHasAutoFilledPickup(true);
      
      // Actualizar contexto del mapa
      setPickupLocation({
        coordinates,
        address
      });

      // Mostrar notificación sutil
      toast({
        title: "📍 Ubicación detectada",
        description: "Hemos establecido tu ubicación actual como punto de recojo",
        duration: 3000,
      });
    }
  }, [userLocation, hasAutoFilledPickup, contextPickupLocation, form, setPickupLocation, toast]);

  // Sincronizar formulario con cambios del contexto (clicks en el mapa)
  useEffect(() => {
    if (contextPickupLocation && contextPickupLocation.address) {
      const currentPickup = form.getValues('pickup');
      if (currentPickup !== contextPickupLocation.address) {
        form.setValue('pickup', contextPickupLocation.address);
        setPickupCoordinates(contextPickupLocation.coordinates);
      }
    }
  }, [contextPickupLocation, form]);

  useEffect(() => {
    if (contextDropoffLocation && contextDropoffLocation.address) {
      const currentDropoff = form.getValues('dropoff');
      if (currentDropoff !== contextDropoffLocation.address) {
        form.setValue('dropoff', contextDropoffLocation.address);
        setDropoffCoordinates(contextDropoffLocation.coordinates);
      }
    }
  }, [contextDropoffLocation, form]);

  // Calcular ETA cuando cambien ambas ubicaciones
  useEffect(() => {
    const calculateETA = async () => {
      if (pickupCoordinates && dropoffCoordinates) {
        setIsCalculatingRoute(true);
        try {
          const route = await calculateRoute(pickupCoordinates, dropoffCoordinates);
          setRouteInfo(route);
        } catch (error) {
          console.error('Error calculating ETA:', error);
          setRouteInfo(null);
        } finally {
          setIsCalculatingRoute(false);
        }
      } else {
        setRouteInfo(null);
        setIsCalculatingRoute(false);
      }
    };

    calculateETA();
  }, [pickupCoordinates, dropoffCoordinates, calculateRoute]);

  async function findDriver(serviceType: ServiceType): Promise<Driver | null> {
    const driversRef = collection(db, "drivers");
    const q = query(driversRef, where("status", "==", "available"), where("serviceType", "==", serviceType), limit(1));
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const driverDoc = querySnapshot.docs[0];
      return { id: driverDoc.id, ...driverDoc.data() } as Driver;
    }
    
    return null;
  }
  
  async function handleSchedule() {
    if (!form.getValues('scheduledTime') || !user) return;
    
    setStatus('scheduling');
    const values = form.getValues();
    
    try {
        await addDoc(collection(db, "scheduledRides"), {
            pickup: values.pickup,
            dropoff: values.dropoff,
            scheduledTime: values.scheduledTime!.toISOString(),
            passenger: doc(db, 'users', user.uid),
            status: 'pending',
            serviceType: values.serviceType,
            paymentMethod: values.paymentMethod,
        });

        toast({
            title: "¡Viaje Agendado!",
            description: `Tu viaje de ${values.pickup} a ${values.dropoff} ha sido programado para el ${format(values.scheduledTime!, 'dd/MM/yyyy a las HH:mm')}.`
        });
    } catch(error) {
        console.error("Error scheduling ride: ", error);
        toast({
            variant: 'destructive',
            title: "Error al Agendar",
            description: "No se pudo programar tu viaje. Por favor, inténtalo de nuevo."
        });
    } finally {
        resetRide();
    }
  }

  async function handleNegotiationComplete(fare: number, breakdown: FareBreakdown) {
    const serviceType = form.getValues('serviceType');
    setFinalFare(fare);
    setStatus('searching');
    setActiveRide(null);

    const availableDriver = await findDriver(serviceType);
    
    if (availableDriver && user) {
      const userRef = doc(db, 'users', user.uid);
      
      setAssignedDriver(availableDriver);
      setStatus('assigned');
      
      const passengerSnapshot = await getDoc(userRef);
      const passenger = passengerSnapshot.data() as User;
      
      const newRideData = {
        pickup: form.getValues('pickup'),
        dropoff: form.getValues('dropoff'),
        date: new Date().toISOString(),
        fare: fare,
        driver: availableDriver,
        passenger: passenger,
        serviceType: form.getValues('serviceType'),
        paymentMethod: form.getValues('paymentMethod'),
        assignmentTimestamp: new Date().toISOString(),
        fareBreakdown: breakdown,
      };

      const newRideForState: Ride = {
        ...newRideData,
        id: `ride-${Date.now()}`,
        status: 'in-progress' as const,
        driver: doc(db, 'drivers', availableDriver.id),
        passenger: userRef
      };
      
      setActiveRide(newRideForState);
      setCurrentRide({ ...newRideData, status: 'in-progress' });
      
      setChatMessages([
        {
          sender: availableDriver.name,
          text: '¡Hola! Ya estoy en camino.',
          timestamp: new Date().toISOString(),
          isDriver: true,
        },
      ]);
    } else {
      toast({ variant: 'destructive', title: 'No se encontraron conductores', description: `No hay conductores disponibles para el servicio "${serviceType}" en este momento. Por favor, inténtalo más tarde.` });
      resetRide();
    }
  }
  
  function handleCompleteRide() {
    setStatus('completed');
    if(currentRide){
       const completedRideForState: Ride = {
           ...currentRide, 
           id: `ride-${Date.now()}`,
           status: 'completed' as const,
           driver: doc(db, 'drivers', currentRide.driver.id),
           passenger: doc(db, 'users', currentRide.passenger.id)
        };
       setActiveRide(completedRideForState);
       setCurrentRide({...currentRide, status: 'completed'});
       setTimeout(() => setStatus('rating'), 2000);
    }
  }

  async function handleCancelRide(reason: CancellationReason) {
    if (currentRide && user) {
        const cancelledRide = {
            ...currentRide,
            status: 'cancelled' as const,
            cancellationReason: reason,
            cancelledBy: 'passenger' as const,
        };
        // @ts-ignore
        setActiveRide(cancelledRide);
        
        // Apply rating penalty
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
            rating: increment(-0.1) // Decrease rating by 0.1
        });
    }
    toast({
        title: "Viaje Cancelado",
        description: `Motivo: ${reason.reason}. Tu calificación ha sido ligeramente afectada.`,
    });
    resetRide();
  }
  
  async function handleRatingSubmit(rating: number, comment: string) {
    if (!currentRide) return;
    setIsSubmittingRating(true);

    try {
        await processRating({
            ratedUserId: currentRide.driver.id,
            isDriver: true,
            rating,
            comment,
        });
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


  function resetRide() {
    setStatus('idle');
    setAssignedDriver(null);
    setActiveRide(null);
    setCurrentRide(null);
    setFinalFare(null);
    setChatMessages([]);
    setIsCancelReasonDialogOpen(false);
    form.reset();
  }
  
  function handleSendMessage(text: string) {
    const newMessage: ChatMessage = {
        sender: 'Tú',
        text,
        timestamp: new Date().toISOString(),
        isDriver: false,
    };
    setChatMessages((prev) => [...prev, newMessage]);

    if(assignedDriver) {
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

  const cancelDialogDescription = "Esta acción podría afectar negativamente tu calificación como pasajero. ¿Aún deseas cancelar?";


  if (status === 'searching') {
    return (
      <Alert>
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertTitle>Buscando tu viaje...</AlertTitle>
        <AlertDescription>
          Hemos acordado una tarifa de S/{finalFare?.toFixed(2)}. Ahora, estamos asignando un conductor para el servicio "{form.getValues('serviceType')}".
        </AlertDescription>
      </Alert>
    );
  }

  if (status === 'assigned' && assignedDriver) {
    return (
      <div className="space-y-4 h-full flex flex-col">
        <Card className="flex-1">
          <CardHeader className="p-4">
            <CardTitle>¡Tu conductor está en camino!</CardTitle>
            <CardDescription>Llegada estimada: 5 minutos.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={assignedDriver.avatarUrl}
                  alt={assignedDriver.name}
                />
                <AvatarFallback>{assignedDriver.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-md">{assignedDriver.name}</p>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />{' '}
                  {assignedDriver.rating}
                </div>
                 <p className="text-xs">{assignedDriver.vehicleBrand} {assignedDriver.vehicleModel} - {assignedDriver.licensePlate}</p>
              </div>
               <p className="font-bold text-lg text-right flex-1">S/{finalFare?.toFixed(2)}</p>
            </div>

            <Separator />
            
            <Card className="flex-1 flex flex-col">
                <CardHeader className="p-4 flex-row items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    <CardTitle className="text-xl">Chat con el Conductor</CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1 flex flex-col">
                    <Chat messages={chatMessages} onSendMessage={handleSendMessage} />
                </CardContent>
            </Card>

          </CardContent>
        </Card>
        
        <div className="space-y-2">
           <Button onClick={handleCompleteRide} variant="secondary" className="w-full">
            Completar Viaje (Simulación)
          </Button>
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
                       {cancelDialogDescription}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>No, continuar viaje</AlertDialogCancel>
                    <AlertDialogAction onClick={() => setIsCancelReasonDialogOpen(true)}>
                        Sí, cancelar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
           </AlertDialog>
        </div>

         <Dialog open={isCancelReasonDialogOpen} onOpenChange={setIsCancelReasonDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>¿Por qué estás cancelando?</DialogTitle>
                </DialogHeader>
                <div className="space-y-2">
                    {appSettings?.cancellationReasons.map(reason => (
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
      </div>
    );
  }
  
  if (status === 'completed') {
    return (
        <Alert>
            <Loader2 className="h-4 w-4 animate-spin"/>
            <AlertTitle>Viaje Completado</AlertTitle>
            <AlertDescription>
                Procesando el pago de S/{finalFare?.toFixed(2)}...
            </AlertDescription>
        </Alert>
    );
  }

  if (status === 'rating' && currentRide) {
    return (
        <RatingForm 
          userToRate={currentRide.driver} 
          isDriver={true}
          onSubmit={handleRatingSubmit}
          isSubmitting={isSubmittingRating}
        />
    );
  }


  if (status === 'negotiating') {
    return (
      <FareNegotiation
        rideDetails={{
          ...form.getValues(),
          distanceKm: routeInfo ? routeInfo.distance.value / 1000 : 10, // Fallback
          durationMinutes: routeInfo ? routeInfo.duration.value / 60 : 20, // Fallback
        }}
        onNegotiationComplete={handleNegotiationComplete}
        onCancel={() => setStatus('idle')}
      />
    );
  }
  
  if (!appSettings) {
    return (
        <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(() => setStatus('negotiating'))}
        className="space-y-6"
      >
        <FormField
          control={form.control}
          name="serviceType"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Tipo de Servicio</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="grid grid-cols-3 gap-4"
                >
                  {appSettings.serviceTypes.map((service) => (
                    <FormItem key={service.id} className="flex-1">
                      <FormControl>
                        <RadioGroupItem
                          value={service.id}
                          className="sr-only"
                        />
                      </FormControl>
                      <FormLabel className="group flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                        <span className="font-semibold">{service.name}</span>
                        <span className="text-xs text-muted-foreground text-center group-hover:text-accent-foreground">
                          {service.description}
                        </span>
                      </FormLabel>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="pickup"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Punto de Recojo</FormLabel>
              <FormControl>
                <AutocompleteInput
                  onPlaceSelect={(address, coordinates) => {
                    field.onChange(address);
                    handlePickupSelect(address, coordinates);
                  }}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="¿Dónde te recogemos?"
                  showCurrentLocationButton={true}
                  showSmartSearch={false} // Solo mostrar en dropoff
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dropoff"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Punto de Destino</FormLabel>
              <FormControl>
                 <AutocompleteInput
                  onPlaceSelect={(address, coordinates) => {
                    field.onChange(address);
                    handleDropoffSelect(address, coordinates);
                  }}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="¿A dónde vas?"
                  showCurrentLocationButton={false}
                  showSmartSearch={true} // Mostrar búsqueda inteligente para destino
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ETA Display */}
        {(pickupCoordinates && dropoffCoordinates) && (
          <div className="my-4">
            <ETADisplay 
              routeInfo={routeInfo}
              isCalculating={isCalculatingRoute}
            />
          </div>
        )}

        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Método de Pago</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="grid grid-cols-4 gap-4"
                >
                  {(['cash', 'yape', 'plin', 'card'] as PaymentMethod[]).map((method) => (
                    <FormItem key={method} className="flex-1">
                      <FormControl>
                        <RadioGroupItem value={method} className="sr-only" />
                      </FormControl>
                      <FormLabel className="flex flex-col h-20 items-center justify-center gap-1 rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                        {paymentMethodIcons[method]}
                        <span className="font-semibold text-xs capitalize">{method === 'cash' ? 'Efectivo' : method}</span>
                      </FormLabel>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />


        <FormField
            control={form.control}
            name="scheduledTime"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel>Agendar para después (opcional)</FormLabel>
                 <Popover>
                    <PopoverTrigger asChild>
                    <FormControl>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                        )}
                        >
                        {field.value ? (
                            format(field.value, "PPP HH:mm")
                        ) : (
                            <span>Elige fecha y hora</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                            date < new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                        />
                         <div className="p-3 border-t border-border">
                            <Input
                                type="time"
                                defaultValue={field.value ? format(field.value, 'HH:mm') : ''}
                                onChange={(e) => {
                                    const time = e.target.value.split(':');
                                    const date = field.value ? new Date(field.value) : new Date();
                                    date.setHours(parseInt(time[0] || "00"), parseInt(time[1] || "00"));
                                    field.onChange(date);
                                }}
                            />
                        </div>
                    </PopoverContent>
                </Popover>
                <FormMessage />
                </FormItem>
            )}
            />
        
        <div className="flex flex-col sm:flex-row gap-2">
            <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting || status === 'scheduling' || !routeInfo}
            >
                Pedir Ahora y Negociar
            </Button>
            <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={handleSchedule}
                disabled={!form.watch('scheduledTime') || form.formState.isSubmitting || status === 'scheduling'}
            >
                 {status === 'scheduling' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Agendar Viaje
            </Button>
        </div>
      </form>
    </Form>
  );
}
