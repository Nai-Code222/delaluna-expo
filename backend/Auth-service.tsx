import { AnswerRecord } from '@/components/sign up/ChatFlow';
import { firestore } from '@/firebaseConfig';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

/**
 * Create a new user with email & password.
 */
export async function signUp(email: string, password: string): Promise<void> {
  await auth().createUserWithEmailAndPassword(email, password);
}

/**
 * Create User document in Firestore when a new user signs up
 * return the id of the new user
 * @param answers - The answers from the sign-up flow
 * @returns {Promise<void>}
 * @throws {Error} - If the user document already exists
 */





/**
 * Email Verification.
 */



/**
 * Send a password reset email to the user.
 */

/**
 * Sign in an existing user with email & password.
 */
/** */
export async function signIn(email: string, password: string): Promise<void> {
  await auth().signInWithEmailAndPassword(email, password);
}


/**
 * Sign out the current user.
 */
export async function signOut(): Promise<void> {
  await auth().signOut();
}

/**
 * Subscribe to auth state changes.
 * e.g. in your root component you can do:
 *   useEffect(() => authStateChanged(setUser), [])
 */
export function onAuthStateChanged(
  callback: (user: FirebaseAuthTypes.User | null) => void,
) {
  return auth().onAuthStateChanged(callback);
}
