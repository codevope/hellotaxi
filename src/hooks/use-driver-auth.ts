'use client';

import { useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { AuthContext } from '@/components/auth-provider';
import { doc, getDoc } from 'firebase/firestore';
import type { Driver } from '@/lib/types';
import { useAuth as useBaseAuth } from './use-auth';

export function useDriverAuth() {
  const baseAuth = useBaseAuth();
  const { appUser } = baseAuth; // Use appUser which has the role
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isDriver, setIsDriver] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkDriverRole = async () => {
      if (appUser && appUser.role === 'driver') {
        setIsDriver(true);
        // If they are a driver, try to fetch the detailed driver profile
        const driverDocRef = doc(db, 'drivers', appUser.id);
        const driverSnap = await getDoc(driverDocRef);
        if (driverSnap.exists()) {
          setDriver({ id: driverSnap.id, ...driverSnap.data() } as Driver);
        }
      } else {
        setIsDriver(false);
        setDriver(null);
      }
      setLoading(false);
    };

    if (!baseAuth.loading) {
       checkDriverRole();
    }
   
  }, [appUser, baseAuth.loading]);

  return {
    ...baseAuth,
    driver,
    isDriver,
    loading: baseAuth.loading || loading,
  };
}
