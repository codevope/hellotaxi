"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  query,
  where,
  getDoc,
} from "firebase/firestore";
import type { Ride, Driver, User, ScheduledRide } from "@/lib/types";
import { Loader2, MapPin, Car, Calendar, Clock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "./ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

type EnrichedRide = Omit<Ride, "driver" | "passenger"> & {
  driver: Driver;
  passenger: User;
};

const statusConfig = {
  completed: { label: "Completado", variant: "secondary" as const },
  searching: { label: "Buscando", variant: "default" as const },
  accepted: { label: "Aceptado", variant: "default" as const },
  arrived: { label: "Ha llegado", variant: "default" as const },
  "in-progress": { label: "En Progreso", variant: "default" as const },
  cancelled: { label: "Cancelado", variant: "destructive" as const },
  "counter-offered": { label: "Contraoferta", variant: "default" as const },
};

export default function RideHistory() {
  const [rides, setRides] = useState<EnrichedRide[]>([]);
  const [scheduledRides, setScheduledRides] = useState<ScheduledRide[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function loadData() {
      setLoading(true);
      try {
        const userDocRef = doc(db, "users", user!.uid);

        // Fetch past rides
        const ridesQuery = query(
          collection(db, "rides"),
          where("passenger", "==", userDocRef)
        );
        const rideSnapshot = await getDocs(ridesQuery);
        const ridesList = rideSnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Ride)
        );

        const enrichedRidesPromises = ridesList.map(async (ride) => {
          let driver: Driver | null = null;
          if (ride.driver) {
            const driverSnap = await getDoc(ride.driver);
            if (driverSnap.exists()) {
              driver = { id: driverSnap.id, ...driverSnap.data() } as Driver;
            }
          }
          // We assume passenger is the current user, so no need to fetch again
          return driver
            ? ({ ...ride, driver, passenger: user as any } as EnrichedRide)
            : null;
        });

        const fetchedRides = (await Promise.all(enrichedRidesPromises)).filter(
          (r) => r !== null
        ) as EnrichedRide[];
        setRides(
          fetchedRides.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
        );

        // Fetch scheduled rides
        const scheduledRidesQuery = query(
          collection(db, "scheduledRides"),
          where("passenger", "==", userDocRef)
        );
        const scheduledSnapshot = await getDocs(scheduledRidesQuery);
        const fetchedScheduledRides = scheduledSnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as ScheduledRide)
        );
        setScheduledRides(
          fetchedScheduledRides.sort(
            (a, b) =>
              new Date(b.scheduledTime).getTime() -
              new Date(a.scheduledTime).getTime()
          )
        );
      } catch (error) {
        console.error("Error fetching ride history:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!rides.length && !scheduledRides.length) {
    return (
      <p className="text-muted-foreground text-center">
        No se encontraron viajes.
      </p>
    );
  }

  return (
    <ScrollArea className="h-[28rem]">
      <div className="space-y-4 pr-4">
        {rides.map((ride) => (
          <Card key={ride.id} className="shadow-none border">
            <CardHeader className="flex flex-row items-center justify-between p-3 border-b">
              <p className="text-xs text-muted-foreground">
                {format(new Date(ride.date), "dd 'de' MMM, yyyy", {
                  locale: es,
                })}
              </p>
              <Badge variant={statusConfig[ride.status].variant}>
                {statusConfig[ride.status].label}
              </Badge>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 mt-0.5 text-primary" />
                  <span className="font-medium">{ride.pickup}</span>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 mt-0.5 text-green-500" />
                  <span className="font-medium">{ride.dropoff}</span>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={ride.driver.avatarUrl}
                      alt={ride.driver.name}
                    />
                    <AvatarFallback>
                      {ride.driver.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{ride.driver.name}</p>
                    <p className="text-xs text-muted-foreground">Conductor</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">
                    S/{ride.fare.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">Tarifa Final</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
