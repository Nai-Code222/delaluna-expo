// src/services/authService.ts
import { UserRecord } from '@/model/UserRecord';
import { auth, db } from '../firebaseConfig';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged as fbOnAuthStateChanged,
  signOut as fbSignOut,
  fetchSignInMethodsForEmail,
  User,
  Unsubscribe,
  UserCredential,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

/**
 * Create a new user with email & password.
 * Resolves with the UserCredential.
 */
export function signUp(
  email: string,
  password: string
): Promise<UserCredential> {
  return createUserWithEmailAndPassword(auth, email, password);
}




/**
 * Sign in an existing user with email & password.
 * Resolves with the UserCredential.
 */
export function signIn(
  email: string,
  password: string
): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Sign out the current user.
 */
export function signOut(): Promise<void> {
  return fbSignOut(auth);
}

/** Check for existing email
 * Returns true if the email is already in use.
 * Returns false if the email is not in use.
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  const methods = await fetchSignInMethodsForEmail(auth, email);
  return methods.length > 0;
}
/**
 * Check if the user is signed in.
 * Returns true if the user is signed in.
 * Returns false if the user is not signed in.
 */
export function isUserSignedIn(): boolean {
  const user = auth.currentUser;
  return user !== null;
}

/**
 * Get the current user.
 * Returns the current user or null if no user is signed in.
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Get the current user ID.
 * Returns the current user ID or null if no user is signed in.
 */
export function getCurrentUserId(): string | null {
  const user = auth.currentUser;
  return user ? user.uid : null;
}


/**
 * Subscribe to auth state changes.
 * Returns an unsubscribe function.
 *
 * Example usage in a component:
 *   useEffect(() => {
 *     const unsub = onAuthStateChanged(user => {
 *       console.log('current user:', user);
 *     });
 *     return unsub;
 *   }, []);
 */
export function onAuthStateChanged(
  callback: (user: User | null) => void
): Unsubscribe {
  return fbOnAuthStateChanged(auth, callback);
}
