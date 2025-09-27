"use client";

import React, { createContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";
import type { User as AppUser } from "@/lib/types";
import { doc, getDoc } from "firebase/firestore";

interface AuthContextType {
  user: FirebaseUser | null;
  appUser: AppUser | null;
  setAppUser: React.Dispatch<React.SetStateAction<AppUser | null>>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  appUser: null,
  setAppUser: () => {},
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          setAppUser({ id: userSnap.id, ...userSnap.data() } as AppUser);
        }
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, appUser, setAppUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
