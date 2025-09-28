
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
  Tag,
  Rocket,
  CarFront,
  Sparkles,
  ChevronRight,
  List,
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
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { processRating } from '@/ai/flows/process-rating';
import ETADisplay from './eta-display';
import { useETACalculator, type RouteInfo } from '@/hooks/use-eta-calculator';
import { LocationPicker, type Location } from '@/components/maps';
import { Label } from './ui/label';
import Image from 'next/image';

const formSchema = z.object({
  pickup: z.string().min(5, 'Por favor, introduce una ubicación de recojo válida.'),
  dropoff: z.string().min(5, 'Por favor, introduce una ubicación de destino válida.'),
  serviceType: z.enum(['economy', 'comfort', 'exclusive'], { required_error: 'Debes seleccionar un tipo de servicio.' }).default('economy'),
  paymentMethod: z.enum(['cash', 'yape', 'plin'], { required_error: 'Debes seleccionar un método de pago.' }).default('cash'),
  couponCode: z.string().optional(),
  scheduledTime: z.date().optional(),
});

type RideRequestFormProps = {
  setActiveRide: (ride: Ride | null) => void;
};


const paymentMethodIcons: Record<Exclude<PaymentMethod, 'card'>, React.ReactNode> = {
  cash: <Image src="/img/cash.png" alt="Efectivo" width={40} height={40} className="object-contain h-10" />,
  yape: <Image src="/img/yape.png" alt="Yape" width={80} height={40} className="object-contain h-10" />,
  plin: <Image src="/img/plin.png" alt="Plin" width={80} height={40} className="object-contain h-10" />,
};

const serviceTypeIcons: Record<ServiceType, React.ReactNode> = {
  economy: <Car className="h-8 w-8" />,
  comfort: <CarFront className="h-8 w-8" />,
  exclusive: <Rocket className="h-8 w-8" />,
}

export default function RideRequestForm({
  setActiveRide,
}: RideRequestFormProps) {
  const [status, setStatus] = useState<
    | 'idle'
    | 'calculating'
    | 'calculated'
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
  const [locationPickerFor, setLocationPickerFor] = useState<
    'pickup' | 'dropoff' | null
  >(null);

  const { user } = useAuth();
  const { pickupLocation, dropoffLocation, setPickupLocation, setDropoffLocation } =
    useMap();
  const { toast } = useToast();
  const { calculateRoute, isCalculating, error: routeError } = useETACalculator();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      pickup: '',
      dropoff: '',
      serviceType: 'economy',
      paymentMethod: 'cash',
      couponCode: '',
    },
  });

  const serviceType = form.watch('serviceType');
  const paymentMethod = form.watch('paymentMethod');

  useEffect(() => {
    async function fetchSettings() {
      const settings = await getSettings();
      setAppSettings(settings);
    }
    fetchSettings();
  }, []);

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
    if (pickupLocation) {
      form.setValue('pickup', pickupLocation.address);
    } else {
      form.setValue('pickup', '');
    }
  }, [pickupLocation, form]);

  useEffect(() => {
    if (dropoffLocation) {
      form.setValue('dropoff', dropoffLocation.address);
    } else {
      form.setValue('dropoff', '');
    }
  }, [dropoffLocation, form]);

  const handleCalculateFare = async () => {
    if (!pickupLocation || !dropoffLocation) return;
    setStatus('calculating');
    const route = await calculateRoute(
      pickupLocation.coordinates,
      dropoffLocation.coordinates,
      {
        serviceType: form.getValues('serviceType'),
        couponCode: form.getValues('couponCode') || undefined
      }
    );
    if (route) {
      setRouteInfo(route);
      setStatus('calculated');
    } else {
      setStatus('idle'); // O mostrar un error
    }
  };


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
        createdAt: new Date().toISOString(),
      });

      toast({
        title: '¡Viaje Agendado!',
        description: `Tu viaje ha sido programado para el ${format(
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
          couponCode: form.getValues('couponCode') || '',
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

  async function handleCancelRide(reason: CancellationReason) {
    if (!currentRide || !user || !assignedDriver) return;

    const rideRef = doc(db, 'rides', currentRide.id);
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

  async function handleRatingSubmit(rating: number, comment: string) {
    if (!currentRide) return;
    setIsSubmittingRating(true);

    try {
      await processRating({
        ratedUserId: assignedDriver!.id, // We are sure assignedDriver is not null here
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
    setRouteInfo(null);
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

  if (status === 'negotiating' && routeInfo) {
    return (
      <FareNegotiation
        routeInfo={routeInfo}
        onNegotiationComplete={handleNegotiationComplete}
        onCancel={() => {
          setStatus('calculated');
        }}
      />
    );
  }

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
      </div>
    );
  }

  if (status === 'completed') {
    // This state is now handled by the driver dashboard. When driver completes,
    // passenger should go to rating state. We'll simulate this with a timeout.
    setTimeout(() => setStatus('rating'), 1000);
    return (
      <Alert>
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertTitle>Viaje Completado</AlertTitle>
        <AlertDescription>
          El conductor ha finalizado el viaje. Preparando la calificación...
        </AlertDescription>
      </Alert>
    );
  }

  if (status === 'rating' && assignedDriver) {
    return (
      <RatingForm
        userToRate={assignedDriver}
        isDriver={true}
        onSubmit={handleRatingSubmit}
        isSubmitting={isSubmittingRating}
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
    <>
      <Dialog
        open={!!locationPickerFor}
        onOpenChange={(open) => !open && setLocationPickerFor(null)}
      >
        <DialogContent>
          <DialogHeader>
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
          onSubmit={form.handleSubmit(handleCalculateFare)}
          className="space-y-6"
        >
          {(status === 'idle' || status === 'calculating' || status === 'calculated') && (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Punto de Recojo</Label>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-left font-normal h-auto"
                    onClick={() => setLocationPickerFor('pickup')}
                  >
                    <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />
                    {pickupLocation ? (
                      <span className="truncate">{pickupLocation.address}</span>
                    ) : (
                      'Seleccionar punto de recojo'
                    )}
                  </Button>
                  <FormMessage>
                    {form.formState.errors.pickup?.message}
                  </FormMessage>
                </div>

                <div className="space-y-2">
                  <Label>Punto de Destino</Label>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-left font-normal h-auto"
                    onClick={() => setLocationPickerFor('dropoff')}
                  >
                    <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />
                    {dropoffLocation ? (
                      <span className="truncate">{dropoffLocation.address}</span>
                    ) : (
                      'Seleccionar destino'
                    )}
                  </Button>
                  <FormMessage>
                    {form.formState.errors.dropoff?.message}
                  </FormMessage>
                </div>
              </div>

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
                          <FormItem key={service.id}>
                            <FormControl>
                              <RadioGroupItem
                                value={service.id}
                                id={`service-${service.id}`}
                                className="peer sr-only"
                              />
                            </FormControl>
                            <FormLabel
                              htmlFor={`service-${service.id}`}
                              className={cn(
                                'flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all',
                                field.value === service.id && "border-primary bg-primary/10"
                              )}
                            >
                              {serviceTypeIcons[service.id]}
                              <span className="font-semibold mt-2">{service.name}</span>
                            </FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                {(status === 'idle' || isCalculating) && (
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isCalculating || !pickupLocation || !dropoffLocation}
                  >
                    {isCalculating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    {isCalculating ? 'Calculando...' : 'Calcular Tarifa'}
                  </Button>
                )}
              </div>


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
                        className="grid grid-cols-3 gap-4"
                      >
                        {(Object.keys(paymentMethodIcons) as Array<keyof typeof paymentMethodIcons>).map((method) => (
                          <FormItem key={method}>
                            <FormControl>
                              <RadioGroupItem
                                value={method}
                                id={`payment-${method}`}
                                className="peer sr-only"
                              />
                            </FormControl>
                            <FormLabel
                              htmlFor={`payment-${method}`}
                              className={cn(
                                "flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all h-24",
                                field.value === method && "border-primary bg-primary/10"
                              )}
                            >
                              {paymentMethodIcons[method]}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />


              {status === 'calculated' && routeInfo && (
                <ETADisplay
                  routeInfo={routeInfo}
                  isCalculating={isCalculating}
                  error={routeError}
                />
              )}

              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                {status === 'calculated' && (
                  <>
                    <Button
                      type="button"
                      className="w-full"
                      onClick={() => setStatus('negotiating')}
                    >
                      Continuar a la Negociación
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </form>
      </Form>
    </>
  );
}
