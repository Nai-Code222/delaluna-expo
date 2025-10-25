// app/services/astrology-api.service.ts

import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/firebaseConfig";

const functions = getFunctions(app);
const getSigns = httpsCallable(functions, "getSigns");

/** Fetch Sun, Moon, and Rising signs using Firebase Cloud Function (Ephemeris) */
export async function getAstroSigns(params: {
  day: number;
  month: number;
  year: number;
  hour: number;
  min: number;
  lat: number;
  lon: number;
  tzone: number;
}) {
  try {
    const result = await getSigns(params);
    const data = result.data as {
      sunSign: string;
      moonSign: string;
      risingSign: string;
    };

    console.log("☀️ Sun:", data.sunSign);
    console.log("🌙 Moon:", data.moonSign);
    console.log("⬆️ Rising:", data.risingSign);

    return data;
  } catch (error: any) {
    console.error("🔥 Error fetching signs:", error);
    throw new Error("Failed to calculate astrological signs");
  }
}
