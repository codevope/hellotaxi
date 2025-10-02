'use client';

import { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  getDoc,
  DocumentReference 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useDriverRideStore } from '@/store/driver-ride-store';
import type { Ride, User, EnrichedDriver } from '@/lib/types';

// Type for active ride with enriched data
type DriverActiveRide = Omit<Ride, 'passenger' | 'driver'> & { 
  passenger: User; 
  driver: EnrichedDriver;
};

interface UseCounterOfferReturn {
  isListening: boolean;
  error: string | null;
}

export function useCounterOffer(
  driver: EnrichedDriver | null,
  activeRide: DriverActiveRide | null
): UseCounterOfferReturn {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { 
    setActiveRide, 
    setIncomingRequest, 
    setIsCountering 
  } = useDriverRideStore();

  useEffect(() => {
    if (!driver || activeRide) {
      setIsListening(false);
      return;
    }

    console.log('🎯 Starting counter-offer listener for driver:', driver.id);
    setIsListening(true);
    setError(null);

    // Listen specifically to rides where this driver made a counter-offer
    const q = query(
      collection(db, 'rides'),
      where('offeredTo', '==', doc(db, 'drivers', driver.id)),
      where('status', '==', 'accepted')
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        console.log('🔔 Counter-offer listener triggered, docs:', snapshot.docs.length);
        
        for (const rideDoc of snapshot.docs) {
          const rideData = rideDoc.data() as Ride;
          const rideId = rideDoc.id;
          
          console.log(`✅ Counter-offer accepted! Ride ${rideId} - Status: ${rideData.status}`);
          
          try {
            // Enrich the ride data
            const passengerDoc = await getDoc(rideData.passenger as DocumentReference);
            if (!passengerDoc.exists()) {
              console.error('Passenger document not found');
              continue;
            }
            
            const passengerData = passengerDoc.data() as User;
            
            const enrichedRide: DriverActiveRide = {
              ...rideData,
              id: rideId,
              passenger: passengerData,
              driver: driver
            };
            
            console.log('🎯 Setting active ride from counter-offer:', enrichedRide);
            console.log('💰 Counter-offer fare from rideData:', rideData.fare);
            console.log('💰 Counter-offer fare from enrichedRide:', enrichedRide.fare);
            
            // Set as active ride
            setActiveRide(enrichedRide);
            
            // Show success notification with proper null checking
            const fareAmount = rideData.fare ?? enrichedRide.fare ?? 0;
            console.log('💵 Final fare amount to display:', fareAmount);
            toast({
              title: '¡Contraoferta Aceptada!',
              description: `El pasajero aceptó tu contraoferta de S/${fareAmount.toFixed(2)}. El viaje comenzará pronto.`,
            });
            
            // Clear any incoming request states
            setIncomingRequest(null);
            setIsCountering(false);
            
            break; // Only process the first one
          } catch (enrichmentError) {
            console.error('Error enriching accepted counter-offer ride:', enrichmentError);
            setError('Error al procesar la aceptación de contraoferta');
          }
        }
      },
      (error) => {
        console.error('Counter-offer listener error:', error);
        setError('Error en el listener de contraoferta');
        setIsListening(false);
      }
    );

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up counter-offer listener');
      unsubscribe();
      setIsListening(false);
    };
  }, [driver, activeRide, setActiveRide, setIncomingRequest, setIsCountering, toast]);

  return {
    isListening,
    error
  };
}