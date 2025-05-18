// src/contexts/AuthContext.tsx
import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { onAuthStateChanged } from './Auth-service';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';

export const AuthContext = createContext<{
  user: FirebaseAuthTypes.User | null;
}>({ user: null });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
}
