
'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Loader2,
  Car,
  X,
  MapPin,
  Rocket,
  CarFront,
  Sparkles,
  ChevronRight,
  Calendar as CalendarIcon,
  Ticket,
} from 'lucide-react';
import type {
  Ride,
  PaymentMethod,
  ServiceType,
  Settings,
  FareBreakdown,
  Location,
  ScheduledRide,
} from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  query,
  where,
  getDocs,
  getDoc,
  updateDoc,
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
import { useETACalculator } from '@/hooks/use-eta-calculator';
import { LocationPicker } from '@/components/maps';
import { Label } from './ui/label';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { format } from 'date-fns';
import { useRideStore } from '@/store/ride-store';

const formSchema = z.object({
  pickup: z.string().min(5, 'Por favor, introduce una ubicación de recojo válida.'),
  dropoff: z.string().min(5, 'Por favor, introduce una ubicación de destino válida.'),
  serviceType: z.enum(['economy', 'comfort', 'exclusive'], { required_error: 'Debes seleccionar un tipo de servicio.' }).default('economy'),
  paymentMethod: z.enum(['cash', 'yape', 'plin'], { required_error: 'Debes seleccionar un método de pago.' }).default('cash'),
  couponCode: z.string().optional(),
  scheduledTime: z.date().optional(),
});


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

interface RideRequestFormProps {
    onRideCreated: (ride: Ride) => void;
}

export default function RideRequestForm({ onRideCreated }: RideRequestFormProps) {
    const {
    status,
    pickupLocation,
    dropoffLocation,
    routeInfo,
    setPickupLocation,
    setDropoffLocation,
    setRouteInfo,
    resetRide,
    setStatus,
  } = useRideStore();
  
  const [appSettings, setAppSettings] = useState<Settings | null>(null);
  const [locationPickerFor, setLocationPickerFor] = useState<
    'pickup' | 'dropoff' | null
  >(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { calculateRoute, isCalculating, error: routeError } = useETACalculator();

  // Check if there are available drivers
  const checkAvailableDrivers = async (): Promise<boolean> => {
    try {
      console.log('🔍 Checking for available drivers...');
      const driversQuery = query(
        collection(db, 'drivers'),
        where('status', '==', 'available')
      );
      const driversSnapshot = await getDocs(driversQuery);
      console.log('👨‍💼 Available drivers found:', driversSnapshot.size);
      driversSnapshot.docs.forEach(doc => {
        const driver = doc.data();
        console.log('Driver:', { id: doc.id, name: driver.name, status: driver.status });
      });
      return !driversSnapshot.empty;
    } catch (error) {
      console.error('❌ Error checking available drivers:', error);
      return false; // If there's an error, assume no drivers to be safe
    }
  };

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
    if (pickupLocation?.address) {
        form.setValue('pickup', pickupLocation.address);
    }
     if (dropoffLocation?.address) {
        form.setValue('dropoff', dropoffLocation.address);
    }
  }, [pickupLocation, dropoffLocation, form]);


  useEffect(() => {
    async function fetchSettings() {
      const settings = await getSettings();
      setAppSettings(settings);
    }
    fetchSettings();
  }, []);

  const handleLocationSelected = (location: Location) => {
    if (locationPickerFor === 'pickup') {
      setPickupLocation(location);
    } else if (locationPickerFor === 'dropoff') {
      setDropoffLocation(location);
    }
    setLocationPickerFor(null);
  };


  const onSubmit = async () => {
    if (!pickupLocation || !dropoffLocation || !user) return;
    
    if(isScheduling && form.getValues('scheduledTime')) {
        const scheduledTime = form.getValues('scheduledTime');
        const newScheduledRideRef = doc(collection(db, 'scheduledRides'));
        const newScheduledRide: ScheduledRide = {
            id: newScheduledRideRef.id,
            pickup: form.getValues('pickup'),
            dropoff: form.getValues('dropoff'),
            scheduledTime: scheduledTime!.toISOString(),
            passenger: doc(db, 'users', user.uid),
            status: 'pending',
            serviceType: form.getValues('serviceType'),
            paymentMethod: form.getValues('paymentMethod'),
            createdAt: new Date().toISOString(),
        };

        try {
            await setDoc(newScheduledRideRef, newScheduledRide);
            toast({
                title: '¡Viaje Agendado!',
                description: `Tu viaje ha sido programado para el ${format(scheduledTime!, "dd/MM/yyyy 'a las' HH:mm")}.`,
            });
            resetForm();
        } catch (error) {
            console.error("Error creating scheduled ride:", error);
            toast({ variant: 'destructive', title: 'Error al Agendar', description: 'No se pudo guardar el viaje agendado.' });
        }
        return;
    }

    // Calculate route and create ride immediately
    const route = await calculateRoute(
      pickupLocation,
      dropoffLocation,
      {
        serviceType: form.getValues('serviceType'),
        couponCode: form.getValues('couponCode') || undefined
      }
    );
    
    if (route && route.fareBreakdown) {
      setRouteInfo(route);
      // Go to confirmed state to show trip details
      setStatus('confirmed');
    }
  };

  async function handleCreateRide(fare: number, breakdown: FareBreakdown) {
    if (!user) {
      console.log('❌ No user found');
      return;
    }
    
    console.log('🎯 Creating ride directly...');
    
    // First, check if there are available drivers
    const hasAvailableDrivers = await checkAvailableDrivers();
    console.log('🚗 Available drivers check result:', hasAvailableDrivers);
    
    if (!hasAvailableDrivers) {
      console.log('❌ No available drivers, showing error toast');
      toast({
        variant: 'destructive',
        title: 'No hay conductores disponibles',
        description: 'En este momento no hay conductores activos en tu zona. Por favor, intenta más tarde.',
      });
      return;
    }
    
    console.log('✅ Proceeding with ride creation...');
    
    const passengerRef = doc(db, 'users', user.uid);
    const rideRef = doc(collection(db, 'rides'));
    
    try {
      const newRideData: Ride = {
        id: rideRef.id,
        pickup: form.getValues('pickup'),
        dropoff: form.getValues('dropoff'),
        pickupLocation: pickupLocation || undefined, // Guardar coordenadas de recojo
        dropoffLocation: dropoffLocation || undefined, // Guardar coordenadas de destino
        date: new Date().toISOString(),
        fare: fare,
        driver: null,
        passenger: passengerRef,
        vehicle: null,
        serviceType: form.getValues('serviceType'),
        paymentMethod: form.getValues('paymentMethod'),
        couponCode: form.getValues('couponCode') || '',
        fareBreakdown: breakdown,
        status: 'searching' as const,
        offeredTo: null,
        rejectedBy: [],
        isRatedByPassenger: false,
      };

      await setDoc(rideRef, newRideData);
      console.log('🚗 Ride created successfully:', newRideData.id);
      
      onRideCreated(newRideData);

      // Set a timeout to handle no driver acceptance
      setTimeout(async () => {
        try {
          const currentRideRef = doc(db, 'rides', newRideData.id);
          const currentRideDoc = await getDoc(currentRideRef);
          
          if (currentRideDoc.exists()) {
            const rideData = currentRideDoc.data() as Ride;
            if (rideData.status === 'searching') {
              await updateDoc(currentRideRef, {
                status: 'cancelled',
                cancellationReason: {
                  code: 'NO_DRIVER_AVAILABLE',
                  reason: 'No se encontró conductor disponible'
                },
                cancelledBy: 'system'
              });
              
              toast({
                variant: 'destructive',
                title: 'No se encontró conductor',
                description: 'No hay conductores disponibles en este momento. Intenta nuevamente.',
              });
            }
          }
        } catch (error) {
          console.error('Error in timeout handler:', error);
        }
      }, 180000); // 3 minutes timeout

    } catch (error) {
      console.error('Error creating ride:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Error al crear el viaje', 
        description: 'No se pudo registrar el viaje. Inténtalo de nuevo.' 
      });
      resetForm();
    }
  }

  function resetForm() {
    resetRide();
    setIsScheduling(false);
    form.reset();
  }


  if (!appSettings) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show trip confirmation view
  if (status === 'confirmed' && routeInfo) {
    return (
      <div className="space-y-6">
        {/* Header with gradient background */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-6 text-white">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 via-blue-700/90 to-blue-800/90"></div>
          <div className="relative z-10 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <Car className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Confirmar tu viaje</h2>
            <p className="text-blue-100">Revisa los detalles antes de buscar conductor</p>
          </div>
        </div>
        
        {/* Trip Details Card */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-gray-50 to-white">
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Route Information */}
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <div className="h-8 w-0.5 bg-gray-300"></div>
                    <MapPin className="h-4 w-4 text-red-500" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <p className="text-sm font-medium text-green-700">Recojo</p>
                      <p className="text-gray-900 font-medium">{pickupLocation?.address}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-700">Destino</p>
                      <p className="text-gray-900 font-medium">{dropoffLocation?.address}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Trip Metrics */}
              <div className="grid grid-cols-3 gap-4 rounded-xl bg-blue-50 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{routeInfo.distance.text}</p>
                  <p className="text-xs text-blue-700 font-medium">Distancia</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{routeInfo.duration.text}</p>
                  <p className="text-xs text-blue-700 font-medium">Duración</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">S/ {(routeInfo.estimatedFare || 0).toFixed(2)}</p>
                  <p className="text-xs text-green-700 font-medium">Precio</p>
                </div>
              </div>
              
              {/* Traffic Information */}
              {routeInfo.duration && routeInfo.duration.value > 0 && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
                    <p className="text-sm font-medium text-amber-800">
                      Condiciones de tráfico en tiempo real incluidas
                    </p>
                  </div>
                  <p className="text-xs text-amber-700 mt-1">
                    Tiempo estimado considerando el tráfico actual
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
            onClick={async () => {
              if (routeInfo.fareBreakdown) {
                await handleCreateRide(routeInfo.estimatedFare || 0, routeInfo.fareBreakdown);
              }
            }}
          >
            <Car className="mr-3 h-6 w-6" />
            Buscar Conductor
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            className="w-full h-12 border-2 border-gray-300 hover:bg-gray-50"
            onClick={() => setStatus('calculated')}
          >
            Volver a editar
          </Button>
        </div>
      </div>
    );
  }
  
  const isFormLocked = status !== 'idle';


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
            onLocationSelect={handleLocationSelected}
            onCancel={() => setLocationPickerFor(null)}
            isPickup={locationPickerFor === 'pickup'}
            initialLocation={locationPickerFor === 'pickup' ? pickupLocation : dropoffLocation}
          />
        </DialogContent>
      </Dialog>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          {(status === 'idle' || isCalculating || status === 'calculated') && (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Punto de Recojo</Label>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-left font-normal h-auto"
                    onClick={() => setLocationPickerFor('pickup')}
                    disabled={isFormLocked}
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
                    disabled={isFormLocked}
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
              
              {isScheduling && (
                  <FormField
                    control={form.control}
                    name="scheduledTime"
                    render={({ field }) => (
                      <FormItem className="flex flex-col rounded-lg border p-4">
                        <FormLabel>Fecha y Hora del Agendamiento</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
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
                              disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                            />
                            <div className="p-2 border-t">
                               <Input 
                                type="time"
                                value={field.value ? format(field.value, 'HH:mm') : ''}
                                onChange={(e) => {
                                    const time = e.target.value.split(':');
                                    const newDate = new Date(field.value || new Date());
                                    newDate.setHours(parseInt(time[0]), parseInt(time[1]));
                                    field.onChange(newDate);
                                }}
                               />
                            </div>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              )}

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
                        disabled={isFormLocked}
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
                                field.value === service.id && "border-primary bg-primary/10",
                                isFormLocked && "cursor-not-allowed opacity-50"
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
                        disabled={isFormLocked}
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
                                field.value === method && "border-primary bg-primary/10",
                                isFormLocked && "cursor-not-allowed opacity-50"
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

              <FormField
                control={form.control}
                name="couponCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de Cupón (Opcional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          placeholder="Ej: BIENVENIDO10"
                          className="pl-10"
                          disabled={isFormLocked}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {(isCalculating || status === 'calculated') && routeInfo && (
                <ETADisplay
                  routeInfo={routeInfo}
                  isCalculating={isCalculating}
                  error={routeError}
                />
              )}

              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                {status === 'idle' && (
                  <>
                  <Button
                    type={isScheduling ? 'submit' : 'button'}
                    variant="outline"
                    className="w-full"
                    disabled={isCalculating || !pickupLocation || !dropoffLocation}
                    onClick={() => setIsScheduling(prev => !prev)}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {isScheduling ? 'Agendar Viaje' : 'Agendar para más tarde'}
                  </Button>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isCalculating || !pickupLocation || !dropoffLocation}
                    onClick={() => setIsScheduling(false)}
                  >
                    {isCalculating && !isScheduling ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    {isCalculating && !isScheduling ? 'Calculando...' : 'Pedir Ahora'}
                  </Button>
                  </>
                )}
              </div>

              {status === 'calculated' && routeInfo && (
                  <div className="space-y-2">
                    <Button
                      type="button"
                      className="w-full"
                      onClick={() => setStatus('confirmed')}
                    >
                      Confirmar Viaje
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                     <Button
                      type="button"
                      variant="link"
                      className="w-full text-muted-foreground"
                      onClick={resetForm}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Empezar de Nuevo
                    </Button>
                  </div>
                )}
            </>
          )}
        </form>
      </Form>
    </>
  );
}
