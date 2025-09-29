
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
import { doc, setDoc, getDoc, updateDoc, writeBatch, collection } from 'firebase/firestore';
import type { UserRole, User, Vehicle } from '@/lib/types';
import { vehicles } from '@/lib/seed-data';

async function createOrUpdateUserProfile(user: FirebaseUser): Promise<User> {
  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);

  const providerIds = user.providerData.map((p) => p.providerId);
  const hasPassword = providerIds.includes('password');
  const hasGoogle = providerIds.includes('google.com');
  const hasPhone = providerIds.includes('phone');

  // If the user has all 3, they are active. Otherwise, incomplete.
  const status = hasPassword && hasGoogle && hasPhone ? 'active' : 'incomplete';


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
      status: status, 
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
  
  const existingUser = { id: userDoc.id, ...userDoc.data() } as User;
  if (existingUser.status !== status) {
    await updateDoc(userRef, { status: status });
    return { ...existingUser, status: status };
  }
  
  return existingUser;
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

  const setupRecaptcha = (containerId: string): RecaptchaVerifier => {
    return new RecaptchaVerifier(auth, containerId, {
      'size': 'invisible',
      'callback': (response: any) => {
        console.log("reCAPTCHA solved");
      },
      'expired-callback': () => {
        console.log("reCAPTCHA expired");
      }
    });
  };

  const signInWithPhone = async (phoneNumber: string, verifier: RecaptchaVerifier): Promise<ConfirmationResult> => {
      console.log("Calling signInWithPhoneNumber");
      return await signInWithPhoneNumber(auth, phoneNumber, verifier);
  };
  
  const linkGoogleAccount = async () => {
    if (!auth.currentUser) throw new Error("No hay un usuario autenticado.");
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await checkAndCompleteProfile(auth.currentUser.uid);
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
  
  const checkAndCompleteProfile = async (userId: string) => {
    if (!auth.currentUser) return;
    const user = auth.currentUser;
    const providerIds = user.providerData.map((p) => p.providerId);
    const hasPassword = providerIds.includes('password');
    const hasGoogle = providerIds.includes('google.com');
    const hasPhone = providerIds.includes('phone');

    if (hasPassword && hasGoogle && hasPhone) {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { status: 'active' });
        const userSnap = await getDoc(userRef);
        if(userSnap.exists()){
            setAppUser({ id: userSnap.id, ...userSnap.data() } as User);
        }
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
      const vehicleRef = doc(collection(db, 'vehicles')); // Create ref for new vehicle
      const driverDoc = await getDoc(driverRef);
      const batch = writeBatch(db);

      batch.update(userRef, { role: 'driver' });
      
      if (!driverDoc.exists()) {
        const newVehicle: Vehicle = {
            id: vehicleRef.id,
            brand: 'Por Asignar',
            model: 'Por Asignar',
            licensePlate: 'AAA-000',
            serviceType: 'economy',
            year: new Date().getFullYear(),
            color: 'Blanco',
            driverId: firebaseUser.uid,
        };
        batch.set(vehicleRef, newVehicle);

        batch.set(driverRef, {
          id: firebaseUser.uid,
          name: firebaseUser.displayName,
          avatarUrl: firebaseUser.photoURL || '/img/avatar.png',
          rating: 0,
          status: 'unavailable',
          documentsStatus: 'pending', 
          kycVerified: false,
          licenseExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
          insuranceExpiry: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString(),
          technicalReviewExpiry: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString(),
          backgroundCheckExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
          paymentModel: 'commission',
          membershipStatus: 'active',
          documentStatus: {
            license: 'pending',
            insurance: 'pending',
            technicalReview: 'pending',
            backgroundCheck: 'pending'
          },
          vehicle: vehicleRef, // Link to the new vehicle
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
      checkAndCompleteProfile,
    };
}
