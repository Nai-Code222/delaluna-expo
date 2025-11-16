/**
 * 🪩 Delaluna Connection Models
 * Shared TypeScript interfaces for Compatibility, Connections, and Firestore.
 */

/* -------------------------------------------------
   🔮 Compatibility (Gemini AI)
---------------------------------------------------*/

/** Keyword-based compatibility scores */
export interface CompatibilityScores {
  interest: number;
  communication: number;
  resonation: number;
  loyalty: number;
  attraction: number;
  empathy: number;
  reasoning: number;
  persuasion: number;
  stubbornness: number;
  ego: number;
  sacrifice: number;
  desire: number;
  adaptability: number;
  responsibility: number;
  accountability: number;
  hostility: number;
}

/** Gemini AI response schema for a compatibility report */
export interface CompatibilityResponse {
  title: string;
  summary: string;
  overallCompatibility: number; // 🌟 average / weighted score
  scores: CompatibilityScores;
  closing: string;
  createdAt: string; // ISO timestamp or Firestore string
}

/** Input passed to Gemini (structured in buildCompatibilityPrompt) */
export interface CompatibilityInput {
  userSun: string;
  userMoon: string;
  userRising: string;
  partnerSun: string;
  partnerMoon: string;
  partnerRising: string;
  relationshipType: string;
}

/* -------------------------------------------------
   🧭 Connection + Firestore
---------------------------------------------------*/

export interface ConnectionPersonInput {
  firstName: string;
  lastName: string;
  day: number;
  month: number;
  year: number;
  hour: number;
  min: number;
  lat: number;
  lon: number;
  tzone: number;
}

/** Firestore record for a user's connection */
export interface ConnectionDoc {
  status?: "pending" | "complete" | "error";
  prompt?: string; // text sent to Gemini
  result?: CompatibilityResponse;
  relationshipType?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface GetConnectionRequest {
  userId: string;
  isMe: boolean;
  relationshipType: string;
  firstPerson: ConnectionPersonInput;
  secondPerson: ConnectionPersonInput;
}

export interface GetConnectionResponse {
  connectionId: string;
  success: boolean;
  message: string;
}
