"use client";

import AppHeader from "@/components/app-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Car,
  ShieldAlert,
  FileText,
  Wallet,
  History,
  LogIn,
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
  EnrichedDriver,
  PaymentModel,
  ChatMessage,
} from "@/lib/types";
import { useEffect, useState, useCallback } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  writeBatch,
  onSnapshot,
  updateDoc,
  increment,
  getDoc,
  limit,
  addDoc,
  orderBy,
  runTransaction,
  arrayUnion,
  DocumentReference,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import RatingForm from "@/components/rating-form";
import { processRating } from "@/ai/flows/process-rating";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DriverDocuments from "@/components/driver/documents";
import Link from "next/link";
import { useDriverRideStore } from "@/store/driver-ride-store";
import DriverVehicle from "@/components/driver/vehicle";
import { DataTable } from "@/components/ui/data-table";
import { columns as rideHistoryColumns } from "@/components/driver/ride-history-columns";
import { IncomingRideRequest } from "@/components/driver/incoming-ride-request";
import { ActiveRideCard } from "@/components/driver/active-ride-card";
import { DriverMapView } from "@/components/driver/driver-map-view";
import { DriverProfileCard } from "@/components/driver/driver-profile-card";
import { PaymentPlanSelector } from "@/components/driver/payment-plan-selector";

const statusConfig: Record<
  EnrichedDriver["status"],
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  available: { label: "Disponible", variant: "default" },
  unavailable: { label: "No Disponible", variant: "secondary" },
  "on-ride": { label: "En Viaje", variant: "outline" },
};

type EnrichedRide = Omit<Ride, "passenger" | "driver"> & {
  passenger: User;
  driver: EnrichedDriver;
};

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
  const [allRides, setAllRides] = useState<EnrichedRide[]>([]);
  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);
  const [completedRideForRating, setCompletedRideForRating] =
    useState<EnrichedRide | null>(null);
  const [isCompletingRide, setIsCompletingRide] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [rejectedRideIds, setRejectedRideIds] = useState<string[]>([]);
  const [requestTimeLeft, setRequestTimeLeft] = useState<number>(30);
  const [counterOfferAmount, setCounterOfferAmount] = useState(0);

  // Counter-offer hook
  const { isListening: isCounterOfferListening, error: counterOfferError } =
    useCounterOffer(driver, activeRide);

  useEffect(() => {
    if (driver) {
      const isDriverAvailable = driver.status === "available";
      setAvailability(isDriverAvailable);
    }
  }, [driver, setAvailability]);

  // 30-second countdown timer for incoming ride requests
  useEffect(() => {
    if (!incomingRequest) {
      setRequestTimeLeft(30);
      return;
    }
    setRequestTimeLeft(30);
    const timer = setInterval(() => {
      setRequestTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          const currentRequest = useDriverRideStore.getState().incomingRequest;
          if (currentRequest && driver) {
            const rideRef = doc(db, "rides", currentRequest.id);
            setIncomingRequest(null);
            setRejectedRideIds((prev) => [...prev, currentRequest.id]);
            updateDoc(rideRef, {
              rejectedBy: arrayUnion(doc(db, "drivers", driver.id)),
              offeredTo: null,
            }).catch((error) =>
              console.error("Error auto-rejecting ride:", error)
            );
          }
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [incomingRequest, driver, setIncomingRequest, setRejectedRideIds]);

  // MASTER useEffect for driver's active ride
  useEffect(() => {
    if (!driver) return;
    const driverRef = doc(db, "drivers", driver.id);

    const q1 = query(
      collection(db, "rides"),
      where("driver", "==", driverRef),
      where("status", "in", ["accepted", "arrived", "in-progress", "completed"])
    );

    const unsubscribe1 = onSnapshot(q1, async (snapshot) => {
      if (!snapshot.empty) {
        const rideDoc = snapshot.docs.find(
          (doc) => doc.data().status !== "completed"
        );
        if (!rideDoc) {
          if (useDriverRideStore.getState().activeRide !== null) {
            const completedRideDoc = snapshot.docs.find(
              (doc) =>
                doc.data().status === "completed" &&
                doc.id === useDriverRideStore.getState().activeRide?.id
            );
            if (completedRideDoc) {
              const rideData = {
                id: completedRideDoc.id,
                ...completedRideDoc.data(),
              } as Ride;
              const passengerSnap = await getDoc(rideData.passenger as DocumentReference);
              if (passengerSnap.exists() && driver) {
                setCompletedRideForRating({
                  ...rideData,
                  driver,
                  passenger: passengerSnap.data() as User,
                });
              }
            }
            setActiveRide(null);
          }
          return;
        }

        const rideData = { id: rideDoc.id, ...rideDoc.data() } as Ride;
        if (rideData.passenger && driver) {
          const passengerSnap = await getDoc(rideData.passenger as DocumentReference);
          if (passengerSnap.exists()) {
            const passengerData = passengerSnap.data() as User;
            const rideWithPassenger = {
              ...rideData,
              driver,
              passenger: passengerData,
            };
            setActiveRide(rideWithPassenger);
          }
        }
      } else {
        if (useDriverRideStore.getState().activeRide !== null) {
          setActiveRide(null);
        }
      }
    });

    return () => unsubscribe1();
  }, [driver, setActiveRide, setIncomingRequest, toast]);

  // MASTER useEffect for new ride requests
  useEffect(() => {
    if (!driver || !isAvailable || activeRide || incomingRequest) return;

    const q = query(
      collection(db, "rides"),
      where("status", "==", "searching")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (
        useDriverRideStore.getState().activeRide ||
        useDriverRideStore.getState().incomingRequest
      ) {
        return;
      }

      const potentialRides = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Ride))
        .filter((ride) => {
          const alreadyOffered = !!ride.offeredTo;
          const alreadyRejectedByMe =
            rejectedRideIds.includes(ride.id) ||
            ride.rejectedBy?.some((ref) => ref.id === driver.id);
          return !alreadyOffered && !alreadyRejectedByMe;
        });

      if (potentialRides.length === 0) return;

      const rideToOffer = potentialRides[0];
      const rideRef = doc(db, "rides", rideToOffer.id);

      try {
        await runTransaction(db, async (transaction) => {
          const freshRideDoc = await transaction.get(rideRef);
          if (
            !freshRideDoc.exists() ||
            freshRideDoc.data().status !== "searching" ||
            freshRideDoc.data().offeredTo
          ) {
            throw new Error("Ride was taken by another driver or cancelled.");
          }
          transaction.update(rideRef, {
            offeredTo: doc(db, "drivers", driver.id),
          });
        });

        const passengerSnap = await getDoc(rideToOffer.passenger as DocumentReference);
        if (passengerSnap.exists()) {
          const passengerData = passengerSnap.data() as User;
          const { passenger: passengerRef, ...rideWithoutPassengerRef } =
            rideToOffer;
          setIncomingRequest({
            ...rideWithoutPassengerRef,
            passenger: passengerData,
          });
        }
      } catch (error) {
        console.log("Could not secure ride offer:", (error as Error).message);
      }
    });

    return () => unsubscribe();
  }, [
    driver,
    isAvailable,
    activeRide,
    incomingRequest,
    rejectedRideIds,
    setIncomingRequest,
  ]);

  // Listener for chat messages
  useEffect(() => {
    if (!activeRide) return;

    const chatQuery = query(
      collection(db, "rides", activeRide.id, "chatMessages"),
      orderBy("timestamp", "asc")
    );
    const unsubscribe = onSnapshot(chatQuery, (querySnapshot) => {
      const messages = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as ChatMessage)
      );
      setChatMessages(messages);
    });

    return () => unsubscribe();
  }, [activeRide]);

  // Load ride history for the driver
  useEffect(() => {
    if (!driver) return;

    const loadRideHistory = async () => {
      try {
        const driverRef = doc(db, "drivers", driver.id);
        const q = query(
          collection(db, "rides"),
          where("driver", "==", driverRef),
          orderBy("date", "desc"),
          limit(25)
        );

        const querySnapshot = await getDocs(q);
        const ridesWithPassengersPromises = querySnapshot.docs.map(
          async (rideDoc) => {
            const rideData = rideDoc.data() as Ride;

            if (!(rideData.passenger instanceof DocumentReference)) {
              return null;
            }

            const passengerDoc = await getDoc(rideData.passenger);
            if (!passengerDoc.exists()) {
              return null;
            }

            const passengerData = passengerDoc.data() as User;

            return {
              ...rideData,
              id: rideDoc.id,
              passenger: passengerData,
              driver: driver,
            } as EnrichedRide;
          }
        );

        const ridesWithPassengers = (
          await Promise.all(ridesWithPassengersPromises)
        ).filter(Boolean) as EnrichedRide[];

        setAllRides(ridesWithPassengers);
      } catch (error) {
        console.error("Error loading ride history:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo cargar el historial de viajes.",
        });
      }
    };

    loadRideHistory();
  }, [driver, toast]);

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

  const handleRideRequestResponse = useCallback(
    async (accepted: boolean) => {
      if (!incomingRequest || !driver) return;
      const rideId = incomingRequest.id;
      const rideRef = doc(db, "rides", rideId);
      setIncomingRequest(null);

      if (accepted) {
        try {
          await runTransaction(db, async (transaction) => {
            const rideDoc = await transaction.get(rideRef);
            if (
              !rideDoc.exists() ||
              !["searching", "counter-offered"].includes(rideDoc.data().status)
            ) {
              throw new Error("El viaje ya no está disponible.");
            }
            transaction.update(rideRef, {
              status: "accepted",
              driver: doc(db, "drivers", driver.id),
              vehicle: driver.vehicle ? doc(db, "vehicles", driver.vehicle.id) : null,
              offeredTo: null,
            });
            transaction.update(doc(db, "drivers", driver.id), {
              status: "on-ride",
            });
          });
          setAvailability(false);
        } catch (e: any) {
          toast({
            variant: "destructive",
            title: "Error",
            description: e.message || "No se pudo aceptar el viaje.",
          });
        }
      } else {
        setRejectedRideIds((prev) => [...prev, rideId]);
        await updateDoc(rideRef, {
          rejectedBy: arrayUnion(doc(db, "drivers", driver.id)),
          offeredTo: null,
        });
      }
    },
    [
      incomingRequest,
      driver,
      setIncomingRequest,
      setAvailability,
      setRejectedRideIds,
      toast,
    ]
  );

  const handleCounterOffer = async () => {
    if (!incomingRequest || !counterOfferAmount || !driver) return;
    const rideRef = doc(db, "rides", incomingRequest.id);

    try {
      await updateDoc(rideRef, {
        fare: counterOfferAmount,
        status: "counter-offered",
        offeredTo: doc(db, "drivers", driver.id),
      });
      toast({
        title: "Contraoferta Enviada",
        description: `Has propuesto una tarifa de S/${counterOfferAmount.toFixed(
          2
        )}`,
      });
      setIncomingRequest(null);
      setIsCountering(false);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo enviar la contraoferta.",
      });
    }
  };

  const handleUpdateRideStatus = async (
    newStatus: "arrived" | "in-progress" | "completed"
  ) => {
    if (!activeRide) return;
    setIsCompletingRide(true);
    const rideRef = doc(db, "rides", activeRide.id);
    const driverRef = doc(db, "drivers", activeRide.driver.id);

    try {
      if (newStatus === "completed") {
        const batch = writeBatch(db);
        batch.update(rideRef, { status: "completed" });
        batch.update(driverRef, { status: "available" });
        batch.update(doc(db, "users", activeRide.passenger.id), {
          totalRides: increment(1),
        });
        await batch.commit();
        toast({
          title: "¡Viaje Finalizado!",
          description: "Ahora califica al pasajero.",
        });
        setAvailability(true);
      } else {
        await updateDoc(rideRef, { status: newStatus });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el estado del viaje.",
      });
    } finally {
      setIsCompletingRide(false);
    }
  };

  const handleSosConfirm = async () => {
    if (!activeRide || !user || !driver) return;
    try {
      await addDoc(collection(db, "sosAlerts"), {
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
      toast({
        variant: "destructive",
        title: "Error al Calificar",
        description: "No se pudo guardar la calificación. Inténtalo de nuevo.",
      });
    } finally {
      setIsRatingSubmitting(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!user || !activeRide) return;
    const chatMessagesRef = collection(
      db,
      "rides",
      activeRide.id,
      "chatMessages"
    );
    await addDoc(chatMessagesRef, {
      userId: user.uid,
      text,
      timestamp: new Date().toISOString(),
    });
  };

  const handleSavePaymentPlan = async (paymentModel: PaymentModel) => {
    if (!driver) return;
    setIsSavingPlan(true);

    const driverRef = doc(db, "drivers", driver.id);
    const updates: {
      paymentModel: PaymentModel;
      membershipExpiryDate?: string;
    } = {
      paymentModel: paymentModel,
    };

    if (
      paymentModel === "membership" &&
      driver.paymentModel !== "membership"
    ) {
      updates.membershipExpiryDate = new Date(
        new Date().setDate(new Date().getDate() + 30)
      ).toISOString();
    }

    try {
      await updateDoc(driverRef, updates);
      setDriver({ ...driver, ...updates });
      toast({
        title: "Plan de Pago Actualizado",
        description: `Tu modelo de pago ahora es: ${
          paymentModel === "membership" ? "Membresía" : "Comisión"
        }.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar tu plan de pago.",
      });
    } finally {
      setIsSavingPlan(false);
    }
  };

  if (loading || !driver) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const isApproved = driver.documentsStatus === "approved";

  const renderDashboardContent = () => {
    if (incomingRequest) {
      return (
        <IncomingRideRequest
          isOpen={!!incomingRequest}
          onOpenChange={() => {}}
          passenger={incomingRequest.passenger}
          pickup={incomingRequest.pickup}
          dropoff={incomingRequest.dropoff}
          fare={incomingRequest.fare}
          requestTimeLeft={requestTimeLeft}
          isCountering={isCountering}
          counterOfferAmount={counterOfferAmount}
          onCounterOfferChange={setCounterOfferAmount}
          onAccept={() => handleRideRequestResponse(true)}
          onReject={() => handleRideRequestResponse(false)}
          onStartCounterOffer={() => {
            setCounterOfferAmount(incomingRequest.fare);
            setIsCountering(true);
          }}
          onSubmitCounterOffer={handleCounterOffer}
          onCancelCounterOffer={() => setIsCountering(false)}
        />
      );
    }
    if (activeRide) {
      return (
        <ActiveRideCard
          status={activeRide.status as "accepted" | "arrived" | "in-progress"}
          passenger={activeRide.passenger}
          dropoff={activeRide.dropoff}
          fare={activeRide.fare}
          isCompletingRide={isCompletingRide}
          onStatusUpdate={handleUpdateRideStatus}
        />
      );
    }
    if (completedRideForRating) {
      return (
        <RatingForm
          userToRate={completedRideForRating.passenger}
          isDriver={false}
          onSubmit={(rating, comment) =>
            handleRatingSubmit(
              completedRideForRating!.passenger.id,
              rating,
              comment
            )
          }
          isSubmitting={isRatingSubmitting}
        />
      );
    }
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-6 w-6 text-primary" />
            <span>Esperando Solicitudes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTitle>No hay solicitudes pendientes</AlertTitle>
            <AlertDescription>
              Cuando un pasajero solicite un viaje, aparecerá aquí.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 p-4 lg:p-8">
        <Tabs defaultValue="dashboard">
          <TabsList className="grid w-full grid-cols-4 max-w-xl mx-auto">
            <TabsTrigger value="dashboard">Panel</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
            <TabsTrigger value="profile">Perfil</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <DriverMapView
                  driverLocation={driver.location || null}
                  pickupLocation={
                    activeRide?.pickupLocation ? activeRide.pickupLocation : null
                  }
                  dropoffLocation={
                    activeRide?.dropoffLocation
                      ? activeRide.dropoffLocation
                      : null
                  }
                  hasActiveRide={!!activeRide}
                  passengerName={activeRide?.passenger.name}
                  chatMessages={chatMessages}
                  onSosConfirm={handleSosConfirm}
                  onSendMessage={handleSendMessage}
                />
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
                          disabled={
                            !isApproved || !!activeRide || isUpdatingStatus
                          }
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

                {renderDashboardContent()}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <div className="mb-4 space-y-4 w-full max-w-5xl mx-auto">
              <DriverDocuments driver={driver} onUpdate={setDriver} />
              <DriverVehicle driver={driver} onUpdate={setDriver} />
            </div>
          </TabsContent>

          <TabsContent value="history">
            <div className="mb-4 w-full max-w-5xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Viajes</CardTitle>
                  <CardDescription>
                    Últimos 25 viajes realizados. Usa la búsqueda para filtrar
                    por nombre de pasajero.
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
            <div className="mb-4 space-y-4 w-full max-w-5xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8">
                <DriverProfileCard
                  driver={driver}
                  completedRidesCount={
                    allRides.filter((r) => r.status === "completed").length
                  }
                />
                <PaymentPlanSelector
                  driver={driver}
                  onSave={handleSavePaymentPlan}
                  isSaving={isSavingPlan}
                />
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
