
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
  Calendar as CalendarIcon,
} from 'lucide-react';
import type {
  Ride,
  Driver,
  PaymentMethod,
  ServiceType,
  Settings,
  FareBreakdown,
  Location,
  ScheduledRide,
} from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import FareNegotiation from './fare-negotiation';
import { useToast } from '@/hooks/use-toast';
import {
  collection,
  doc,
  addDoc,
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
import { LocationPicker } from '@/components/maps';
import { Label } from './ui/label';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { format } from 'date-fns';

const formSchema = z.object({
  pickup: z.string().min(5, 'Por favor, introduce una ubicación de recojo válida.'),
  dropoff: z.string().min(5, 'Por favor, introduce una ubicación de destino válida.'),
  serviceType: z.enum(['economy', 'comfort', 'exclusive'], { required_error: 'Debes seleccionar un tipo de servicio.' }).default('economy'),
  paymentMethod: z.enum(['cash', 'yape', 'plin'], { required_error: 'Debes seleccionar un método de pago.' }).default('cash'),
  couponCode: z.string().optional(),
  scheduledTime: z.date().optional(),
});

type RideRequestFormProps = {
  onRideCreated: (ride: Ride) => void;
  pickupLocation: Location | null;
  dropoffLocation: Location | null;
  onLocationSelect: (location: Location, type: 'pickup' | 'dropoff') => void;
  onReset: () => void;
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
  onRideCreated,
  pickupLocation,
  dropoffLocation,
  onLocationSelect,
  onReset,
}: RideRequestFormProps) {
  const [status, setStatus] = useState<
    | 'idle'
    | 'calculating'
    | 'calculated'
    | 'negotiating'
    | 'scheduling'
  >('idle');
  
  const [appSettings, setAppSettings] = useState<Settings | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [locationPickerFor, setLocationPickerFor] = useState<
    'pickup' | 'dropoff' | null
  >(null);
  const [isScheduling, setIsScheduling] = useState(false);
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
    form.setValue('pickup', pickupLocation?.address || '');
    form.setValue('dropoff', dropoffLocation?.address || '');
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
      onLocationSelect(location, 'pickup');
    } else if (locationPickerFor === 'dropoff') {
      onLocationSelect(location, 'dropoff');
    }
    setLocationPickerFor(null);
  };


  const onSubmit = async () => {
    if (!pickupLocation || !dropoffLocation || !user) return;
    
    // If scheduling, handle it separately
    if(isScheduling && form.getValues('scheduledTime')) {
        const scheduledTime = form.getValues('scheduledTime');
        const newScheduledRide: Omit<ScheduledRide, 'id'> = {
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
            await addDoc(collection(db, 'scheduledRides'), newScheduledRide);
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
      setStatus('idle');
    }
  };

  async function handleNegotiationComplete(
    fare: number,
    breakdown: FareBreakdown
  ) {
    if (!user) return;
    
    const passengerRef = doc(db, 'users', user.uid);
    
    try {
      const newRideData = {
        pickup: form.getValues('pickup'),
        dropoff: form.getValues('dropoff'),
        date: new Date().toISOString(),
        fare: fare,
        driver: null,
        passenger: passengerRef,
        serviceType: form.getValues('serviceType'),
        paymentMethod: form.getValues('paymentMethod'),
        couponCode: form.getValues('couponCode') || '',
        fareBreakdown: breakdown,
        status: 'searching' as const,
      };

      const rideDocRef = await addDoc(collection(db, 'rides'), newRideData);

      await updateDoc(passengerRef, { totalRides: increment(1) });
      
      const createdRide: Ride = { id: rideDocRef.id, ...newRideData, driver: doc(db, 'drivers/placeholder') };
      onRideCreated(createdRide);

      resetForm();

    } catch (error) {
      console.error('Error creating ride:', error);
      toast({ variant: 'destructive', title: 'Error al crear el viaje', description: 'No se pudo registrar el viaje. Inténtalo de nuevo.' });
      resetForm();
    }
  }

  function resetForm() {
    setStatus('idle');
    onReset();
    setRouteInfo(null);
    setIsScheduling(false);
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

  if (!appSettings) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
              
              {(status === 'calculating' || status === 'calculated') && routeInfo && (
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
                  </>
                )}
              </div>

              {status === 'calculated' && (
                  <div className="space-y-2">
                    <Button
                      type="button"
                      className="w-full"
                      onClick={() => setStatus('negotiating')}
                    >
                      Continuar a la Negociación
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
