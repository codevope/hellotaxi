
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
import { Alert } from '@/components/ui/alert';
import {
  Loader2,
  Car,
  X,
  MapPin,
  Rocket,
  CarFront,
  Sparkles,
  ChevronRight,
  Bot,
} from 'lucide-react';
import type {
  Ride,
  Driver,
  PaymentMethod,
  ServiceType,
  Settings,
  FareBreakdown,
} from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import FareNegotiation from './fare-negotiation';
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
  increment,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getSettings } from '@/services/settings-service';
import { useAuth } from '@/hooks/use-auth';
import { Input } from './ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import ETADisplay from './eta-display';
import { useETACalculator, type RouteInfo } from '@/hooks/use-eta-calculator';
import { LocationPicker, type Location, InteractiveMap } from '@/components/maps';
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
  onRideAssigned: (ride: Ride, driver: Driver) => void;
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
  onRideAssigned,
}: RideRequestFormProps) {
  const [status, setStatus] = useState<
    | 'idle'
    | 'calculating'
    | 'calculated'
    | 'negotiating'
    | 'searching'
    | 'scheduling'
  >('idle');
  
  const [finalFare, setFinalFare] = useState<number | null>(null);
  const [appSettings, setAppSettings] = useState<Settings | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [locationPickerFor, setLocationPickerFor] = useState<
    'pickup' | 'dropoff' | null
  >(null);
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<Location | null>(null);
  const { user } = useAuth();
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

  useEffect(() => {
    async function fetchSettings() {
      const settings = await getSettings();
      setAppSettings(settings);
    }
    fetchSettings();
  }, []);

  const handleLocationSelect = (location: Location) => {
    if (locationPickerFor === 'pickup') {
      setPickupLocation(location);
      form.setValue('pickup', location.address || `${location.lat}, ${location.lng}`);
    } else if (locationPickerFor === 'dropoff') {
      setDropoffLocation(location);
      form.setValue('dropoff', location.address || `${location.lat}, ${location.lng}`);
    }
    setLocationPickerFor(null); // Close the dialog
  };

  const handleCalculateFare = async () => {
    if (!pickupLocation || !dropoffLocation) return;
    setStatus('calculating');
    const route = await calculateRoute(
      pickupLocation,
      dropoffLocation,
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
    
    // La consulta busca un conductor que cumpla TODAS estas condiciones:
    // 1. El tipo de servicio coincide con el solicitado ('economy', 'comfort', etc.).
    // 2. Sus documentos están aprobados por un administrador.
    // 3. Su estado es 'available', lo que garantiza que no está 'on-ride' (en otro viaje) ni 'unavailable' (desconectado).
    const q = query(
      driversRef,
      where('serviceType', '==', serviceType),
      where('documentsStatus', '==', 'approved'),
      where('status', '==', 'available'),
      limit(1)
    );

    // Simula un pequeño retraso para la búsqueda
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const driverDoc = querySnapshot.docs[0];
      return { id: driverDoc.id, ...driverDoc.data() } as Driver;
    }

    return null; // No se encontró ningún conductor que cumpla los criterios.
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
        description: `Tu viaje ha sido programado para el ${form.getValues('scheduledTime')!}.`,
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
      resetForm();
    }
  }

  async function handleNegotiationComplete(
    fare: number,
    breakdown: FareBreakdown
  ) {
    const serviceType = form.getValues('serviceType');
    setFinalFare(fare);
    setStatus('searching');

    const availableDriver = await findDriver(serviceType);

    if (availableDriver && user) {
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
        onRideAssigned(createdRide, availableDriver);
        resetForm();

      } catch (error) {
        console.error('Error creating ride and updating statuses:', error);
        toast({ variant: 'destructive', title: 'Error al crear el viaje', description: 'No se pudo registrar el viaje. Inténtalo de nuevo.' });
        resetForm();
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'No se encontraron conductores',
        description: `No hay conductores disponibles para el servicio "${serviceType}" en este momento. Por favor, inténtalo más tarde.`,
      });
      resetForm();
    }
  }

  function resetForm() {
    setStatus('idle');
    setFinalFare(null);
    setPickupLocation(null);
    setDropoffLocation(null);
    setRouteInfo(null);
    form.reset();
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
        <Alert>Buscando tu viaje...</Alert>
        <Alert>
          Hemos acordado una tarifa de S/{finalFare?.toFixed(2)}. Ahora, estamos
          asignando un conductor para el servicio "{form.getValues('serviceType')}".
        </Alert>
      </Alert>
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
            initialLocation={locationPickerFor === 'pickup' ? pickupLocation : dropoffLocation}
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
