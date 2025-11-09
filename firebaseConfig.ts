// ✅ Polyfills must come FIRST
import "text-encoding-polyfill";
import "react-native-get-random-values";

import Constants from "expo-constants";
import { getApp, getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
} from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";

// 🧩 Grab Firebase settings from Expo extra config
const extra =
  (Constants.expoConfig as any)?.extra ??
  (Constants.manifest as any)?.extra;
if (!extra) throw new Error("Missing Expo constants extra");

// 🔥 Firebase config (from app.config.js / app.json)
const firebaseConfig: FirebaseOptions = {
  apiKey: extra.FIREBASE_API_KEY,
  authDomain: extra.FIREBASE_AUTH_DOMAIN,
  projectId: extra.FIREBASE_PROJECT_ID,
  storageBucket: extra.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: extra.FIREBASE_MESSAGING_SENDER_ID,
  appId: extra.FIREBASE_APP_ID,
};

// ✅ Initialize or re-use the app
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// 💾 Firestore — with modern offline persistence
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true, // 🩹 Fixes Android connectivity edge cases
  localCache: persistentLocalCache({
    tabManager: persistentSingleTabManager({}), // ✅ enables multi-tab safe offline persistence
  }),
});

// 🔐 Auth (React-Native compatible)
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// ⚡ Cloud Functions — specify deployed region
export const functions = getFunctions(app, "us-central1");

// 📦 Export app for re-use
export { app };
