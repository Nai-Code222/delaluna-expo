import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged as fbOnAuthStateChanged,
  signOut as fbSignOut,
} from 'firebase/auth';
import { UserRecord } from '../model/user-record';
import { auth, db } from '../../firebaseConfig';

/**
 * Create a new Firebase Auth user
 */
export default function signUp(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

/**
 * Sanitize Firestore data recursively.
 * Cleans NaN, Infinity, undefined, and invalid nested values.
 * Also logs warnings to help trace invalid data sources.
 */
function sanitizeFirestoreData(obj: any, path: string = ''): any {
  if (obj === null || obj === undefined) return obj;

  // Numbers
  if (typeof obj === 'number') {
    if (!Number.isFinite(obj)) {
      console.warn(`⚠️ Invalid numeric value at '${path}' → replaced with null`);
      return null;
    }
    return obj;
  }

  // Non-objects (string, boolean, etc.)
  if (typeof obj !== 'object') return obj;

  // Arrays
  if (Array.isArray(obj)) {
    return obj.map((item, idx) => sanitizeFirestoreData(item, `${path}[${idx}]`))
              .filter((v) => v !== undefined);
  }

  // Objects
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fieldPath = path ? `${path}.${key}` : key;

    if (value === undefined) {
      console.warn(`⚠️ Undefined value at '${fieldPath}' → removed`);
      continue;
    }

    const sanitized = sanitizeFirestoreData(value, fieldPath);

    if (sanitized !== undefined) clean[key] = sanitized;
  }
  return clean;
}

/**
 * Create new user document in Firestore
 */
export async function createUserDoc(userId: string, userData: UserRecord): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const sanitizedData = sanitizeFirestoreData({
      ...userData,
      createdAt: serverTimestamp(),
      lastUpdatedAt: serverTimestamp(),
    });

    await setDoc(userDocRef, sanitizedData);
    console.log('✅ User document created successfully:', userId);
  } catch (error) {
    console.error('❌ Error creating user document:', error);
    throw new Error('Error creating user document');
  }
}

/**
 * Sign in existing user
 */
export function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Sign out user
 */
export function signOut() {
  return fbSignOut(auth);
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChanged(cb: any) {
  return fbOnAuthStateChanged(auth, cb);
}

/**
 * Get Firestore reference for a user
 */
export function getUserDocRef(userId: string) {
  return doc(db, 'users', userId);
}

/**
 * Safely update Firestore user document
 */
export async function updateUserDoc(userId: string, userData: Partial<UserRecord>): Promise<void> {
  try {
    const userDocRef = getUserDocRef(userId);
    const sanitizedData = sanitizeFirestoreData({
      ...userData,
      lastUpdatedAt: serverTimestamp(),
    });

    await setDoc(userDocRef, sanitizedData, { merge: true });
    console.log('✅ User document updated successfully:', userId);
  } catch (error) {
    console.error('❌ Error updating user document:', error);
    throw new Error('Error updating user document');
  }
}
