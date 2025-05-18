// firebaseConfig.ts

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import Constants from 'expo-constants';
import { getFirestore } from "firebase/firestore";
const extra = Constants.expoConfig?.extra;

// Your Firebase configuration using environment variables
// Note: Make sure to set these environment variables in your app's configuration
// or use a .env file for local development.
// You can use dotenv or similar libraries to load environment variables
// in a React Native app, or set them directly in your app's configuration.
// For example, in your app.json or app.config.js, you can set them like this:
// {
  //   "extra": {
  //     "FIREBASE_API_KEY": "your_api
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
