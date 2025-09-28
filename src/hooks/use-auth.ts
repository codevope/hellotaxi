
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
  updatePassword,
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
      status: 'incomplete', // Perfil incompleto hasta que se vinculen todos los métodos
    };
    await setDoc(userRef, newUser);

    if (!user.displayName) {
        await updateProfile(user, { displayName: name });
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

            if (methods.includes('password') && auth.currentUser) {
                // Si el usuario ya está autenticado (aunque sea anónimamente), podemos intentar vincular.
                // Sin embargo, este flujo es más complejo. Por ahora, guiamos al usuario.
                throw new Error('Ya tienes una cuenta con este correo. Inicia sesión con tu contraseña para vincular Google.');
            }
        }
      console.error('Error signing in with Google', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      if (auth.currentUser && auth.currentUser.email === email) {
        const credential = EmailAuthProvider.credential(email, password);
        await linkWithCredential(auth.currentUser, credential);
        return;
      }

      await createUserWithEmailAndPassword(auth, email, password);

    } catch (error: any) {
      console.error('Error signing up with email', error);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Este correo electrónico ya está en uso. Por favor, inicia sesión o utiliza otro correo.');
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

  const setupRecaptcha = (containerId: string) => {
    return new RecaptchaVerifier(auth, containerId, {
      'size': 'invisible',
    });
  };

  const signInWithPhone = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => {
      return await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
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

  const checkAndCompleteProfile = async () => {
    if (!firebaseUser) return;
    
    const providers = firebaseUser.providerData.map(p => p.providerId);
    const hasGoogle = providers.includes('google.com');
    const hasEmail = providers.includes('password');
    const hasPhone = providers.includes('phone');

    if (hasGoogle && hasEmail && hasPhone) {
      const userRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userRef, { status: 'active' });
      if (appUser) {
        setAppUser({ ...appUser, status: 'active' });
      }
    }
  };

  const linkGoogleAccount = async () => {
    if (!firebaseUser) throw new Error('Usuario no autenticado.');
    const provider = new GoogleAuthProvider();
    try {
      await linkWithCredential(firebaseUser, await signInWithPopup(auth, provider).then(result => GoogleAuthProvider.credentialFromResult(result)!));
      await checkAndCompleteProfile();
    } catch (error: any) {
      console.error("Error linking Google Account:", error);
      throw new Error("No se pudo vincular la cuenta de Google. Puede que ya esté en uso.");
    }
  };

  const linkPhoneNumber = async (confirmationResult: any, otp: string) => {
    if (!firebaseUser) throw new Error('Usuario no autenticado.');
    const credential = PhoneAuthProvider.credential(confirmationResult.verificationId, otp);
    await linkWithCredential(firebaseUser, credential);
    await checkAndCompleteProfile();
  };

  const setPasswordForUser = async (newPassword: string) => {
    if (!firebaseUser) throw new Error('Usuario no autenticado.');
    await updatePassword(firebaseUser, newPassword);
    await checkAndCompleteProfile();
  }


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
      linkGoogleAccount,
      linkPhoneNumber,
      setPasswordForUser
    };
}
