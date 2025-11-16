import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";

export interface CachedUserProfile<T = any> {
  data: T;
  cachedAt: number; // timestamp in ms
}

const CACHE_KEY = (uid: string) => `userProfile:${uid}`;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in ms (you can adjust)

/**
 * useUserProfile — Keeps Firestore user doc synced & cached in AsyncStorage.
 * Automatically updates when Firestore changes and tracks cache freshness.
 *
 * @param uid Firebase Auth UID
 * @param initialData Optional initial userRecord (e.g., from signup)
 */
export function useUserProfile<T = any>(
  uid: string | undefined,
  initialData: T | null = null
) {
  const [user, setUser] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [cachedAt, setCachedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!uid) return;

    const userRef = doc(db, "users", uid);
    let unsubscribe: (() => void) | undefined;

    // ✅ Load cached profile from AsyncStorage
    const loadCachedProfile = async () => {
      try {
        const cachedStr = await AsyncStorage.getItem(CACHE_KEY(uid));
        if (cachedStr) {
          const cached: CachedUserProfile<T> = JSON.parse(cachedStr);
          setUser((prev: T | null) => prev || cached.data); // fix implicit any
          setCachedAt(cached.cachedAt);
          setLoading(false);

          // Optional: if cache too old, trigger Firestore refresh
          const isStale = Date.now() - cached.cachedAt > CACHE_TTL;
          if (isStale) fetchOnce(); 
        } else {
          // No cache → fetch immediately
          fetchOnce();
        }
      } catch (e) {
        console.warn("⚠️ Failed to load cached profile:", e);
        fetchOnce();
      }
    };

    // ✅ Save profile to cache with timestamp
    const saveCache = async (data: T) => {
      try {
        const cached: CachedUserProfile<T> = {
          data,
          cachedAt: Date.now(),
        };
        await AsyncStorage.setItem(CACHE_KEY(uid), JSON.stringify(cached));
        setCachedAt(cached.cachedAt);
      } catch (e) {
        console.warn("⚠️ Failed to cache user profile:", e);
      }
    };

    // ✅ One-time fetch (manual refresh)
    const fetchOnce = async () => {
      try {
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data() as T;
          setUser(data);
          setLoading(false);
          saveCache(data);
        }
      } catch (e: any) {
        setError(e.message);
      }
    };

    // ✅ Real-time updates
    const subscribeRealtime = () => {
      unsubscribe = onSnapshot(
        userRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as T;
            setUser(data);
            setLoading(false);
            saveCache(data);
          } else {
            console.warn("⚠️ Firestore doc not found yet, retrying...");
            fetchOnce();
          }
        },
        (err) => {
          console.warn("🔥 Firestore snapshot error:", err);
          setError(err.message);
          fetchOnce();
        }
      );
    };

    loadCachedProfile().then(() => subscribeRealtime());

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [uid]);

  return { user, loading, error, cachedAt };
}

/**
 * Clears the cached user profile (e.g., on logout)
 */
export async function clearUserProfileCache(uid: string) {
  try {
    await AsyncStorage.removeItem(CACHE_KEY(uid));
    console.log("🧹 Cleared user profile cache");
  } catch (e) {
    console.warn("⚠️ Failed to clear profile cache:", e);
  }
}
