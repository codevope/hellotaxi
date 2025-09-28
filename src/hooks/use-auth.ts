
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
  fetchSignInMethodsForEmail,
  linkWithCredential,
  EmailAuthProvider,
  PhoneAuthProvider,
  ConfirmationResult,
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
      role: 'passenger',
      signupDate: new Date().toISOString(),
      totalRides: 0,
      rating: 5.0,
      phone: user.phoneNumber || '',
      address: '',
      isAdmin: false,
      status: 'active', // All users start as active
    };
    await setDoc(userRef, newUser);

    if (!user.displayName || !user.photoURL) {
        await updateProfile(user, { 
            displayName: name,
            photoURL: user.photoURL || '/img/avatar.png' 
        });
    }

    return newUser;
  }
  
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
    } catch (error: any) {
        if (error.code === 'auth/account-exists-with-different-credential' && error.customData.email) {
            const email = error.customData.email;
            const credential = GoogleAuthProvider.credentialFromError(error);
            const methods = await fetchSignInMethodsForEmail(auth, email);

            if (methods.includes('password')) {
               const password = prompt('Parece que ya tienes una cuenta con este correo. Por favor, introduce tu contraseña para vincular tu cuenta de Google.');
                if (password) {
                    try {
                        const userCredential = await signInWithEmailAndPassword(auth, email, password);
                        await linkWithCredential(userCredential.user, credential!);
                        return;
                    } catch (e) {
                         throw new Error('La contraseña es incorrecta. No se pudo vincular la cuenta.');
                    }
                } else {
                    throw new Error('Se requiere contraseña para vincular cuentas.');
                }
            }
        }
      console.error('Error signing in with Google', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
        const methods = await fetchSignInMethodsForEmail(auth, email);
        if (methods.length > 0) {
             throw new Error('Este correo electrónico ya está en uso. Por favor, inicia sesión o utiliza otro correo.');
        }
        await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
        console.error('Error signing up with email', error);
        throw error;
    }
  };


  const setPasswordForUser = async (password: string) => {
    if (!auth.currentUser) throw new Error("No hay un usuario autenticado.");
    const credential = EmailAuthProvider.credential(auth.currentUser.email!, password);
    try {
        await linkWithCredential(auth.currentUser, credential);
    } catch (error: any) {
        console.error("Error setting password", error);
        if (error.code === 'auth/credential-already-in-use') {
            throw new Error("Esta cuenta ya tiene una contraseña o está vinculada a otro usuario.");
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

  const setupRecaptcha = (containerId: string, callback: () => void) => {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
    }
    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'normal',
      callback: (response) => {
        console.log('reCAPTCHA solved');
        callback();
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired');
      },
    });
    window.recaptchaVerifier.render();
  };

  const signInWithPhone = async (phoneNumber: string): Promise<ConfirmationResult> => {
      const verifier = window.recaptchaVerifier;
      if (!verifier) {
          throw new Error('Recaptcha verifier not initialized.');
      }
      console.log("Calling signInWithPhoneNumber");
      return await signInWithPhoneNumber(auth, phoneNumber, verifier);
  };
  
  const linkGoogleAccount = async () => {
    if (!auth.currentUser) throw new Error("No hay un usuario autenticado.");
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      console.log("Google account linked!", result.user);
    } catch (error: any) {
      console.error("Error linking Google account", error);
      if (error.code === 'auth/credential-already-in-use') {
        throw new Error("Esta cuenta de Google ya está vinculada a otro usuario.");
      }
      throw error;
    }
  };

  const linkPhoneNumber = async (phoneNumber: string, confirmationResult: ConfirmationResult, otp: string) => {
    if (!auth.currentUser) throw new Error("No hay un usuario autenticado.");
    const credential = PhoneAuthProvider.credential(confirmationResult.verificationId, otp);
    await linkWithCredential(auth.currentUser, credential);
    
    const userRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(userRef, { phone: phoneNumber });
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

      batch.update(userRef, { role: 'driver' });
      
      if (!driverDoc.exists()) {
        batch.set(driverRef, {
          name: firebaseUser.displayName,
          avatarUrl: firebaseUser.photoURL || '/img/avatar.png',
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
      signInWithPhone,
      setupRecaptcha,
      setPasswordForUser,
      linkGoogleAccount,
      linkPhoneNumber,
    };
}

declare global {
    interface Window {
        recaptchaVerifier?: RecaptchaVerifier;
    }
}

    
