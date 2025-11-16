import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { useAuth } from "../../src/backend/auth-context";

const PREMIUM_KEY = "delaluna_premium_access";

export function usePremiumAccess() {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  // 🧠 Load premium status on mount
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const stored = await AsyncStorage.getItem(PREMIUM_KEY);
        setIsPremium(stored === "true");
      } catch (e) {
        console.warn("Failed to load premium status:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  // 🪄 Function to activate premium
  const activatePremium = async () => {
    try {
      setIsPremium(true);
      await AsyncStorage.setItem(PREMIUM_KEY, "true");

      if (user?.uid) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { isPremium: true });
        console.log(`Premium status updated for user ${user.uid}`);
      }
    } catch (e) {
      console.error("Error updating premium status:", e);
    }
  };

  // 🧹 Function to reset premium (for testing)
  const clearPremium = async () => {
    try {
      setIsPremium(false);
      await AsyncStorage.removeItem(PREMIUM_KEY);

      if (user?.uid) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { isPremium: false });
        console.log(`🧹 Premium status cleared for user ${user.uid}`);
      }
    } catch (e) {
      console.error("Error clearing premium:", e);
    }
  };

  return { isPremium, activatePremium, clearPremium, loading };
}
