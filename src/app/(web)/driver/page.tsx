"use client";

import AppHeader from "@/components/app-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Car,
  ShieldAlert,
  FileText,
  Star,
  UserCog,
  Wallet,
  History,
  MessageCircle,
  LogIn,
  Siren,
  CircleDollarSign,
  Save,
  CreditCard,
  CalendarCheck,
} from "lucide-react";
import { useDriverAuth } from "@/hooks/use-driver-auth";
import { useCounterOffer } from "@/hooks/use-counter-offer";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import type {
  Ride,
  User,
  Driver,
  ChatMessage,
  EnrichedDriver,
  PaymentModel,
} from "@/lib/types";

// Import the type from the store file
type DriverActiveRide = Omit<Ride, "passenger" | "driver"> & {
  passenger: User;
  driver: EnrichedDriver;
};
import { useEffect, useState, useCallback } from "react";
import { collection, doc, updateDoc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import RatingForm from "@/components/rating-form";
import { processRating } from "@/ai/flows/process-rating";
import MapView from "@/components/map-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DriverDocuments from "@/components/driver/documents";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
// simulación ahora gestionada dentro de useDriverActiveRide
import { useDriverActiveRide } from "@/hooks/driver/use-driver-active-ride";
import { useIncomingRideRequests } from "@/hooks/driver/use-incoming-ride-requests";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Chat from "@/components/chat";
import Link from "next/link";
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
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDriverRideStore } from "@/store/driver-ride-store";
import DriverVehicle from "@/components/driver/vehicle";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DataTable } from "@/components/ui/data-table";
import { columns as rideHistoryColumns } from "@/components/driver/ride-history-columns";
import { IncomingRideRequest } from "@/components/driver/incoming-ride-request";
import { ActiveRideCard } from "@/components/driver/active-ride-card";
import { DriverMapView } from "@/components/driver/driver-map-view";
import { DriverProfileCard } from "@/components/driver/driver-profile-card";
import { useDriverChat } from "@/hooks/driver/use-driver-chat";
import { useDriverRideHistory } from "@/hooks/driver/use-driver-ride-history";
import { useDriverPaymentPlan } from "@/hooks/driver/use-driver-payment-plan";
import { DriverStatePanel } from "@/components/driver/driver-state-panel";

const statusConfig: Record<
  Driver["status"],
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  available: { label: "Disponible", variant: "default" },
  unavailable: { label: "No Disponible", variant: "secondary" },
  "on-ride": { label: "En Viaje", variant: "outline" },
};

const rideStatusConfig: Record<
  Ride["status"],
  { label: string; variant: "secondary" | "default" | "destructive" }
> = {
  searching: { label: "Buscando", variant: "default" },
  accepted: { label: "Aceptado", variant: "default" },
  arrived: { label: "Ha llegado", variant: "default" },
  "in-progress": { label: "En Progreso", variant: "default" },
  completed: { label: "Completado", variant: "secondary" },
  cancelled: { label: "Cancelado", variant: "destructive" },
  "counter-offered": { label: "Contraoferta", variant: "default" },
};

type EnrichedRide = Omit<Ride, "passenger" | "driver"> & { passenger: User; driver: EnrichedDriver };

function DriverPageContent() {
  const {
    isAvailable,
    incomingRequest,
    activeRide,
    isCountering,
    setAvailability,
    setIncomingRequest,
    setActiveRide,
    setIsCountering,
  } = useDriverRideStore();

  const { user, driver, setDriver, loading } = useDriverAuth();
  const { toast } = useToast();
  // Historial (reemplaza allRides + efecto manual)
  const { rides: allRides } = useDriverRideHistory(driver, 25);
  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);
  // Estado desplazado ahora en hook useDriverActiveRide
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [isDriverChatOpen, setIsDriverChatOpen] = useState(false);
  const [rejectedRideIds, setRejectedRideIds] = useState<string[]>([]);

  // Hook: activo y rating
  const { activeRide: activeRideHook, completedRideForRating, setCompletedRideForRating, updateRideStatus, isCompletingRide, driverLocation } = useDriverActiveRide({ driver, setAvailability });

  // Chat (reemplaza chatMessages + listener manual) - debe ir después de obtener activeRideHook
  const { messages: chatMessages, sendMessage } = useDriverChat({ rideId: activeRideHook?.id, userId: user?.uid });

  // Mantener compat con store hasta migración completa
  useEffect(() => {
    if (activeRideHook && !activeRide) {
      setActiveRide(activeRideHook as any);
    }
  }, [activeRideHook, activeRide, setActiveRide]);

  // Hook: solicitudes entrantes
  const {
    incomingRequest: incomingRequestHook,
    requestTimeLeft,
    isCountering: isCounteringHook,
    counterOfferAmount,
    setCounterOfferAmount,
    acceptRequest,
    rejectRequest,
    submitCounterOffer,
    startCounterMode,
  } = useIncomingRideRequests({ driver, isAvailable, rejectedRideIds, setRejectedRideIds });

  useEffect(() => {
    if (incomingRequestHook !== incomingRequest) {
      setIncomingRequest(incomingRequestHook as any);
    }
  }, [incomingRequestHook, incomingRequest, setIncomingRequest]);

  // Counter-offer hook
  const { isListening: isCounterOfferListening, error: counterOfferError } =
    useCounterOffer(driver, activeRide);

  // Plan de pago (hook)
  const { selectedPaymentModel, setSelectedPaymentModel, save: handleSavePaymentPlan, isSavingPlan, membershipStatus } = useDriverPaymentPlan(driver, setDriver as any);

  // Sync driver availability status with local state
  useEffect(() => {
    if (driver) {
      const isDriverAvailable = driver.status === "available";
      setAvailability(isDriverAvailable);
    }
  }, [driver, setAvailability]);

  // 30-second countdown timer for incoming ride requests
  // Countdown movido a useIncomingRideRequests

  // MASTER useEffect for driver's active ride
  // Active ride listener movido a useDriverActiveRide

  // MASTER useEffect for new ride requests
  // Incoming ride listener movido a useIncomingRideRequests

  // Listener de chat movido a useDriverChat

  // Note: Counter-offer acceptance is now handled by the useCounterOffer hook
  // This listener has been removed to avoid duplication and toast issues

  // Historial movido a useDriverRideHistory

  const handleAvailabilityChange = async (available: boolean) => {
    if (!driver) return;

    setIsUpdatingStatus(true);
    const newStatus = available ? "available" : "unavailable";
    const driverRef = doc(db, "drivers", driver.id);

    try {
      await updateDoc(driverRef, { status: newStatus });
      setDriver({ ...driver, status: newStatus });
      setAvailability(available);

      toast({
        title: `Estado actualizado: ${
          available ? "Disponible" : "No Disponible"
        }`,
        description: available
          ? "Ahora recibirás solicitudes de viaje."
          : "Has dejado de recibir solicitudes.",
      });
    } catch (error) {
      console.error("Error updating availability:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar tu estado.",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Reemplazado por acceptRequest / rejectRequest hooks

  // Contraoferta movida a hook (submitCounterOffer / startCounterMode)

  // Actualización de estado movida al hook updateRideStatus

  const handleSosConfirm = async () => {
    if (!activeRide || !user || !driver) return;

    try {
      const newSosAlertRef = doc(collection(db, "sosAlerts"));
      await addDoc(collection(db, "sosAlerts"), {
        id: newSosAlertRef.id,
        rideId: activeRide.id,
        passenger: doc(db, "users", activeRide.passenger.id),
        driver: doc(db, "drivers", driver.id),
        date: new Date().toISOString(),
        status: "pending",
        triggeredBy: "driver",
      });
      toast({
        variant: "destructive",
        title: "¡Alerta de Pánico Activada!",
        description: "Se ha notificado a la central de seguridad.",
      });
    } catch (error) {
      console.error("Error creating SOS alert:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo activar la alerta de pánico.",
      });
    }
  };

  const handleRatingSubmit = async (
    passengerId: string,
    rating: number,
    comment: string
  ) => {
    if (!completedRideForRating) return;
    setIsRatingSubmitting(true);
    try {
      await processRating({
        ratedUserId: passengerId,
        isDriver: false,
        rating,
        comment,
      });
      toast({
        title: "Pasajero Calificado",
        description: `Has calificado al pasajero con ${rating} estrellas.`,
      });
      setCompletedRideForRating(null);
    } catch (error) {
      console.error("Error submitting passenger rating:", error);
      toast({
        variant: "destructive",
        title: "Error al Calificar",
        description: "No se pudo guardar la calificación. Inténtalo de nuevo.",
      });
    } finally {
      setIsRatingSubmitting(false);
    }
  };

  // Envío de mensajes movido a useDriverChat (sendMessage)

  if (loading || !driver) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const isApproved = driver.documentsStatus === "approved";
  // membershipStatus lo provee hook de plan de pago

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 p-4 lg:p-8">
        <Tabs defaultValue="dashboard">
          <TabsList className="grid w-full grid-cols-5 max-w-2xl mx-auto">
            <TabsTrigger value="dashboard">
              <UserCog className="mr-2 h-4 w-4" />
              Panel
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="mr-2 h-4 w-4" />
              Historial
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="mr-2 h-4 w-4" />
              Documentos
            </TabsTrigger>
            <TabsTrigger value="vehicle">
              <Car className="mr-2 h-4 w-4" />
              Mi Vehículo
            </TabsTrigger>
            <TabsTrigger value="profile">
              <Wallet className="mr-2 h-4 w-4" />
              Perfil
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 flex flex-col min-h-[60vh] rounded-xl overflow-hidden shadow-lg relative">
                <MapView
                  driverLocation={driverLocation}
                  pickupLocation={activeRideHook?.pickupLocation ? activeRideHook.pickupLocation : null}
                  dropoffLocation={activeRideHook?.dropoffLocation ? activeRideHook.dropoffLocation : null}
                  interactive={false}
                />
                {activeRideHook && (
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
                            ¿Estás seguro de que quieres activar la alerta de
                            pánico?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción notificará inmediatamente a nuestra
                            central de seguridad. Úsalo solo en caso de una
                            emergencia real.
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
                    <Sheet
                      open={isDriverChatOpen}
                      onOpenChange={setIsDriverChatOpen}
                    >
                          <SheetTrigger asChild>
                            <Button size="icon" className="absolute bottom-4 left-4 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90">
                              <MessageCircle className="h-7 w-7" />
                            </Button>
                          </SheetTrigger>
                          <SheetContent side="left" className="w-full max-w-sm p-0">
                            <SheetHeader className="p-4 border-b text-left">
                              <SheetTitle className="flex items-center gap-2">
                                <MessageCircle className="h-5 w-5" />
                                <span>Chat con {activeRideHook?.passenger.name}</span>
                              </SheetTitle>
                            </SheetHeader>
                            <Chat messages={chatMessages} onSendMessage={sendMessage} />
                          </SheetContent>
                    </Sheet>
                  </>
                )}
              </div>
              <div className="flex flex-col gap-8">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-2xl font-headline">
                          Panel Principal
                        </CardTitle>
                        <CardDescription>
                          Gestiona tu estado y tus viajes.
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="availability-switch"
                          checked={isAvailable}
                          onCheckedChange={handleAvailabilityChange}
                          disabled={!isApproved || !!activeRideHook || isUpdatingStatus}
                          aria-label="Estado de disponibilidad"
                        />
                        <Label htmlFor="availability-switch">
                          <Badge variant={statusConfig[driver.status].variant}>
                            {isUpdatingStatus ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              statusConfig[driver.status].label
                            )}
                          </Badge>
                        </Label>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!isApproved && (
                      <Alert variant="destructive">
                        <ShieldAlert className="h-4 w-4" />
                        <AlertTitle>Acción Requerida</AlertTitle>
                        <AlertDescription>
                          Tus documentos no están aprobados. No puedes recibir
                          viajes. Revisa la pestaña "Documentos".
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                <DriverStatePanel
                  incomingRequest={incomingRequestHook}
                  requestTimeLeft={requestTimeLeft}
                  isCountering={isCounteringHook}
                  counterOfferAmount={counterOfferAmount}
                  setCounterOfferAmount={setCounterOfferAmount}
                  acceptRequest={acceptRequest}
                  rejectRequest={rejectRequest}
                  startCounterMode={startCounterMode}
                  submitCounterOffer={submitCounterOffer}
                  activeRide={activeRideHook as any}
                  updateRideStatus={(status) => updateRideStatus(activeRideHook as any, status)}
                  isCompletingRide={isCompletingRide}
                  completedRideForRating={completedRideForRating as any}
                  onRatingSubmit={handleRatingSubmit}
                  isRatingSubmitting={isRatingSubmitting}
                  isDriverChatOpen={isDriverChatOpen}
                  setIsDriverChatOpen={setIsDriverChatOpen}
                  chatMessages={chatMessages}
                  onSendMessage={sendMessage}
                  onSos={handleSosConfirm}
                  passengerNameForChat={activeRideHook?.passenger.name}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <div className="mb-4 space-x-4 w-full max-w-5xl mx-auto">
              <DriverDocuments driver={driver} onUpdate={setDriver} />
            </div>
          </TabsContent>

          <TabsContent value="vehicle">
            <div className="mb-4 space-x-4 w-full max-w-5xl mx-auto">
              <DriverVehicle driver={driver} onUpdate={setDriver} />
            </div>
          </TabsContent>

          <TabsContent value="history">
            <div className="mb-4 w-full max-w-5xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Viajes</CardTitle>
                  <CardDescription>
                    Últimos 25 viajes realizados. Usa la búsqueda para filtrar por nombre de pasajero.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DataTable
                    columns={rideHistoryColumns}
                    data={allRides}
                    searchKey="passenger"
                    searchPlaceholder="Buscar por nombre de pasajero..."
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <div className="mb-4 space-x-4 w-full max-w-5xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Mi Perfil y Estadísticas</CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">
                        Información del Conductor
                      </h3>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                          <AvatarImage
                            src={driver.avatarUrl}
                            alt={driver.name}
                          />
                          <AvatarFallback>
                            {driver.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-2xl font-bold">{driver.name}</p>
                          <p className="text-muted-foreground capitalize">
                            {driver.vehicle.serviceType}
                          </p>
                        </div>
                      </div>
                      <h3 className="font-semibold text-lg mt-6">Vehículo</h3>
                      <p>
                        {driver.vehicle.brand} {driver.vehicle.model}
                      </p>
                      <p className="font-mono bg-muted p-2 rounded-md inline-block">
                        {driver.vehicle.licensePlate}
                      </p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Estadísticas</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-muted rounded-lg text-center">
                          <p className="text-4xl font-bold">
                            {
                              allRides.filter((r) => r.status === "completed")
                                .length
                            }
                          </p>
                          <p className="text-muted-foreground">
                            Viajes Completados
                          </p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg text-center">
                          <p className="text-4xl font-bold flex items-center justify-center gap-1">
                            <Star className="h-8 w-8 text-yellow-400 fill-yellow-400" />
                            {(driver.rating || 0).toFixed(1)}
                          </p>
                          <p className="text-muted-foreground">
                            Tu Calificación
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard />
                      Mi Plan de Pago
                    </CardTitle>
                    <CardDescription>
                      Elige cómo quieres ganar dinero con Hello Taxi.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={selectedPaymentModel}
                      onValueChange={(value) =>
                        setSelectedPaymentModel(value as PaymentModel)
                      }
                    >
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Label
                          htmlFor="payment-commission"
                          className="flex flex-col p-4 border rounded-lg cursor-pointer hover:bg-accent/50 has-[:checked]:bg-primary/10 has-[:checked]:border-primary"
                        >
                          <RadioGroupItem
                            value="commission"
                            id="payment-commission"
                            className="sr-only"
                          />
                          <span className="font-semibold text-lg">
                            Comisión por Viaje
                          </span>
                          <span className="text-sm text-muted-foreground mt-1">
                            Gana un porcentaje de cada viaje. Ideal para
                            conductores a tiempo parcial.
                          </span>
                        </Label>
                        <Label
                          htmlFor="payment-membership"
                          className="flex flex-col p-4 border rounded-lg cursor-pointer hover:bg-accent/50 has-[:checked]:bg-primary/10 has-[:checked]:border-primary"
                        >
                          <RadioGroupItem
                            value="membership"
                            id="payment-membership"
                            className="sr-only"
                          />
                          <span className="font-semibold text-lg">
                            Membresía Mensual
                          </span>
                          <span className="text-sm text-muted-foreground mt-1">
                            Paga una cuota fija y quédate con casi toda la
                            tarifa. Ideal para conductores a tiempo completo.
                          </span>
                        </Label>
                      </div>
                    </RadioGroup>
                    {selectedPaymentModel === "membership" && (
                      <div className="mt-4 p-4 border rounded-lg bg-secondary/50">
                        <h4 className="font-semibold flex items-center gap-2">
                          <CalendarCheck /> Estado de tu Membresía
                        </h4>
                        <div className="mt-2 flex justify-between items-center">
                          <Badge variant={membershipStatus.variant}>
                            {membershipStatus.label}
                          </Badge>
                          {driver.membershipExpiryDate && (
                            <span className="text-sm text-muted-foreground">
                              Vence el:{" "}
                              {format(
                                new Date(driver.membershipExpiryDate),
                                "dd 'de' MMMM, yyyy"
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button onClick={handleSavePaymentPlan} disabled={isSavingPlan || selectedPaymentModel === driver.paymentModel}>
                      {isSavingPlan && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      <Save className="mr-2" /> Guardar Cambios
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default function DriverPage() {
  const { user, loading: authLoading } = useDriverAuth();
  const { isDriver, loading: driverAuthLoading } = useDriverAuth();

  if (authLoading || driverAuthLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AppHeader />
        <main className="flex flex-col items-center justify-center text-center p-4 py-16 md:py-24">
          <Card className="max-w-md p-8">
            <CardHeader>
              <CardTitle>Acceso de Conductores</CardTitle>
              <CardDescription>
                Inicia sesión para acceder a tu panel de control.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg">
                <Link href="/login">
                  <LogIn className="mr-2" />
                  Ir a Iniciar Sesión
                </Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  if (!isDriver) {
    return (
      <>
        <AppHeader />
        <div className="flex flex-col items-center justify-center text-center flex-1 p-8">
          <Card className="max-w-md p-8">
            <CardHeader>
              <CardTitle>No eres un conductor</CardTitle>
              <CardDescription>
                Esta sección es solo para conductores registrados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/drive">¡Regístrate como Conductor!</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return <DriverPageContent />;
}