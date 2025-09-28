
'use client';

import { useContext, useEffect } from 'react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { AuthContext } from '@/components/auth-provider';
import { doc, setDoc, getDoc, updateDoc, writeBatch } from 'firebase/firestore';
import type { UserRole, User } from '@/lib/types';

async function createOrUpdateUserProfile(user: FirebaseUser): Promise<User> {
  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    const name = user.displayName || user.email?.split('@')[0] || 'Usuario Anónimo';
    const newUser: User = {
      id: user.uid,
      name: name,
      email: user.email || '',
      avatarUrl: user.photoURL || '/img/avatar.png',
      role: 'passenger', // Default role
      signupDate: new Date().toISOString(),
      totalRides: 0,
      rating: 5.0, // Initial rating for new users
      phone: user.phoneNumber || '',
      address: '',
      isAdmin: false, // Default to not admin
    };
    await setDoc(userRef, newUser);

    // Update Firebase Auth profile if display name is missing
    if (!user.displayName) {
        await updateProfile(user, { displayName: name });
    }

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
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
        await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
        console.error('Error signing up with email', error);
         if (error.code === 'auth/email-already-in-use') {
            throw new Error('Este correo electrónico ya está en uso. Por favor, intenta iniciar sesión o utiliza otro correo.');
        }
        throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error('Error signing in with email', error);
        throw error;
    }
  };

  const signInWithPhone = async (phoneNumber: string) => {
    try {
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
      });
      return await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    } catch (error) {
      console.error('Error signing in with phone', error);
      throw error;
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


  return { 
      ...context, 
      user: firebaseUser, 
      signInWithGoogle, 
      signOut, 
      updateUserRole,
      signInWithEmail,
      signUpWithEmail,
      signInWithPhone
    };
}
