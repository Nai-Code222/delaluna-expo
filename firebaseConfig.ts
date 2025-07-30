
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBHuxLRuwiLk1s6TJGoqPFe_1tYeFexVf8",
  authDomain: "delaluna-answers.firebaseapp.com",
  projectId: "delaluna-answers",
  storageBucket: "delaluna-answers.firebasestorage.app",
  messagingSenderId: "497678885238",
  appId: "1:497678885238:web:8cfed66d7cec58b7a5da57",
  measurementId: "G-YGE0L6115G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// ✅ Initialize Auth with AsyncStorage for persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Firestore stays the same
export const db = getFirestore(app);
