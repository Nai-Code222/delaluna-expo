// src/services/finishUserSignup.service.ts

import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebaseConfig";
import { getTarotCardDraw } from "./tarot-card.service";

export interface SignupUserRecord {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  pronouns: string | null;
  email: string;
  isEmailVerified: boolean;
  birthday: string;
  birthtime: string | null;
  placeOfBirth: string | null;
  birthLat: number;
  birthLon: number;
  birthTimezone: string | null;
  birthDateTimeUTC: string | null;
  tZoneOffset: number;
  isBirthTimeUnknown: boolean;
  isPlaceOfBirthUnknown: boolean;
  sunSign: string;
  moonSign: string;
  risingSign: string;
  astroParams: Record<string, any>;
  themeKey: string;
  currentTimezone: string | null;
  signupStatus: string;
  updatedAt?: any;
  lastLoginDate?: any;
}

export interface FinishUserSignupResponse {
  user: SignupUserRecord;
}

/**
 * Everything sent is namespaced and clean.
 */
export interface FinishUserSignupRequest {
  uid: string;
  displayName: string;
  firstName: string;
  lastName: string;
  pronouns: string | null;
  email: string;
  birthday: string;
  birthtime: string | null;
  birthLat: number;
  birthLon: number;
  birthTimezone: string | null;
  placeOfBirth: string | null;
  isBirthTimeUnknown: boolean;
  isPlaceOfBirthUnknown: boolean;
  currentTimezone: string | null;
  themeKey?: string | "default";
}

async function callWithLogging<TReq, TRes>(
  callableFn: (data: TReq) => Promise<{ data: TRes }>,
  request: TReq,
  label: string,
  maxAttempts = 3
): Promise<TRes> {
  let attempt = 0;
  let delay = 250;

  while (attempt < maxAttempts) {
    try {
      const response = await callableFn(request);
      console.log(`⚡ ${label} success on attempt ${attempt + 1}`);
      return response.data;
    } catch (err: any) {
      attempt++;
      console.warn(`⚠️ ${label} attempt ${attempt} failed:`, err);

      if (attempt >= maxAttempts) {
        console.error(`❌ ${label} failed after ${attempt} attempts`);
        throw err;
      }

      await new Promise(res => setTimeout(res, delay));
      delay *= 2;
    }
  }

  throw new Error(`${label} reached unexpected state.`);
}


/**
 * finishUserSignup
 */
const finishUserSignup = async (
  request: FinishUserSignupRequest
): Promise<FinishUserSignupResponse> => {
  try {

    const callable = httpsCallable<FinishUserSignupRequest, FinishUserSignupResponse>(
      functions,
      "finishUserSignup"
    );

    // Clean undefined values but preserve null
    const cleaned : FinishUserSignupRequest = stripUndefined(request);

    console.log("🧼 finishUserSignup clean request:", cleaned);

    const data = await callWithLogging(
      callable,
      cleaned,
      "finishUserSignup"
    );

    return data;
  } catch (err: any) {

    const message =
      err?.message ||
      err?.code ||
      err?.details ||
      "Signup failed. Please try again.";

    console.error("❌ finishUserSignup failure:", err);
    throw new Error(message);
  }
};

function stripUndefined(obj: any): any {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(stripUndefined);

  const cleaned: Record<string, any> = {};
  for (const key in obj) {
    const value = obj[key];
    if (value !== undefined) cleaned[key] = stripUndefined(value);
  }
  return cleaned;
}

export default finishUserSignup;