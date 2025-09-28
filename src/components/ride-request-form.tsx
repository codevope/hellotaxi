
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Loader2,
  Car,
  Star,
  X,
  MessageSquare,
  Calendar as CalendarIcon,
  Wallet,
  CreditCard,
  MapPin,
} from 'lucide-react';
import type {
  Ride,
  Driver,
  ChatMessage,
  User,
  PaymentMethod,
  ServiceType,
  Settings,
  FareBreakdown,
  CancellationReason,
} from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import FareNegotiation from './fare-negotiation';
import RatingForm from './rating-form';
import Chat from './chat';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  collection,
  getDocs,
  query,
  where,
  limit,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  increment,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getSettings } from '@/services/settings-service';
import { useAuth } from '@/hooks/use-auth';
import { useMap } from '@/contexts/map-context';
import { Separator } from './ui/separator';
import { Input } from './ui/input';
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
} from './ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { processRating } from '@/ai/flows/process-rating';
import ETADisplay from './eta-display';
import { useETACalculator, type RouteInfo } from '@/hooks/use-eta-calculator';
import { LocationPicker, type Location } from '@/components/maps';
import { Label } from './ui/label';

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
};

export default function RideRequestForm({
  setActiveRide,
}: RideRequestFormProps) {
  const [status, setStatus] = useState<
    | 'idle'
    | 'negotiating'
    | 'searching'
    | 'assigned'
    | 'completed'
    | 'rating'
    | 'scheduling'
  >('idle');
  const [assignedDriver, setAssignedDriver] = useState<Driver | null>(null);
  const [finalFare, setFinalFare] = useState<number | null>(null);
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [appSettings, setAppSettings] = useState<Settings | null>(null);
  const [isCancelReasonDialogOpen, setIsCancelReasonDialogOpen] =
    useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [locationPickerFor, setLocationPickerFor] = useState<
    'pickup' | 'dropoff' | null
  >(null);

  const { user } = useAuth();
  const { pickupLocation, dropoffLocation, setPickupLocation, setDropoffLocation } =
    useMap();
  const { toast } = useToast();
  const { calculateRoute } = useETACalculator();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pickup: '',
      dropoff: '',
      serviceType: 'economy',
      paymentMethod: 'cash',
    },
  });

  const handleLocationSelect = (location: Location) => {
    if (locationPickerFor === 'pickup') {
      setPickupLocation({
        coordinates: { lat: location.lat, lng: location.lng },
        address: location.address || '',
      });
    } else if (locationPickerFor === 'dropoff') {
      setDropoffLocation({
        coordinates: { lat: location.lat, lng: location.lng },
        address: location.address || '',
      });
    }
    setLocationPickerFor(null); // Close the dialog
  };

  useEffect(() => {
    getSettings().then((settings) => setAppSettings(settings));
  }, []);

  useEffect(() => {
    if (pickupLocation) {
      form.setValue('pickup', pickupLocation.address, { shouldValidate: true });
    } else {
      form.setValue('pickup', '', { shouldValidate: true });
    }
  }, [pickupLocation, form]);

  useEffect(() => {
    if (dropoffLocation) {
      form.setValue('dropoff', dropoffLocation.address, { shouldValidate: true });
    } else {
      form.setValue('dropoff', '', { shouldValidate: true });
    }
  }, [dropoffLocation, form]);

  useEffect(() => {
    const calculateETA = async () => {
      if (pickupLocation && dropoffLocation) {
        setIsCalculatingRoute(true);
        try {
          const route = await calculateRoute(
            pickupLocation.coordinates,
            dropoffLocation.coordinates
          );
          setRouteInfo(route);
        } catch (error) {
          console.error('Error calculating ETA:', error);
          setRouteInfo(null);
        } finally {
          setIsCalculatingRoute(false);
        }
      } else {
        setRouteInfo(null);
      }
    };

    calculateETA();
  }, [pickupLocation, dropoffLocation, calculateRoute]);

  async function findDriver(serviceType: ServiceType): Promise<Driver | null> {
    const driversRef = collection(db, 'drivers');
    const q = query(
      driversRef,
      where('status', '==', 'available'),
      where('serviceType', '==', serviceType),
      where('documentsStatus', '==', 'approved'),
      limit(1)
    );

    await new Promise((resolve) => setTimeout(resolve, 2000));

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
      await addDoc(collection(db, 'scheduledRides'), {
        pickup: values.pickup,
        dropoff: values.dropoff,
        scheduledTime: values.scheduledTime!.toISOString(),
        passenger: doc(db, 'users', user.uid),
        status: 'pending',
        serviceType: values.serviceType,
        paymentMethod: values.paymentMethod,
      });

      toast({
        title: '¡Viaje Agendado!',
        description: `Tu viaje de ${
          values.pickup
        } a ${values.dropoff} ha sido programado para el ${format(
          values.scheduledTime!,
          'dd/MM/yyyy a las HH:mm'
        )}.`,
      });
    } catch (error) {
      console.error('Error scheduling ride: ', error);
      toast({
        variant: 'destructive',
        title: 'Error al Agendar',
        description:
          'No se pudo programar tu viaje. Por favor, inténtalo de nuevo.',
      });
    } finally {
      resetRide();
    }
  }

  async function handleNegotiationComplete(
    fare: number,
    breakdown: FareBreakdown
  ) {
    const serviceType = form.getValues('serviceType');
    setFinalFare(fare);
    setStatus('searching');
    setActiveRide(null);

    const availableDriver = await findDriver(serviceType);

    if (availableDriver && user) {
        setAssignedDriver(availableDriver);
        const passengerRef = doc(db, 'users', user.uid);
        const driverRef = doc(db, 'drivers', availableDriver.id);
        
        try {
            // Create the ride document
            const newRideData = {
                pickup: form.getValues('pickup'),
                dropoff: form.getValues('dropoff'),
                date: new Date().toISOString(),
                fare: fare,
                driver: driverRef,
                passenger: passengerRef,
                serviceType: form.getValues('serviceType'),
                paymentMethod: form.getValues('paymentMethod'),
                assignmentTimestamp: new Date().toISOString(),
                fareBreakdown: breakdown,
                status: 'in-progress' as const,
            };
            const rideDocRef = await addDoc(collection(db, 'rides'), newRideData);

            // Update driver and passenger in a batch
            const batch = writeBatch(db);
            batch.update(driverRef, { status: 'on-ride' });
            batch.update(passengerRef, { totalRides: increment(1) });
            await batch.commit();

            // Set component state with the newly created ride
            const createdRide: Ride = { id: rideDocRef.id, ...newRideData };
            setCurrentRide(createdRide);
            setActiveRide(createdRide);
            setStatus('assigned');
            setChatMessages([
                { sender: availableDriver.name, text: '¡Hola! Ya estoy en camino.', timestamp: new Date().toISOString(), isDriver: true, },
            ]);

        } catch (error) {
            console.error('Error creating ride and updating statuses:', error);
            toast({ variant: 'destructive', title: 'Error al crear el viaje', description: 'No se pudo registrar el viaje. Inténtalo de nuevo.' });
            resetRide();
        }
    } else {
      toast({
        variant: 'destructive',
        title: 'No se encontraron conductores',
        description: `No hay conductores disponibles para el servicio "${serviceType}" en este momento. Por favor, inténtalo más tarde.`,
      });
      resetRide();
    }
  }

  async function handleCompleteRide() {
    if (!currentRide || !assignedDriver) return;
    setStatus('completed');
    
    const rideRef = doc(db, 'rides', currentRide.id);
    const driverRef = doc(db, 'drivers', assignedDriver.id);

    try {
        const batch = writeBatch(db);
        batch.update(rideRef, { status: 'completed' });
        batch.update(driverRef, { status: 'available' });
        await batch.commit();

        const completedRide = { ...currentRide, status: 'completed' as const };
        setActiveRide(completedRide);
        setCurrentRide(completedRide);
        setTimeout(() => setStatus('rating'), 2000);

    } catch (error) {
        console.error('Error completing ride:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo completar el viaje.'});
        // Don't reset, allow user to try again
        setStatus('assigned');
    }
  }

  async function handleCancelRide(reason: CancellationReason) {
    if (!currentRide || !user || !assignedDriver) return;

    const rideRef = doc(db, 'rides', currentRide.id);
    const driverRef = doc(db, 'drivers', assignedDriver.id);
    const passengerRef = doc(db, 'users', user.uid);
    
    try {
        const batch = writeBatch(db);
        batch.update(rideRef, { 
            status: 'cancelled',
            cancellationReason: reason,
            cancelledBy: 'passenger'
        });
        batch.update(driverRef, { status: 'available' });
        // Optional: Penalize user rating for cancellation
        batch.update(passengerRef, { rating: increment(-0.1) });
        await batch.commit();

        toast({
            title: 'Viaje Cancelado',
            description: `Motivo: ${reason.reason}.`,
        });
        resetRide();
    } catch (error) {
        console.error('Error cancelling ride:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cancelar el viaje.'});
    }
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

  function resetRide() {
    setStatus('idle');
    setAssignedDriver(null);
    setActiveRide(null);
    setCurrentRide(null);
    setFinalFare(null);
    setChatMessages([]);
    setIsCancelReasonDialogOpen(false);
    setPickupLocation(null);
    setDropoffLocation(null);
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

  const cancelDialogDescription =
    'Esta acción podría afectar negativamente tu calificación como pasajero. ¿Aún deseas cancelar?';

  if (status === 'searching') {
    return (
      <Alert>
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertTitle>Buscando tu viaje...</AlertTitle>
        <AlertDescription>
          Hemos acordado una tarifa de S/{finalFare?.toFixed(2)}. Ahora, estamos
          asignando un conductor para el servicio "{form.getValues('serviceType')}".
        </AlertDescription>
      </Alert>
    );
  }

  if (status === 'assigned' && assignedDriver && currentRide) {
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
                S/{finalFare?.toFixed(2)}
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
          </CardContent>
        </Card>

        <div className="space-y-2">
          <Button
            onClick={handleCompleteRide}
            variant="secondary"
            className="w-full"
          >
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
                <AlertDialogAction
                  onClick={() => setIsCancelReasonDialogOpen(true)}
                >
                  Sí, cancelar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <Dialog
          open={isCancelReasonDialogOpen}
          onOpenChange={setIsCancelReasonDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Por qué estás cancelando?</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
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
      </div>
    );
  }

  if (status === 'completed') {
    return (
      <Alert>
        <Loader2 className="h-4 w-4 animate-spin" />
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
        userToRate={assignedDriver!}
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
          distanceKm: routeInfo ? routeInfo.distance.value / 1000 : 10,
          durationMinutes: routeInfo ? routeInfo.duration.value / 60 : 20,
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

  const { pickup, dropoff } = form.getValues();

  return (
    <>
      <Dialog
        open={!!locationPickerFor}
        onOpenChange={(open) => !open && setLocationPickerFor(null)}
      >
        <DialogContent className="p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>
              {locationPickerFor === 'pickup'
                ? 'Seleccionar punto de recojo'
                : 'Seleccionar destino'}
            </DialogTitle>
          </DialogHeader>
          <LocationPicker
            onLocationSelect={handleLocationSelect}
            onCancel={() => setLocationPickerFor(null)}
            isPickup={locationPickerFor === 'pickup'}
          />
        </DialogContent>
      </Dialog>

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

          <div className="space-y-2">
            <Label>Punto de Recojo</Label>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start text-left font-normal"
              onClick={() => setLocationPickerFor('pickup')}
            >
              <MapPin className="mr-2 h-4 w-4" />
              {pickupLocation
                ? pickupLocation.address
                : 'Seleccionar punto de recojo'}
            </Button>
            <FormMessage>{form.formState.errors.pickup?.message}</FormMessage>
          </div>

          <div className="space-y-2">
            <Label>Punto de Destino</Label>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start text-left font-normal"
              onClick={() => setLocationPickerFor('dropoff')}
            >
              <MapPin className="mr-2 h-4 w-4" />
              {dropoffLocation
                ? dropoffLocation.address
                : 'Seleccionar destino'}
            </Button>
            <FormMessage>{form.formState.errors.dropoff?.message}</FormMessage>
          </div>

          {pickupLocation && dropoffLocation && (
            <div className="my-4">
              <ETADisplay
                routeInfo={routeInfo}
                isCalculating={isCalculatingRoute}
                startAddress={pickup}
                endAddress={dropoff}
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
                    {(['cash', 'yape', 'plin', 'card'] as PaymentMethod[]).map(
                      (method) => (
                        <FormItem key={method} className="flex-1">
                          <FormControl>
                            <RadioGroupItem value={method} className="sr-only" />
                          </FormControl>
                          <FormLabel className="flex flex-col h-20 items-center justify-center gap-1 rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            {paymentMethodIcons[method]}
                            <span className="font-semibold text-xs capitalize">
                              {method === 'cash' ? 'Efectivo' : method}
                            </span>
                          </FormLabel>
                        </FormItem>
                      )
                    )}
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
                        type="button"
                        variant={'outline'}
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP HH:mm')
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
                        date < new Date() || date < new Date('1900-01-01')
                      }
                      initialFocus
                    />
                    <div className="p-3 border-t border-border">
                      <Input
                        type="time"
                        defaultValue={
                          field.value ? format(field.value, 'HH:mm') : ''
                        }
                        onChange={(e) => {
                          const time = e.target.value.split(':');
                          const date = field.value
                            ? new Date(field.value)
                            : new Date();
                          date.setHours(
                            parseInt(time[0] || '00'),
                            parseInt(time[1] || '00')
                          );
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
              disabled={
                form.formState.isSubmitting ||
                status === 'scheduling' ||
                !routeInfo
              }
            >
              Pedir Ahora y Negociar
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={handleSchedule}
              disabled={
                !form.watch('scheduledTime') ||
                form.formState.isSubmitting ||
                status === 'scheduling'
              }
            >
              {status === 'scheduling' && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Agendar Viaje
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
