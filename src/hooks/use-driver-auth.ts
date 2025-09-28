
'use client';

import { useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { AuthContext } from '@/components/auth-provider';
import { doc, getDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import type { Driver } from '@/lib/types';
import { useAuth as useBaseAuth } from './use-auth';

export function useDriverAuth() {
  const baseAuth = useBaseAuth();
  const { appUser } = baseAuth; // Use appUser which has the role
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isDriver, setIsDriver] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    const checkDriverRole = async () => {
      if (appUser && appUser.role === 'driver') {
        setIsDriver(true);
        const driverDocRef = doc(db, 'drivers', appUser.id);
        
        // Listen for real-time updates to the driver's profile
        unsubscribe = onSnapshot(driverDocRef, (driverSnap) => {
          if (driverSnap.exists()) {
            setDriver({ id: driverSnap.id, ...driverSnap.data() } as Driver);
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
    setDriver, // Expose setDriver to allow manual updates from components
    isDriver,
    loading: baseAuth.loading || loading,
  };
}
