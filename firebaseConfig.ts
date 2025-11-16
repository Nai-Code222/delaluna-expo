// -------------------------------------------------------------
// Required polyfills for Firebase + React Native / Expo
// -------------------------------------------------------------
import "text-encoding-polyfill";
import "react-native-get-random-values";

import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

// -------------------------------------------------------------
// Firebase Core
// -------------------------------------------------------------
import {
  initializeApp,
  getApps,
  getApp,
  FirebaseOptions,
} from "firebase/app";

// -------------------------------------------------------------
// Firebase AUTH (React Native)
// -------------------------------------------------------------
// With Firebase v11, `getReactNativePersistence` is imported from:
//    firebase/auth
// And TypeScript type resolution is fixed via tsconfig.json path override
import {
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";

// -------------------------------------------------------------
// ☁ Firebase Firestore (new style local persistence)
// -------------------------------------------------------------
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
} from "firebase/firestore";



// -------------------------------------------------------------
// ⚡ Cloud Functions
// -------------------------------------------------------------
import { getFunctions } from "firebase/functions";

// -------------------------------------------------------------
// 🧩 Load Firebase keys from app.config.js (Expo Extra)
// -------------------------------------------------------------
const extra =
  (Constants.expoConfig as any)?.extra ??
  (Constants.manifest as any)?.extra;

if (!extra) throw new Error("❌ Missing Firebase config in Expo extra");

// -------------------------------------------------------------
// 🔥 Firebase Config
// -------------------------------------------------------------
const firebaseConfig: FirebaseOptions = {
  apiKey: extra.FIREBASE_API_KEY,
  authDomain: extra.FIREBASE_AUTH_DOMAIN,
  projectId: extra.FIREBASE_PROJECT_ID,
  storageBucket: extra.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: extra.FIREBASE_MESSAGING_SENDER_ID,
  appId: extra.FIREBASE_APP_ID,
};

// -------------------------------------------------------------
// ⚙️ Initialize Firebase App (singleton)
// -------------------------------------------------------------
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// -------------------------------------------------------------
// 🔐 AUTH (React Native persistence)
// -------------------------------------------------------------
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// -------------------------------------------------------------
// ☁ FIRESTORE (offline-first, RN safe)
// -------------------------------------------------------------
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true, // fixes Android slow networks
  localCache: persistentLocalCache({
    tabManager: persistentSingleTabManager({}),
  }),
});

// -------------------------------------------------------------
// ⚡ FUNCTIONS
// -------------------------------------------------------------
export const functions = getFunctions(app, "us-central1");

// -------------------------------------------------------------
// 📦 EXPORT APP
// -------------------------------------------------------------
export { app };
