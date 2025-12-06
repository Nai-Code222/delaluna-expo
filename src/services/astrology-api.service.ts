// app/services/astrology-api.service.ts

import { doc, setDoc, getDoc, onSnapshot, getFirestore } from "firebase/firestore";
import { auth } from "../../firebaseConfig";
import { getFunctions, httpsCallable } from "firebase/functions";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AstroSignParams {
  day: number;
  month: number;
  year: number;
  hour: number;
  min: number;
  lat: number;
  lon: number;
  tzone: number;
}

/** 🔧 Utility: Clear all cached astro sign results */
export async function clearAstroSignsCache() {
  const keys = await AsyncStorage.getAllKeys();
  const signKeys = keys.filter((key) => key.startsWith("astroSigns_"));
  if (signKeys.length > 0) {
    console.log("🧹 Clearing astro signs cache:", signKeys.length, "keys");
    await AsyncStorage.multiRemove(signKeys);
  }
}

/** 🔧 Utility: Cache key for birth chart */
function birthChartCacheKey(uid: string) {
  return `birthChart_${uid}`;
}

interface AstroSignResult {
  sunSign: string;
  moonSign: string;
  risingSign: string;
}

export async function getAstroSigns(params: AstroSignParams): Promise<AstroSignResult> {
  const cacheKey = `astroSigns_${params.day}_${params.month}_${params.year}_${params.hour}_${params.min}_${params.lat}_${params.lon}_${params.tzone}`;

  try {
    // 1. QUICK CACHE RETURN
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      console.log("⚡ Returning cached astro signs");
      return JSON.parse(cached) as AstroSignResult;
    }

    console.log("🔮 Calling getSigns callable function:", params);

    const functions = getFunctions();
    const callable = httpsCallable(functions, "getSigns");

    let attempt = 0;
    const maxAttempts = 3;

    while (attempt < maxAttempts) {
      try {
        const res: any = await callable(params);

        if (!res?.data) {
          throw new Error("No data returned from callable function");
        }

        const result: AstroSignResult = {
          sunSign: res.data.sunSign?.trim?.(" ") ?? "",
          moonSign: res.data.moonSign?.trim?.(" ") ?? "",
          risingSign: res.data.risingSign?.trim?.(" ") ?? "",
        };

        // SAVE TO CACHE
        await AsyncStorage.setItem(cacheKey, JSON.stringify(result));

        return result;
      } catch (err: any) {
        attempt++;
        console.warn(`❗ getSigns attempt ${attempt} failed`, err);

        if (attempt >= maxAttempts) {
          throw new Error(err.message || "Failed after retries");
        }

        // BACKOFF BEFORE RETRY
        await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
      }
    }

    throw new Error("Unexpected reach: retry loop failed");
  } catch (error: any) {
    console.error("🔥 Error fetching signs (callable):", error);
    throw new Error(error.message || "Failed to calculate astrological signs");
  }

}

/**
 * 🔮 getConnectionSigns
 * For NON‑USER individuals — returns ONLY signs (sun, moon, rising)
 */
export async function getConnectionSigns(params: AstroSignParams): Promise<AstroSignResult> {
  return await getAstroSigns(params);
}

/**
 * 🌙 getUserSignsAndChart
 * Used ONLY during signup for the logged‑in user.
 * Calls getSigns (callable) AND also requests/merges the birth chart.
 */
export async function getUserSignsAndChart(params: {
  day: number;
  month: number;
  year: number;
  hour: number;
  min: number;
  lat: number;
  lon: number;
  tzone: number;
  birthDate: string;   // yyyy-MM-dd
  birthTime: string;   // HH:mm
  timezone: number;
}): Promise<{
  signs: AstroSignResult;
  birthChart: string;
}> {
  // 1. Calculate signs (sun/moon/rising)
  const signs = await getAstroSigns({
    day: params.day,
    month: params.month,
    year: params.year,
    hour: params.hour,
    min: params.min,
    lat: params.lat,
    lon: params.lon,
    tzone: params.tzone,
  });

  // 2. Request birth chart from extension (NON-BLOCKING — fire and forget)
  requestBirthChart({
    birthDate: params.birthDate,
    birthTime: params.birthTime,
    lat: params.lat,
    lon: params.lon,
    timezone: params.timezone,
  })
    .then((chart) => {
      console.log("🌙 Birth chart completed in background");
    })
    .catch((err) => {
      console.warn("⚠️ Birth chart background generation failed:", err);
    });

  // Signs needed immediately → return them now
  return { signs, birthChart: "" };
}

export async function requestBirthChart(params: {
  birthDate: string;
  birthTime: string;
  lat: number;
  lon: number;
  timezone: number;
  
}): Promise<string> {
  const db = getFirestore();
  const uid = auth.currentUser!.uid;

  // 1. CHECK CACHE
  const cacheKey = birthChartCacheKey(uid);
  const cached = await AsyncStorage.getItem(cacheKey);
  if (cached) {
    console.log("⚡ Returning cached birth chart");
    return cached;
  }

  if (!uid) {
    throw new Error("User must be logged in.");
  }

  const docRef = doc(db, `users/${uid}/birth-chart/chart`);

  // Write the fields that the extension expects
  await setDoc(docRef, {
    birthDate: params.birthDate,
    birthTime: params.birthTime,
    lat: params.lat,
    lon: params.lon,
    timezone: params.timezone,
    requestedAt: Date.now(),
  });

  console.log("✨ Birth chart request saved. Waiting for extension...");

  // Wait for extension to write the output field
  return new Promise((resolve, reject) => {
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        const data = snap.data();
        if (!data) return;

        if (data.output) {
          unsubscribe();

          const finalChart = data.output;

          // Save to cache
          AsyncStorage.setItem(cacheKey, finalChart).catch((err) =>
            console.warn("⚠️ Failed to cache birth chart:", err)
          );

          // 🔥 Permanently save to the user's main profile doc so reinstall loads instantly
          const userProfileRef = doc(db, `users/${uid}`);
          setDoc(
            userProfileRef,
            { birthChart: finalChart },
            { merge: true }
          ).catch((err) =>
            console.warn("⚠️ Failed to write chart to user profile:", err)
          );

          resolve(finalChart);
        }

        if (data.error) {
          unsubscribe();
          reject(new Error(data.error));
        }
      },
      (err) => {
        unsubscribe();
        reject(err);
      }
    );
  });
}
