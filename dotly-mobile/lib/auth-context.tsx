import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

type AuthContextType = {
  user: User | null;
  profile: any | null;
  role: 'donor' | 'association' | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  profile: null,
  role: null,
  isLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [role, setRole] = useState<'donor' | 'association' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleSignOut = async () => {
    await auth.signOut();
  };

  const refreshProfile = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    
    try {
      const assoSnap = await getDoc(doc(db, 'associations', currentUser.uid));
      if (assoSnap.exists()) {
        setProfile(assoSnap.data());
        setRole('association');
      } else {
        const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
        if (userSnap.exists()) {
          setProfile(userSnap.data());
          setRole('donor');
        } else {
          setProfile(null);
          setRole(null);
        }
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Try to find profile in associations first
        try {
          const assoSnap = await getDoc(doc(db, 'associations', firebaseUser.uid));
          if (assoSnap.exists()) {
            setProfile(assoSnap.data());
            setRole('association');
          } else {
            // Try users collection
            const userSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userSnap.exists()) {
              setProfile(userSnap.data());
              setRole('donor');
            } else {
              setProfile(null);
              setRole(null);
            }
          }
        } catch (err) {
          console.error("Error fetching profile:", err);
          setProfile(null);
          setRole(null);
        }
      } else {
        setProfile(null);
        setRole(null);
      }
      
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, role, isLoading, signOut: handleSignOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
