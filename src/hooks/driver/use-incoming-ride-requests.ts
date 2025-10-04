import { useEffect, useState, useCallback } from 'react';
import { doc, collection, query, where, onSnapshot, runTransaction, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Ride, User, EnrichedDriver } from '@/lib/types';
import { useDriverRideStore } from '@/store/driver-ride-store';
import { useToast } from '@/hooks/use-toast';

interface IncomingRide extends Omit<Ride, 'passenger'> { passenger: User }

interface UseIncomingRideRequestsParams {
  driver?: EnrichedDriver | null;
  isAvailable: boolean;
  rejectedRideIds: string[];
  setRejectedRideIds: React.Dispatch<React.SetStateAction<string[]>>;
}

export function useIncomingRideRequests({ driver, isAvailable, rejectedRideIds, setRejectedRideIds }: UseIncomingRideRequestsParams) {
  const { incomingRequest, activeRide, setIncomingRequest, isCountering, setIsCountering } = useDriverRideStore();
  const [requestTimeLeft, setRequestTimeLeft] = useState(30);
  const [counterOfferAmount, setCounterOfferAmount] = useState(0);
  const { toast } = useToast();

  // Listener de viajes buscando (searching)
  useEffect(() => {
    if (!driver || !isAvailable || activeRide || incomingRequest) return;

    const q = query(collection(db, 'rides'), where('status', '==', 'searching'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (useDriverRideStore.getState().activeRide || useDriverRideStore.getState().incomingRequest) return;
      const potential = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as Ride))
        .filter(ride => {
          const alreadyOffered = !!ride.offeredTo;
          const alreadyRejected = rejectedRideIds.includes(ride.id) || ride.rejectedBy?.some(ref => ref.id === driver.id);
          return !alreadyOffered && !alreadyRejected;
        });
      if (potential.length === 0) return;
      const rideToOffer = potential[0];
      const rideRef = doc(db, 'rides', rideToOffer.id);
      try {
        await runTransaction(db, async tx => {
          const fresh = await tx.get(rideRef);
          if (!fresh.exists() || fresh.data().status !== 'searching' || fresh.data().offeredTo) {
            throw new Error('Ride taken or cancelled');
          }
          tx.update(rideRef, { offeredTo: doc(db, 'drivers', driver.id) });
        });
        const passengerSnap = await getDoc(rideToOffer.passenger);
        if (passengerSnap.exists()) {
          const passengerData = passengerSnap.data() as User;
          const { passenger: _p, ...rest } = rideToOffer;
          setIncomingRequest({ ...rest, passenger: passengerData });
        }
      } catch (e) {
        console.log('Could not secure ride offer:', (e as Error).message);
      }
    });
    return () => unsubscribe();
  }, [driver, isAvailable, activeRide, incomingRequest, rejectedRideIds, setIncomingRequest]);

  // Countdown / auto reject
  useEffect(() => {
    if (!incomingRequest) { setRequestTimeLeft(30); return; }
    setRequestTimeLeft(30);
    const timer = setInterval(() => {
      setRequestTimeLeft(prev => {
        if (prev <= 1) {
          const current = useDriverRideStore.getState().incomingRequest;
          if (current && driver) {
            const rideRef = doc(db, 'rides', current.id);
            setIncomingRequest(null);
            setRejectedRideIds(prevIds => [...prevIds, current.id]);
            updateDoc(rideRef, { rejectedBy: arrayUnion(doc(db, 'drivers', driver.id)), offeredTo: null }).catch(err => console.error('Auto-reject error', err));
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [incomingRequest, driver, setIncomingRequest, setRejectedRideIds]);

  const acceptRequest = useCallback(async () => {
    if (!incomingRequest || !driver) return;
    const rideRef = doc(db, 'rides', incomingRequest.id);
    setIncomingRequest(null);
    try {
      await runTransaction(db, async tx => {
        const snap = await tx.get(rideRef);
        if (!snap.exists() || !['searching','counter-offered'].includes(snap.data().status)) throw new Error('El viaje ya no está disponible.');
        tx.update(rideRef, { status: 'accepted', driver: doc(db, 'drivers', driver.id), offeredTo: null });
        tx.update(doc(db, 'drivers', driver.id), { status: 'on-ride' });
      });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message || 'No se pudo aceptar el viaje.' });
    }
  }, [incomingRequest, driver, setIncomingRequest, toast]);

  const rejectRequest = useCallback(async () => {
    if (!incomingRequest || !driver) return;
    const rideRef = doc(db, 'rides', incomingRequest.id);
    setIncomingRequest(null);
    setRejectedRideIds(prev => [...prev, incomingRequest.id]);
    await updateDoc(rideRef, { rejectedBy: arrayUnion(doc(db, 'drivers', driver.id)), offeredTo: null });
  }, [incomingRequest, driver, setIncomingRequest, setRejectedRideIds]);

  const submitCounterOffer = useCallback(async () => {
    if (!incomingRequest || !counterOfferAmount || !driver) return;
    const rideRef = doc(db, 'rides', incomingRequest.id);
    try {
      await updateDoc(rideRef, { fare: counterOfferAmount, status: 'counter-offered', offeredTo: doc(db, 'drivers', driver.id) });
      toast({ title: 'Contraoferta Enviada', description: `Has propuesto una tarifa de S/${counterOfferAmount.toFixed(2)}` });
      setIncomingRequest(null);
      setIsCountering(false);
    } catch (e) {
      console.error('Error submitting counter offer:', e);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo enviar la contraoferta.' });
    }
  }, [incomingRequest, counterOfferAmount, driver, toast, setIncomingRequest, setIsCountering]);

  const startCounterMode = useCallback(() => {
    if (!incomingRequest) return;
    setCounterOfferAmount(incomingRequest.fare);
    setIsCountering(true);
  }, [incomingRequest, setIsCountering]);

  return {
    incomingRequest,
    requestTimeLeft,
    isCountering,
    counterOfferAmount,
    setCounterOfferAmount,
    acceptRequest,
    rejectRequest,
    submitCounterOffer,
    startCounterMode,
  };
}
