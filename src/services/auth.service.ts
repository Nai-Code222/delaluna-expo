// src/services/auth.service.ts
import { auth } from '../../firebaseConfig';
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
import { z } from 'zod';
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

/**
 * Zod schemas for consistent runtime validation
 */
const emailSchema = z.string().email('Invalid email format.');
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters.');

const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

/**
 * Normalize Firebase errors into consistent app-level errors
 */
function normalizeAuthError(error: any) {
  const code = error?.code;

  const map: Record<string, string> = {
    'auth/email-already-in-use': 'EMAIL_IN_USE',
    'auth/invalid-email': 'INVALID_EMAIL',
    'auth/weak-password': 'WEAK_PASSWORD',
    'auth/user-disabled': 'USER_DISABLED',
    'auth/user-not-found': 'USER_NOT_FOUND',
    'auth/wrong-password': 'INVALID_PASSWORD',
    'auth/too-many-requests': 'TOO_MANY_ATTEMPTS',
    'auth/invalid-credential': 'INVALID_CREDENTIAL',
  };

  return map[code] ?? 'UNKNOWN_ERROR';
}

/**
 * Create a new user with normalized errors + runtime validation
 */
export default async function signUp(
  email: string,
  password: string
): Promise<UserCredential> {
  try {
    const params = signUpSchema.parse({ email, password });
    return await createUserWithEmailAndPassword(auth, params.email, params.password);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw new Error(error.issues[0].message);
    }
    throw new Error(normalizeAuthError(error));
  }
}

/**
 * Sign in a user with normalized errors + runtime validation
 */
export async function signIn(email: string, password: string): Promise<UserCredential> {
  try {
    const params = signInSchema.parse({ email, password });
    return await signInWithEmailAndPassword(auth, params.email, params.password);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw new Error(error.issues[0].message);
    }
    throw new Error(normalizeAuthError(error));
  }
}

/**
 * Sign out the current user
 */
export function signOut(): Promise<void> {
  return fbSignOut(auth);
}

/**
 * Check if an email already exists — returns true/false
 * Always validates email format first.
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    emailSchema.parse(email);
    const methods = await fetchSignInMethodsForEmail(auth, email);
    return methods.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Check if user is signed in
 */
export function isUserSignedIn(): boolean {
  return auth.currentUser !== null;
}

/**
 * Get the current user
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Get current user ID
 */
export function getCurrentUserId(): string | null {
  return auth.currentUser ? auth.currentUser.uid : null;
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChanged(
  callback: (user: User | null) => void
): Unsubscribe {
  return fbOnAuthStateChanged(auth, callback);
}

/**
 * Helper to build a display name from first/last name,
 * with spacing and capitalization cleanup.
 */
export const buildDisplayName = (firstName: string, lastName: string) => {
  return `${firstName} ${lastName}`
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase());
};

export async function markUserEmailVerified(uid: string) {
  const userRef = doc(db, "users", uid);
  await setDoc(
    userRef,
    {
      emailVerified: true,
      verifiedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

