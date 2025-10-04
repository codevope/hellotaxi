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
  Ticket,
} from 'lucide-react';
import type {
  Ride,
  PaymentMethod,
  ServiceType,
  Settings,
  FareBreakdown,
  Location,
} from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import {
  collection,
  doc,
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
import { useRideStore } from '@/store/ride-store';

const formSchema = z.object({
  pickup: z.string().min(5, 'Por favor, introduce una ubicación de recojo válida.'),
  dropoff: z.string().min(5, 'Por favor, introduce una ubicación de destino válida.'),
  serviceType: z.enum(['economy', 'comfort', 'exclusive'], { required_error: 'Debes seleccionar un tipo de servicio.' }).default('economy'),
  paymentMethod: z.enum(['cash', 'yape', 'plin'], { required_error: 'Debes seleccionar un método de pago.' }).default('cash'),
  couponCode: z.string().optional(),
});

const paymentMethodIcons: Record<Exclude<PaymentMethod, 'card'>, React.ReactNode> = {
  cash: <Image src="/img/cash.webp" alt="Efectivo" width={40} height={40} className="object-contain h-10" />,
  yape: <Image src="/img/yape.png" alt="Yape" width={80} height={40} className="object-contain h-10" />,
  plin: <Image src="/img/plin.png" alt="Plin" width={80} height={40} className="object-contain h-10" />,
};

const serviceTypeIcons: Record<ServiceType, React.ReactNode> = {
  economy: <Car className="h-8 w-8 text-[#2E4CA6]" />,
  comfort: <CarFront className="h-8 w-8 text-[#0477BF]" />,
  exclusive: <Rocket className="h-8 w-8 text-[#049DD9]" />,
};

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
  const [locationPickerFor, setLocationPickerFor] = useState<'pickup' | 'dropoff' | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { calculateRoute, isCalculating, error: routeError } = useETACalculator();

  // 🔍 Verificar conductores disponibles
  const checkAvailableDrivers = async (): Promise<boolean> => {
    try {
      const driversQuery = query(
        collection(db, 'drivers'),
        where('status', '==', 'available')
      );
      const driversSnapshot = await getDocs(driversQuery);
      return !driversSnapshot.empty;
    } catch (error) {
      console.error('❌ Error checking available drivers:', error);
      return false;
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
    if (pickupLocation?.address) form.setValue('pickup', pickupLocation.address);
    if (dropoffLocation?.address) form.setValue('dropoff', dropoffLocation.address);
  }, [pickupLocation, dropoffLocation, form]);

  useEffect(() => {
    async function fetchSettings() {
      const settings = await getSettings();
      setAppSettings(settings);
    }
    fetchSettings();
  }, []);

  const handleLocationSelected = (location: Location) => {
    if (locationPickerFor === 'pickup') setPickupLocation(location);
    else if (locationPickerFor === 'dropoff') setDropoffLocation(location);
    setLocationPickerFor(null);
  };

  const onSubmit = async () => {
    if (!pickupLocation || !dropoffLocation || !user) return;
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
      setStatus('confirmed');
    }
  };

  async function handleCreateRide(fare: number, breakdown: FareBreakdown) {
    if (!user) return;
    const hasAvailableDrivers = await checkAvailableDrivers();
    if (!hasAvailableDrivers) {
      toast({
        variant: 'destructive',
        title: 'No hay conductores disponibles',
        description: 'En este momento no hay conductores activos en tu zona. Por favor, intenta más tarde.',
      });
      return;
    }

    const passengerRef = doc(db, 'users', user.uid);
    const rideRef = doc(collection(db, 'rides'));
    const newRideData: Ride = {
      id: rideRef.id,
      pickup: form.getValues('pickup'),
      dropoff: form.getValues('dropoff'),
      pickupLocation: pickupLocation || undefined,
      dropoffLocation: dropoffLocation || undefined,
      date: new Date().toISOString(),
      fare,
      driver: null,
      passenger: passengerRef,
      vehicle: null,
      serviceType: form.getValues('serviceType'),
      paymentMethod: form.getValues('paymentMethod'),
      couponCode: form.getValues('couponCode') || '',
      fareBreakdown: breakdown,
      status: 'searching',
      offeredTo: null,
      rejectedBy: [],
      isRatedByPassenger: false,
    };

    await setDoc(rideRef, newRideData);
    onRideCreated(newRideData);

    setTimeout(async () => {
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
    }, 180000); // 3 min
  }

  function resetForm() {
    resetRide();
    form.reset();
  }

  if (!appSettings) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-[#0477BF]" />
      </div>
    );
  }

  // === Confirmación de viaje ===
  if (status === 'confirmed' && routeInfo) {
    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2E4CA6] via-[#0477BF] to-[#05C7F2] p-6 text-white">
          <div className="absolute inset-0 bg-gradient-to-br from-[#2E4CA6]/90 via-[#0477BF]/80 to-[#05C7F2]/80"></div>
          <div className="relative z-10 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <Car className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Confirmar tu viaje</h2>
            <p className="text-blue-100">Revisa los detalles antes de buscar conductor</p>
          </div>
        </div>

        <Card className="border-0 shadow-lg bg-gradient-to-r from-gray-50 to-white">
          <CardContent className="p-6 space-y-6">
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

            <div className="grid grid-cols-3 gap-4 rounded-xl bg-[#F2F2F2] p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-[#2E4CA6]">{routeInfo.distance.text}</p>
                <p className="text-xs text-gray-600 font-medium">Distancia</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#0477BF]">{routeInfo.duration.text}</p>
                <p className="text-xs text-gray-600 font-medium">Duración</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">S/ {(routeInfo.estimatedFare || 0).toFixed(2)}</p>
                <p className="text-xs text-gray-600 font-medium">Precio</p>
              </div>
            </div>

            {routeInfo.duration && (
              <div className="rounded-lg shadow p-4 space-y-3 bg-gradient-to-br from-[#F2F2F2] via-white to-[#F2F2F2]">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#2E4CA6] flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#05C7F2] animate-pulse" />
                    Tráfico en Tiempo Real
                  </p>
                  <span
                    className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full border",
                      routeInfo.trafficCondition === 'light' && "bg-[#05C7F2]/15 text-[#049DD9] border-[#049DD9]/40",
                      routeInfo.trafficCondition === 'moderate' && "bg-[#049DD9]/15 text-[#0477BF] border-[#0477BF]/40",
                      routeInfo.trafficCondition === 'heavy' && "bg-[#0477BF]/15 text-[#2E4CA6] border-[#2E4CA6]/40",
                      routeInfo.trafficCondition === 'unknown' && "bg-[#F2F2F2] text-[#2E4CA6] border-[#049DD9]/20"
                    )}
                  >
                    {routeInfo.trafficCondition === 'light' && 'Fluido'}
                    {routeInfo.trafficCondition === 'moderate' && 'Moderado'}
                    {routeInfo.trafficCondition === 'heavy' && 'Pesado'}
                    {routeInfo.trafficCondition === 'unknown' && 'Desconocido'}
                  </span>
                </div>
                {/* <div className="text-xs text-[#0477BF] flex flex-wrap gap-4">
                  {routeInfo.baselineDuration && (
                    <span>
                      Base: <strong>{routeInfo.baselineDuration.text}</strong>
                    </span>
                  )}
                  <span>
                    Actual: <strong>{routeInfo.duration.text}</strong>
                  </span>
                  {routeInfo.trafficDelaySeconds !== undefined && routeInfo.baselineDuration && (
                    <span>
                      Retraso: {Math.round(routeInfo.trafficDelaySeconds / 60)} min
                    </span>
                  )}
                </div> */}
                {/* {routeInfo.baselineDuration && routeInfo.trafficDelaySeconds !== undefined && (
                  <div className="space-y-1">
                    {(() => {
                      const base = routeInfo.baselineDuration.value;
                      const actual = routeInfo.duration.value;
                      const ratio = Math.min(actual / base, 2); // cap 2x
                      const pct = Math.min(((actual - base) / base) * 100, 100);
                      return (
                        <>
                          <div className="h-2 w-full bg-[#F2F2F2] rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full transition-all",
                                ratio <= 1.15 && "bg-gradient-to-r from-[#05C7F2] to-[#049DD9]",
                                ratio > 1.15 && ratio <= 1.4 && "bg-gradient-to-r from-[#049DD9] to-[#0477BF]",
                                ratio > 1.4 && "bg-gradient-to-r from-[#0477BF] to-[#2E4CA6]"
                              )}
                              style={{ width: `${(ratio / 2) * 100}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-[#0477BF]">
                            <span>0%</span>
                            <span>{pct.toFixed(0)}% atraso</span>
                            <span>+100%</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )} */}
                <p className="text-[11px] text-[#2E4CA6] italic">Los tiempos incluyen condiciones actuales de tráfico y pueden variar.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-[#2E4CA6] via-[#0477BF] to-[#05C7F2] text-white shadow-lg"
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
            variant="secondary"
            size="lg"
            className="w-full h-12 border-2 border-gray-300"
            onClick={() => setStatus('idle')}
          >
            Volver a editar
          </Button>
        </div>
      </div>
    );
  }

  // === Form principal ===
  const isFormLocked = status !== 'idle';

  return (
    <>
      <Dialog open={!!locationPickerFor} onOpenChange={(open) => !open && setLocationPickerFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {locationPickerFor === 'pickup' ? 'Seleccionar punto de recojo' : 'Seleccionar destino'}
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {(status === 'idle' || isCalculating || status === 'calculated') && (
            <>
              {/* Pickup */}
              <div className="space-y-2">
                <Label>Punto de Recojo</Label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start h-14 rounded-lg transition"
                  onClick={() => setLocationPickerFor('pickup')}
                  disabled={isFormLocked}
                >
                  <MapPin className="mr-2 h-5 w-5" />
                  {pickupLocation ? pickupLocation.address : 'Seleccionar punto de recojo'}
                </Button>
                <FormMessage>{form.formState.errors.pickup?.message}</FormMessage>
              </div>

              {/* Dropoff */}
              <div className="space-y-2">
                <Label>Punto de Destino</Label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start h-14 rounded-lg  transition"
                  onClick={() => setLocationPickerFor('dropoff')}
                  disabled={isFormLocked}
                >
                  <MapPin className="mr-2 h-5 w-5" />
                  {dropoffLocation ? dropoffLocation.address : 'Seleccionar destino'}
                </Button>
                <FormMessage>{form.formState.errors.dropoff?.message}</FormMessage>
              </div>

              {/* Tipo de Servicio */}
              <FormField
                control={form.control}
                name="serviceType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-[#2E4CA6] font-semibold">Tipo de Servicio</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-3 gap-4">
                        {appSettings.serviceTypes.map((service) => (
                          <FormItem key={service.id}>
                            <RadioGroupItem value={service.id} id={`service-${service.id}`} className="peer sr-only" />
                            <FormLabel
                              htmlFor={`service-${service.id}`}
                              className={cn(
                                "flex flex-col items-center rounded-xl border-2 p-4 shadow-sm cursor-pointer transition",
                                field.value === service.id
                                  ? "border-[#0477BF] bg-[#05C7F2]/10"
                                  : "border-gray-200 bg-[#F2F2F2] hover:border-[#049DD9] hover:bg-white",
                                isFormLocked && "cursor-not-allowed opacity-50"
                              )}
                            >
                              {serviceTypeIcons[service.id]}
                              <span className="font-semibold mt-2 text-[#2E4CA6]">{service.name}</span>
                            </FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Método de Pago */}
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-[#2E4CA6] font-semibold">Método de Pago</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-3 gap-4">
                        {(Object.keys(paymentMethodIcons) as Array<keyof typeof paymentMethodIcons>).map((method) => (
                          <FormItem key={method}>
                            <RadioGroupItem value={method} id={`payment-${method}`} className="peer sr-only" />
                            <FormLabel
                              htmlFor={`payment-${method}`}
                              className={cn(
                                "flex flex-col items-center justify-center rounded-xl border-2 p-2 h-20 cursor-pointer transition shadow-sm",
                                field.value === method
                                  ? "border-[#0477BF] bg-[#05C7F2]/10"
                                  : "border-gray-200 bg-[#F2F2F2] hover:border-[#049DD9] hover:bg-white",
                                isFormLocked && "cursor-not-allowed opacity-50"
                              )}
                            >
                              {paymentMethodIcons[method]}
                              {/* <span className="mt-2 text-sm font-bold text-[#2E4CA6]">{method.toUpperCase()}</span> */}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Cupón */}
              <FormField
                control={form.control}
                name="couponCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#2E4CA6] font-semibold">Código de Cupón (Opcional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0477BF]" />
                        <Input
                          {...field}
                          placeholder="Ej: BIENVENIDO10"
                          className="pl-10 rounded-lg"
                          disabled={isFormLocked}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ETA */}
              {/* {(isCalculating || status === 'calculated') && routeInfo && (
                <ETADisplay routeInfo={routeInfo} isCalculating={isCalculating} error={routeError} />
              )} */}

              {/* Botones */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                {status === 'idle' && (
                  <Button
                    type="submit"
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-[#2E4CA6] via-[#0477BF] to-[#05C7F2] text-white shadow-lg"
                    disabled={isCalculating || !pickupLocation || !dropoffLocation}
                  >
                    {isCalculating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                    {isCalculating ? 'Calculando...' : 'Pedir Ahora'}
                  </Button>
                )}
              </div>

              {status === 'calculated' && routeInfo && (
                <div className="space-y-4">
                  <Button
                    type="button"
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-[#2E4CA6] via-[#0477BF] to-[#05C7F2] text-white shadow-lg"
                    onClick={() => setStatus('confirmed')}
                  >
                    Confirmar Viaje
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full text-muted-foreground shadow"
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
