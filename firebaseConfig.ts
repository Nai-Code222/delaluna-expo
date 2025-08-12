// firebase.config.ts
import Constants from 'expo-constants';
import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';


const extra = (Constants.expoConfig as any)?.extra ?? (Constants.manifest as any)?.extra;
if (!extra) throw new Error('Missing Expo extra config');
const clean = (v?: string) => (v ?? '').trim();

const firebaseConfig = {
  apiKey: clean(extra.FIREBASE_API_KEY),
  authDomain: clean(extra.FIREBASE_AUTH_DOMAIN),
  projectId: clean(extra.FIREBASE_PROJECT_ID),
  storageBucket: clean(extra.FIREBASE_STORAGE_BUCKET),
  messagingSenderId: clean(extra.FIREBASE_MESSAGING_SENDER_ID),
  appId: clean(extra.FIREBASE_APP_ID),  // should include :web:
};


const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// RN-friendly Firestore
initializeFirestore(app, { experimentalAutoDetectLongPolling: true });

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);

// (once) sanity check on device:
console.log('Firebase on device:', getApp().options);
console.log(getApp().options); 
