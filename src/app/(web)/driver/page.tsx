
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
type DriverActiveRide = Omit<Ride, 'passenger' | 'driver'> & { passenger: User; driver: EnrichedDriver };
import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  writeBatch,
  onSnapshot,
  Unsubscribe,
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
import { useRouteSimulator } from "@/hooks/use-route-simulator";
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

type EnrichedRide = Omit<Ride, "passenger" | "driver"> & {
  passenger: User;
  driver: EnrichedDriver;
};

const getMembershipStatus = (
  expiryDate?: string
): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} => {
  if (!expiryDate) return { label: "N/A", variant: "secondary" };

  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return { label: "Vencida", variant: "destructive" };
  if (diffDays <= 7) return { label: "Por Vencer", variant: "outline" };
  return { label: "Activa", variant: "default" };
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

  const {
    startSimulation,
    stopSimulation,
    simulatedLocation: driverLocation,
  } = useRouteSimulator();
  const [isDriverChatOpen, setIsDriverChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [rejectedRideIds, setRejectedRideIds] = useState<string[]>([]);
  const [counterOfferAmount, setCounterOfferAmount] = useState(0);

  // Counter-offer hook
  const { isListening: isCounterOfferListening, error: counterOfferError } = useCounterOffer(driver, activeRide);

  // Local state for payment model selection
  const [selectedPaymentModel, setSelectedPaymentModel] = useState<
    PaymentModel | undefined
  >(driver?.paymentModel);

  useEffect(() => {
    if (driver) {
      setSelectedPaymentModel(driver.paymentModel);
    }
  }, [driver]);

  // Sync driver availability status with local state
  useEffect(() => {
    if (driver) {
      const isDriverAvailable = driver.status === "available";
      setAvailability(isDriverAvailable);
    }
  }, [driver, setAvailability]);

  // MASTER useEffect for driver's active ride
  useEffect(() => {
    if (!driver) return;
    const driverRef = doc(db, "drivers", driver.id);

    // Listen to both: rides assigned to this driver AND rides offered to this driver that are accepted
    const q1 = query(
      collection(db, "rides"),
      where("driver", "==", driverRef),
      where("status", "in", ["accepted", "arrived", "in-progress", "completed"])
    );

    const unsubscribe1 = onSnapshot(q1, async (snapshot) => {
      if (!snapshot.empty) {
        const rideDoc = snapshot.docs.find(
          (doc) => doc.data().status !== "completed"
        ); // Find the non-completed ride
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
              const passengerSnap = await getDoc(rideData.passenger);
              if (passengerSnap.exists() && driver) {
                setCompletedRideForRating({
                  ...rideData,
                  driver,
                  passenger: passengerSnap.data() as User,
                });
              }
            }
            stopSimulation();
            setActiveRide(null);
          }
          return;
        }

        const rideData = { id: rideDoc.id, ...rideDoc.data() } as Ride;

        if (rideData.passenger && driver) {
          const passengerSnap = await getDoc(rideData.passenger);
          if (passengerSnap.exists()) {
            const passengerData = passengerSnap.data() as User;
            // Create a driver-specific ride object without the DocumentReference fields
            const {
              driver: driverRef,
              passenger: passengerRef,
              ...rideDataWithoutRefs
            } = rideData;
            const rideWithPassenger = {
              ...rideDataWithoutRefs,
              driver,
              passenger: passengerData,
            };
            setActiveRide(rideWithPassenger);

            const pickup = {
              lat: -12.05,
              lng: -77.05,
              address: rideData.pickup,
            };
            const dropoff = {
              lat: -12.1,
              lng: -77.0,
              address: rideData.dropoff,
            };

            if (
              rideData.status === "accepted" ||
              rideData.status === "arrived"
            ) {
              const driverInitialPos = driver.location || {
                lat: -12.045,
                lng: -77.03,
              };
              startSimulation(driverInitialPos, pickup);
            } else if (rideData.status === "in-progress") {
              startSimulation(pickup, dropoff);
            }
          }
        }
      } else {
        if (useDriverRideStore.getState().activeRide !== null) {
          stopSimulation();
          setActiveRide(null);
        }
      }
    });

    return () => {
      unsubscribe1();
    };
  }, [driver, setActiveRide, startSimulation, stopSimulation]);

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
        return; // Don't process new requests if already busy
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
        // Attempt to "claim" this ride offer
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

        // If transaction succeeds, show the request to this driver
        const passengerSnap = await getDoc(rideToOffer.passenger);
        if (passengerSnap.exists()) {
          const passengerData = passengerSnap.data() as User;
          // Create IncomingRequest without the passenger DocumentReference
          const { passenger: passengerRef, ...rideWithoutPassengerRef } =
            rideToOffer;
          setIncomingRequest({
            ...rideWithoutPassengerRef,
            passenger: passengerData,
          });
        }
      } catch (error) {
        // This error is expected if another driver was faster. We just log it and do nothing.
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
  }, [activeRide, setChatMessages]);

  // Listener for counter-offer status changes
  useEffect(() => {
    if (!driver) return;

    // Listen to ALL rides where this driver made a counter-offer
    const q = query(
      collection(db, "rides"),
      where("offeredTo", "==", doc(db, "drivers", driver.id))
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === "modified") {
          const rideData = change.doc.data() as Ride;
          const rideId = change.doc.id;
          
          console.log(` Ride ${rideId} modified, new status: ${rideData.status}`);
          
          // If a counter-offered ride was accepted
          if (rideData.status === 'accepted' && !activeRide) {
            console.log(`✅ Counter-offer accepted! Ride ${rideId} is now accepted`);
            
            // Enrich the ride data like the main listener does
            try {
              const passengerDoc = await getDoc(rideData.passenger);
              const passengerData = passengerDoc.data() as User;
              
              const enrichedRide: DriverActiveRide = {
                ...rideData,
                id: rideId,
                passenger: passengerData,
                driver: driver
              };
              
              setActiveRide(enrichedRide);
              
              toast({
                title: "¡Contraoferta Aceptada!",
                description: `El pasajero aceptó tu contraoferta de S/${rideData.fare.toFixed(2)}. El viaje comenzará pronto.`,
              });
              
              // Clear any incoming request since we now have an active ride
              setIncomingRequest(null);
              setIsCountering(false);
            } catch (error) {
              console.error('Error enriching accepted counter-offer ride:', error);
            }
          }
        }
      });
    });

  }, [driver, activeRide, setIncomingRequest, setIsCountering, toast]);

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
          limit(20) // Load last 20 rides
        );
  
        const querySnapshot = await getDocs(q);
        const ridesWithPassengersPromises = querySnapshot.docs.map(async (rideDoc) => {
          const rideData = rideDoc.data() as Ride;
          
          if (!(rideData.passenger instanceof DocumentReference)) {
            console.warn(`Ride ${rideDoc.id} has an invalid passenger reference.`);
            return null;
          }

          const passengerDoc = await getDoc(rideData.passenger);
          if (!passengerDoc.exists()) {
             console.warn(`Passenger for ride ${rideDoc.id} not found.`);
             return null;
          }
          
          const passengerData = passengerDoc.data() as User;
          
          return {
            ...rideData,
            id: rideDoc.id,
            passenger: passengerData,
            driver: driver
          } as EnrichedRide;
        });

        const ridesWithPassengers = (await Promise.all(ridesWithPassengersPromises)).filter(Boolean) as EnrichedRide[];
  
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

  const handleRideRequestResponse = async (accepted: boolean) => {
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
            offeredTo: null,
          });
          transaction.update(doc(db, "drivers", driver.id), {
            status: "on-ride",
          });
        });

        setAvailability(false);
      } catch (e: any) {
        console.error("Error accepting ride:", e);
        toast({
          variant: "destructive",
          title: "Error",
          description: e.message || "No se pudo aceptar el viaje.",
        });
      }
    } else {
      // Driver rejected, add them to the rejectedBy list and free up the offer
      setRejectedRideIds((prev) => [...prev, rideId]);
      await updateDoc(rideRef, {
        rejectedBy: arrayUnion(doc(db, "drivers", driver.id)),
        offeredTo: null,
      });
    }
  };

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
      console.error("Error submitting counter offer:", e);
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

        stopSimulation();
        setAvailability(true);
      } else {
        await updateDoc(rideRef, { status: newStatus });
      }
    } catch (error) {
      console.error("Error updating ride status:", error);
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

  const handleSavePaymentPlan = async () => {
    if (
      !driver ||
      !selectedPaymentModel ||
      selectedPaymentModel === driver.paymentModel
    )
      return;
    setIsSavingPlan(true);

    const driverRef = doc(db, "drivers", driver.id);
    const updates: {
      paymentModel: PaymentModel;
      membershipExpiryDate?: string;
    } = {
      paymentModel: selectedPaymentModel,
    };

    if (
      selectedPaymentModel === "membership" &&
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
          selectedPaymentModel === "membership" ? "Membresía" : "Comisión"
        }.`,
      });
    } catch (error) {
      console.error("Error updating payment model:", error);
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
  const membershipStatus = getMembershipStatus(driver.membershipExpiryDate);

  const renderDashboardContent = () => {
    if (incomingRequest) {
      return (
        <Dialog
          open={!!incomingRequest}
          onOpenChange={(open) => {
            if (!open && !isCountering) handleRideRequestResponse(false);
          }}
        >
          <DialogContent className="max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-blue-800">
                ¡Nueva Solicitud de Viaje!
              </DialogTitle>
              <CardDescription className="text-gray-600">
                Tienes 30 segundos para responder.
              </CardDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium text-gray-800">Desde:</span>{" "}
                      {incomingRequest.pickup}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium text-gray-800">Hacia:</span>{" "}
                      {incomingRequest.dropoff}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-blue-200">
                    <p className="text-center">
                      <span className="text-sm text-gray-600">Tarifa propuesta:</span>
                      <span className="block text-2xl font-bold text-blue-800">
                        S/{incomingRequest.fare.toFixed(2)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              
              {isCountering ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                    <Label htmlFor="counter-offer" className="text-sm font-medium text-gray-700">
                      Tu contraoferta (S/)
                    </Label>
                    <Input
                      id="counter-offer"
                      type="number"
                      step="0.10"
                      min="0"
                      value={counterOfferAmount}
                      onChange={(e) =>
                        setCounterOfferAmount(Number(e.target.value))
                      }
                      className="mt-2 text-lg font-semibold text-center"
                    />
                  </div>
                  <div className="space-y-3">
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3" 
                      onClick={handleCounterOffer}
                    >
                      Enviar Contraoferta
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => setIsCountering(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Button
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-3"
                    onClick={() => handleRideRequestResponse(true)}
                  >
                    Aceptar Viaje
                  </Button>
                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3"
                    onClick={() => {
                      setCounterOfferAmount(incomingRequest.fare);
                      setIsCountering(true);
                    }}
                  >
                    Hacer Contraoferta
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleRideRequestResponse(false)}
                  >
                    Rechazar
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      );
    }
    if (activeRide) {
      return (
        <Card className="border-primary border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Car className="h-6 w-6" />
              <span>Viaje Activo</span>
            </CardTitle>
            <CardDescription>
              {activeRide.status === "accepted" &&
                "Dirígete al punto de recojo del pasajero."}
              {activeRide.status === "arrived" && "Esperando al pasajero."}
              {activeRide.status === "in-progress" &&
                "Llevando al pasajero a su destino."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={activeRide.passenger.avatarUrl}
                    alt={activeRide.passenger.name}
                  />
                  <AvatarFallback>
                    {activeRide.passenger.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{activeRide.passenger.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Destino:{" "}
                    <span className="font-medium truncate">
                      {activeRide.dropoff}
                    </span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Tarifa</p>
                <p className="font-bold text-lg">
                  S/{activeRide.fare.toFixed(2)}
                </p>
              </div>
            </div>
            {activeRide.status === "accepted" && (
              <Button
                className="w-full"
                onClick={() => handleUpdateRideStatus("arrived")}
                disabled={isCompletingRide}
              >
                He Llegado
              </Button>
            )}
            {activeRide.status === "arrived" && (
              <Button
                className="w-full"
                onClick={() => handleUpdateRideStatus("in-progress")}
                disabled={isCompletingRide}
              >
                Iniciar Viaje
              </Button>
            )}
            {activeRide.status === "in-progress" && (
              <Button
                className="w-full"
                onClick={() => handleUpdateRideStatus("completed")}
                disabled={isCompletingRide}
              >
                Finalizar Viaje
              </Button>
            )}
          </CardContent>
        </Card>
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
      <AppHeader />
      <main className="flex-1 p-4 lg:p-8">
        <Tabs defaultValue="dashboard">
          <TabsList className="grid w-full grid-cols-5 max-w-2xl mx-auto">
            <TabsTrigger value="dashboard">
              <UserCog className="mr-2 h-4 w-4" />
              Panel
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="mr-2 h-4 w-4" />
              Documentos
            </TabsTrigger>
            <TabsTrigger value="vehicle">
              <Car className="mr-2 h-4 w-4" />
              Mi Vehículo
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="mr-2 h-4 w-4" />
              Historial
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
                  pickupLocation={
                    activeRide?.pickupLocation
                      ? activeRide.pickupLocation
                      : null
                  }
                  dropoffLocation={
                    activeRide?.dropoffLocation
                      ? activeRide.dropoffLocation
                      : null
                  }
                  interactive={false}
                />
                {activeRide && (
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
                        <Button
                          size="icon"
                          className="absolute bottom-4 left-4 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
                        >
                          <MessageCircle className="h-7 w-7" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="w-full max-w-sm p-0">
                        <SheetHeader className="p-4 border-b text-left">
                          <SheetTitle className="flex items-center gap-2">
                            <MessageCircle className="h-5 w-5" />
                            <span>Chat con {activeRide?.passenger.name}</span>
                          </SheetTitle>
                        </SheetHeader>
                        <Chat
                          messages={chatMessages}
                          onSendMessage={handleSendMessage}
                        />
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
            <div className="mb-4 space-x-4 w-full max-w-5xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Viajes</CardTitle>
                  <CardDescription>
                    Aquí puedes ver todos los viajes que has realizado.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pasajero</TableHead>
                        <TableHead>Ruta</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Tarifa</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allRides.map((ride) => (
                        <TableRow key={ride.id}>
                          <TableCell>{ride.passenger.name}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {ride.pickup} &rarr; {ride.dropoff}
                          </TableCell>
                          <TableCell>
                            {format(new Date(ride.date), "dd/MM/yy HH:mm", {
                              locale: es,
                            })}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            S/{ride.fare.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                rideStatusConfig[ride.status]?.variant ||
                                "secondary"
                              }
                            >
                              {rideStatusConfig[ride.status]?.label ||
                                ride.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
                    <Button
                      onClick={handleSavePaymentPlan}
                      disabled={
                        isSavingPlan ||
                        selectedPaymentModel === driver.paymentModel
                      }
                    >
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

    