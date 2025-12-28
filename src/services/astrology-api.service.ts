// app/services/astrology-api.service.ts

import { doc, setDoc, getDoc, onSnapshot, getFirestore } from "firebase/firestore";
import { auth } from "../../firebaseConfig";
import { getFunctions, httpsCallable } from "firebase/functions";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* ===========================================================
   TYPES
   =========================================================== */

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

interface AstroSignResult {
  sunSign: string;
  moonSign: string;
  risingSign: string;
}

function birthChartCacheKey(uid: string) {
  return `birthChart_${uid}`;
}

/* ===========================================================
   🔮 Clear Astro Signs Cache
   =========================================================== */

export async function clearAstroSignsCache() {
  const keys = await AsyncStorage.getAllKeys();
  const signKeys = keys.filter((key) => key.startsWith("astroSigns_"));
  if (signKeys.length > 0) {
    console.log("🧹 Clearing astro signs cache:", signKeys.length, "keys");
    await AsyncStorage.multiRemove(signKeys);
  }
}

/* ===========================================================
   🔮 getAstroSigns (calls backend getSigns callable)
   =========================================================== */

export async function getAstroSigns(params: AstroSignParams): Promise<AstroSignResult> {
  const cacheKey = `astroSigns_${params.day}_${params.month}_${params.year}_${params.hour}_${params.min}_${params.lat}_${params.lon}_${params.tzone}`;

  // CACHE FIRST
  const cached = await AsyncStorage.getItem(cacheKey);
  if (cached) {
    console.log("⚡ Returning cached astro signs");
    return JSON.parse(cached);
  }

  console.log("🔮 Calling getSigns callable function:", params);

  const functions = getFunctions();
  const callable = httpsCallable(functions, "getSigns");

  let attempt = 0;
  const maxAttempts = 3;

  while (attempt < maxAttempts) {
    try {
      const res: any = await callable(params);

      if (!res?.data) throw new Error("No data returned from callable function");

      const result: AstroSignResult = {
        sunSign: res.data.sunSign?.trim() ?? "",
        moonSign: res.data.moonSign?.trim() ?? "",
        risingSign: res.data.risingSign?.trim() ?? "",
      };

      await AsyncStorage.setItem(cacheKey, JSON.stringify(result));
      return result;
    } catch (err: any) {
      attempt++;
      console.warn(`❗ getSigns attempt ${attempt} failed`, err);

      if (attempt >= maxAttempts) {
        throw new Error(err.message || "Failed after retries");
      }

      await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
    }
  }

  throw new Error("Unexpected reach: retry loop failed");
}

/* ===========================================================
   🔮 getConnectionSigns (used for compatibility partner)
   =========================================================== */

export async function getConnectionSigns(params: AstroSignParams) {
  return await getAstroSigns(params);
}

/* ===========================================================
   🌙 getUserSignsAndChart (signup use only)
   Calls getSigns + fires birth chart request
   =========================================================== */

export async function getUserSignsAndChart(params: {
  day: number;
  month: number;
  year: number;
  hour: number;
  min: number;
  lat: number;
  lon: number;
  tzone: number;
  birthDate: string;
  birthTime: string;
  timezone: number;
}): Promise<{ signs: AstroSignResult; birthChart: string }> {
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

  // Fire & forget
  requestBirthChart({
    birthDate: params.birthDate,
    birthTime: params.birthTime,
    lat: params.lat,
    lon: params.lon,
    timezone: params.timezone,
  }).catch((err) => {
    console.warn("⚠️ Birth chart background generation failed:", err);
  });

  return { signs, birthChart: "" };
}

/* ===========================================================
   🌙 requestBirthChart
   Writes Firestore doc → Extension generates → client listens
   =========================================================== */

export async function requestBirthChart(params: {
  birthDate: string;
  birthTime: string;
  lat: number;
  lon: number;
  timezone: string | number;
}): Promise<string> {
  const db = getFirestore();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User must be logged in.");

  const docRef = doc(db, `users/${uid}/birthChart/default`);

  // 1️⃣ Cache check
  const cacheKey = birthChartCacheKey(uid);
  const cached = await AsyncStorage.getItem(cacheKey);
  if (cached) {
    console.log("⚡ Returning cached birth chart");
    return cached;
  }

  // 2️⃣ Write request
  await setDoc(
    docRef,
    {
      birthDate: params.birthDate,
      birthTime: params.birthTime,
      lat: params.lat,
      lon: params.lon,
      timezone: params.timezone,
      status: "pending",
      requestedAt: Date.now(),
    },
    { merge: true }
  );

  console.log("✨ Birth chart request saved. Waiting for extension...");

  // 3️⃣ Listen for extension output
  return new Promise((resolve, reject) => {
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (!snap.exists()) return;
        const data: any = snap.data();

        // Error
        if (data.status === "error") {
          unsubscribe();
          return reject(new Error(data.error ?? "Birth chart failed"));
        }

        // Success
        if (data.status === "complete" && data.output) {
          unsubscribe();

          const base64Image = data.output;

          alert("✨ Your birth chart is ready!");

          AsyncStorage.setItem(cacheKey, base64Image);
          setDoc(doc(db, `users/${uid}`), { birthChart: base64Image }, { merge: true });

          resolve(base64Image);
        }
      },
      (err) => {
        unsubscribe();
        reject(err);
      }
    );
  });
}

/* ===========================================================
   🌙 generateBirthChart callable wrapper
   =========================================================== */

export async function callGenerateBirthChart(uid: string, prompt: string) {
  const functions = getFunctions();
  const callable = httpsCallable(functions, "generateBirthChart");

  try {
    const res: any = await callable({ uid, prompt });
    console.log("✨ Birth chart generation started:", res.data);
    return res.data;
  } catch (err: any) {
    console.error("❌ Error calling generateBirthChart:", err);
    throw err;
  }
}