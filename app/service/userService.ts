import { auth } from '../../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged as fbOnAuthStateChanged,
  signOut as fbSignOut,
} from 'firebase/auth';
import { UserRecord } from '@/app/model/UserRecord';

export default function signUp(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

/** 
 * Create newUser doc to the Firestore Datbase users collection
 *  with the userId as the document id.
 * @param userId - The user ID to use as the document ID.
 * @param userData - a user record object to store in the document passed in from where its called.
 * @returns A promise that resolves when the document is created.
 * @throws An error if the document could not be created.
 */
export async function createUserDoc(
  userId: string,
  userData: UserRecord
): Promise<void> {
  try {
    // Create a new document in the "users" collection with the userId as the document ID
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, userData);
    console.log('User document created successfully:', userId);
  } catch (error) {
    console.error('Error creating user document:', error);
    throw new Error('Error creating user document');
  }
}

export function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function signOut() {
  return fbSignOut(auth);
}

export function onAuthStateChanged(cb: any) {
  return fbOnAuthStateChanged(auth, cb);
}

export function getUserDocRef(userId: string) {
  const userDocRef = doc(db, 'users', userId);
  return userDocRef;
}

// Update user document in Firestore return success or failure
export async function updateUserDoc(
  userId: string,
  userData: Partial<UserRecord>
): Promise<void> {
  try {
    const userDocRef = getUserDocRef(userId);
    await setDoc(userDocRef, userData, { merge: true });
    console.log('User document updated successfully:', userId);
    return Promise.resolve();
  } catch (error) {
    console.error('Error updating user document:', error);
    throw new Error('Error updating user document');
  }
}

