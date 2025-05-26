import Constants from 'expo-constants';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';


// Expo SDK 48+ may use expoConfig instead of manifest
const raw = (Constants.manifest as any)?.extra
  ?? (Constants.expoConfig as any)?.extra;

if (!raw) {
  throw new Error('Missing Expo constants extra; make sure app.config.js has an `extra` section');
}

const {
  firebaseApiKey,
  firebaseAuthDomain,
  firebaseProjectId,
  firebaseStorageBucket,
  firebaseMessagingSenderId,
  firebaseAppId,
} = raw as Record<string, string>;

const firebaseConfig = {
  apiKey: firebaseApiKey,
  authDomain: firebaseAuthDomain,
  projectId: firebaseProjectId,
  storageBucket: firebaseStorageBucket,
  messagingSenderId: firebaseMessagingSenderId,
  appId: firebaseAppId,
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// ✅ Initialize Auth with AsyncStorage for persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Firestore stays the same
export const db = getFirestore(app);
