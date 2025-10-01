
'use client';

import { useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { AuthContext } from '@/components/auth-provider';
import { doc, getDoc, onSnapshot, Unsubscribe, DocumentReference } from 'firebase/firestore';
import type { Driver, Vehicle, EnrichedDriver } from '@/lib/types';
import { useAuth as useBaseAuth } from './use-auth';

export function useDriverAuth() {
  const baseAuth = useBaseAuth();
  const { appUser } = baseAuth;
  const [driver, setDriver] = useState<EnrichedDriver | null>(null);
  const [isDriver, setIsDriver] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    const checkDriverRole = async () => {
      if (appUser && appUser.role === 'driver') {
        setIsDriver(true);
        const driverDocRef = doc(db, 'drivers', appUser.id);
        
        unsubscribe = onSnapshot(driverDocRef, async (driverSnap) => {
          if (driverSnap.exists()) {
            const driverData = { id: driverSnap.id, ...driverSnap.data() } as Driver;
            
            if(driverData.vehicle && driverData.vehicle instanceof DocumentReference) {
                const vehicleSnap = await getDoc(driverData.vehicle);
                if (vehicleSnap.exists()) {
                    const vehicleData = {id: vehicleSnap.id, ...vehicleSnap.data()} as Vehicle;
                    setDriver({ ...driverData, vehicle: vehicleData });
                }
            }
          }
          setLoading(false);
        }, (error) => {
          console.error("Error listening to driver document:", error);
          setLoading(false);
        });

      } else {
        setIsDriver(false);
        setDriver(null);
        setLoading(false);
      }
    };

    if (!baseAuth.loading) {
       checkDriverRole();
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
   
  }, [appUser, baseAuth.loading]);

  return {
    ...baseAuth,
    driver,
    setDriver,
    isDriver,
    loading: baseAuth.loading || loading,
  };
}

    