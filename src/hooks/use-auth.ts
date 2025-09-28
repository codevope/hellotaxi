'use client';

import { useContext, useEffect } from 'react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { AuthContext } from '@/components/auth-provider';
import { doc, setDoc, getDoc, updateDoc, writeBatch } from 'firebase/firestore';
import type { UserRole, User } from '@/lib/types';

async function createOrUpdateUserProfile(user: FirebaseUser): Promise<User> {
  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    const newUser: User = {
      id: user.uid,
      name: user.displayName || 'Usuario Anónimo',
      email: user.email || '',
      avatarUrl: user.photoURL || '',
      role: 'passenger', // Default role
      signupDate: new Date().toISOString(),
      totalRides: 0,
      rating: 5.0, // Initial rating for new users
      phone: '',
      address: '',
      isAdmin: false, // Default to not admin
    };
    await setDoc(userRef, newUser);
    return newUser;
  }
  // If user exists, just return their data
  return { id: userDoc.id, ...userDoc.data() } as User;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  const { user: firebaseUser, appUser, setAppUser } = context;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await createOrUpdateUserProfile(user);
        setAppUser(profile);
      } else {
        setAppUser(null);
      }
    });

    return () => unsubscribe();
  }, [setAppUser]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google', error);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  const updateUserRole = async (newRole: UserRole) => {
    if (!firebaseUser) throw new Error('User not logged in');

    const userRef = doc(db, 'users', firebaseUser.uid);

    if (newRole === 'driver') {
      const driverRef = doc(db, 'drivers', firebaseUser.uid);
      const driverDoc = await getDoc(driverRef);
      const batch = writeBatch(db);

      // Update user role
      batch.update(userRef, { role: 'driver' });
      
      // If driver profile doesn't exist, create it.
      if (!driverDoc.exists()) {
        batch.set(driverRef, {
          name: firebaseUser.displayName,
          avatarUrl: firebaseUser.photoURL,
          rating: 0,
          vehicleBrand: 'Por Asignar',
          vehicleModel: 'Por Asignar',
          licensePlate: 'AAA-000',
          status: 'unavailable',
          documentsStatus: 'pending', 
          kycVerified: false,
          licenseExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
          insuranceExpiry: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString(),
          technicalReviewExpiry: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString(),
          backgroundCheckExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
          paymentModel: 'commission',
          membershipStatus: 'active',
          serviceType: 'economy',
          documentStatus: {
            license: 'pending',
            insurance: 'pending',
            technicalReview: 'pending',
            backgroundCheck: 'pending'
          }
        });
      }
      await batch.commit();

    } else if (newRole === 'passenger') {
      await updateDoc(userRef, { role: 'passenger' });
    }
    // Re-fetch user profile to update context
    if(appUser){
        setAppUser({...appUser, role: newRole});
    }
  };


  return { ...context, user: firebaseUser, signInWithGoogle, signOut, updateUserRole };
}
