import { useEffect, useState, useCallback } from 'react';
import { doc, collection, where, query, onSnapshot, getDoc, updateDoc, writeBatch, increment, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useDriverRideStore } from '@/store/driver-ride-store';
import type { Ride, User, EnrichedDriver } from '@/lib/types';
import { useRouteSimulator } from '@/hooks/use-route-simulator';
import { useToast } from '@/hooks/use-toast';

export interface EnrichedRide extends Omit<Ride, 'passenger' | 'driver'> {
  passenger: User;
  driver: EnrichedDriver;
}

interface UseDriverActiveRideParams {
  driver?: EnrichedDriver | null;
  setAvailability: (v: boolean) => void;
}

export function useDriverActiveRide({ driver, setAvailability }: UseDriverActiveRideParams) {
  const { activeRide, setActiveRide } = useDriverRideStore();
  const [completedRideForRating, setCompletedRideForRating] = useState<EnrichedRide | null>(null);
  const [isCompletingRide, setIsCompletingRide] = useState(false);
  const { startSimulation, stopSimulation, simulatedLocation } = useRouteSimulator();
  const { toast } = useToast();

  // Listener principal para viajes activos
  useEffect(() => {
    if (!driver) return;
    const driverRef = doc(db, 'drivers', driver.id);

    const q = query(collection(db, 'rides'), where('driver', '==', driverRef), where('status', 'in', ['accepted','arrived','in-progress','completed']));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (!snapshot.empty) {
        const rideDoc = snapshot.docs.find(d => d.data().status !== 'completed');
        if (!rideDoc) {
          // Verificar si el viaje completado corresponde al activo anterior para iniciar rating
          if (useDriverRideStore.getState().activeRide !== null) {
            const completedRideDoc = snapshot.docs.find(d => d.data().status === 'completed' && d.id === useDriverRideStore.getState().activeRide?.id);
            if (completedRideDoc) {
              const rideData = { id: completedRideDoc.id, ...completedRideDoc.data() } as Ride;
              const passengerSnap = await getDoc(rideData.passenger);
              if (passengerSnap.exists() && driver) {
                setCompletedRideForRating({
                  ...(rideData as any),
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
            const { driver: _driverRef, passenger: _passengerRef, ...rest } = rideData as any;
            const enriched: EnrichedRide = { ...rest, driver, passenger: passengerData };
            setActiveRide(enriched);

            const pickup = { lat: -12.05, lng: -77.05, address: rideData.pickup };
            const dropoff = { lat: -12.1, lng: -77.0, address: rideData.dropoff };

            if (rideData.status === 'accepted' || rideData.status === 'arrived') {
              const driverInitialPos = driver.location || { lat: -12.045, lng: -77.03 };
              startSimulation(driverInitialPos, pickup);
            } else if (rideData.status === 'in-progress') {
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

    return () => unsubscribe();
  }, [driver, setActiveRide, startSimulation, stopSimulation]);

  const updateRideStatus = useCallback(async (ride: EnrichedRide, newStatus: 'arrived' | 'in-progress' | 'completed') => {
    setIsCompletingRide(true);
    try {
      const rideRef = doc(db, 'rides', ride.id);
      const driverRef = doc(db, 'drivers', ride.driver.id);
      if (newStatus === 'completed') {
        const batch = writeBatch(db);
        batch.update(rideRef, { status: 'completed' });
        batch.update(driverRef, { status: 'available' });
        batch.update(doc(db, 'users', ride.passenger.id), { totalRides: increment(1) });
        await batch.commit();
        toast({ title: '¡Viaje Finalizado!', description: 'Ahora califica al pasajero.' });
        stopSimulation();
        setAvailability(true);
      } else {
        await updateDoc(rideRef, { status: newStatus });
      }
    } catch (e) {
      console.error('Error updating ride status:', e);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el estado del viaje.' });
    } finally {
      setIsCompletingRide(false);
    }
  }, [toast, stopSimulation, setAvailability]);

  return {
    activeRide,
    completedRideForRating,
    setCompletedRideForRating,
    updateRideStatus,
    isCompletingRide,
    driverLocation: simulatedLocation,
  };
}
