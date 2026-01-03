// Required polyfills
import "text-encoding-polyfill";
import "react-native-get-random-values";

import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";

// Firebase Core
import {
  initializeApp,
  getApps,
  getApp,
  FirebaseOptions,
} from "firebase/app";

// Auth
import {
  initializeAuth,
  connectAuthEmulator,
  // @ts-ignore
  getReactNativePersistence
} from "firebase/auth";

// Firestore
import {
  getFirestore,
  connectFirestoreEmulator,
} from "firebase/firestore";

// Functions
import {
  getFunctions,
  connectFunctionsEmulator,
} from "firebase/functions";

// Storage
import { getStorage } from "firebase/storage";

// Load Expo config
const extra =
  (Constants.expoConfig as any)?.extra ??
  (Constants.manifest as any)?.extra;

if (!extra) {
  throw new Error("❌ Missing Firebase config in Expo extra");
}

const firebaseConfig: FirebaseOptions = {
  apiKey: extra.FIREBASE_API_KEY,
  authDomain: extra.FIREBASE_AUTH_DOMAIN,
  projectId: extra.FIREBASE_PROJECT_ID,
  storageBucket: extra.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: extra.FIREBASE_MESSAGING_SENDER_ID,
  appId: extra.FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Auth
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Firestore
export const db = getFirestore(app);

// Storage (always REAL — no emulator)
export const storage = getStorage(app);

// Functions
export const functions = getFunctions(app, "us-central1");

// Firebase Ai Logic
// Initialize the Gemini Developer API backend service
const ai = getAI(app, { backend: new GoogleAIBackend() });

// Create a `GenerativeModel` instance with a model that supports your use case
const model = getGenerativeModel(ai, { model: "gemini-2.5-flash-image" });

// NOTE: Firebase Storage intentionally uses the REAL bucket
// (tarot images are static assets and should not be re-uploaded)

// Emulator Support (DEV only)
const USE_EMULATOR = extra?.USE_EMULATOR === "true";

if (__DEV__ && USE_EMULATOR) {
  const host = Platform.OS === "android" ? "10.0.2.2" : "localhost";

  // Auth
  connectAuthEmulator(auth, `http://${host}:9099`);

  // Firestore
  connectFirestoreEmulator(db, host, 8080);

  // Functions
  connectFunctionsEmulator(functions, host, 5001);

  console.log("USING EMULATOR: ", host);
}

export { app };
