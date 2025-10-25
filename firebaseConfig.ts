import Constants from 'expo-constants';
import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';

const extra = (Constants.expoConfig as any)?.extra ?? (Constants.manifest as any)?.extra;
if (!extra) throw new Error('Missing Expo constants extra');

const firebaseConfig: FirebaseOptions = {
  apiKey: extra.FIREBASE_API_KEY,
  authDomain: extra.FIREBASE_AUTH_DOMAIN,
  projectId: extra.FIREBASE_PROJECT_ID,
  storageBucket: extra.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: extra.FIREBASE_MESSAGING_SENDER_ID,
  appId: extra.FIREBASE_APP_ID, // should contain :web:
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// 👇 prevents Android “first read” hangs / white flashes
initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});

// Firebase authentication
export const auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
// Firestore database
export const db = getFirestore(app);
// Export the initialized app for use in other modules or any other Firebase SDKs
export { app };