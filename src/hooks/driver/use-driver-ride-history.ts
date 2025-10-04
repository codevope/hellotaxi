import { useEffect, useState, useCallback } from 'react';
import { collection, query, where, orderBy, limit, getDocs, getDoc, DocumentReference, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Ride, User, EnrichedDriver } from '@/lib/types';

export interface EnrichedHistoryRide extends Omit<Ride, 'passenger' | 'driver'> { passenger: User; driver: EnrichedDriver; }

export function useDriverRideHistory(driver?: EnrichedDriver | null, max: number = 25) {
  const [rides, setRides] = useState<EnrichedHistoryRide[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!driver) return;
    setLoading(true);
    try {
      const driverRef = doc(db, 'drivers', driver.id);
      const q = query(collection(db, 'rides'), where('driver', '==', driverRef), orderBy('date', 'desc'), limit(max));
      const snap = await getDocs(q);
      const enriched: EnrichedHistoryRide[] = [];
      for (const d of snap.docs) {
        const ride = d.data() as Ride;
        if (!(ride.passenger instanceof DocumentReference)) continue;
        const pSnap = await getDoc(ride.passenger);
        if (!pSnap.exists()) continue;
        enriched.push({ ...(ride as any), id: d.id, passenger: pSnap.data() as User, driver });
      }
      setRides(enriched);
    } finally {
      setLoading(false);
    }
  }, [driver, max]);

  useEffect(() => { load(); }, [load]);

  return { rides, loading, reload: load };
}
