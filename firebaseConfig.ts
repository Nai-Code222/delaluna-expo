// src/firebaseConfig.ts
import Constants from 'expo-constants';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the services you need elsewhere in your app
export const auth = getAuth(app);
export const db = getFirestore(app);
