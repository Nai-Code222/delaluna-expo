// firebaseConfig.ts

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import Constants from 'expo-constants';
import { getFirestore } from "firebase/firestore";
const extra = Constants.expoConfig?.extra || Constants.manifest?.extra;

// Your Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: extra?.FIREBASE_API_KEY,
  authDomain: extra?.FIREBASE_AUTH_DOMAIN,
  projectId: extra?.FIREBASE_PROJECT_ID,
  databaseURL: extra?.FIREBASE_DATABASE_URL,
  storageBucket: extra?.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: extra?.FIREBASE_MESSAGING_SENDER_ID,
  appId: extra?.FIREBASE_APP_ID,
  measurementId: extra?.FIREBASE_MEASUREMENT_ID,
};
console.log("Firebase Config: ", firebaseConfig);

// Initialize Firebase
// Note: getAnalytics is typically intended for web apps.
// If you’re using Expo on mobile, Firebase Analytics might need additional configuration.
// initialize analytics only if it's supported
const app = initializeApp(firebaseConfig);

let analytics;
(async () => {
  const supported = await isSupported();
  if (supported) {
    analytics = getAnalytics(app);
  } else {
    console.log("Firebase Analytics is not supported on this platform.");
  }
})();

// Initialize Firestore
const firestore = getFirestore(app); // <-- Create a Firestore instance

// Export the instances you need
export { app, analytics, firestore };
