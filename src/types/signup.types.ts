/**
 * Shared Signup Types + Zod Schemas
 * Used by ChatFlow, SignUpChatScreen, and backend payloads.
 *
 * NOTE:
 * - AnswerRecord = internal ChatFlow state (with Date objects + flags)
 * - ChatFlowOutputPayload = what buildFinalPayload produces (stringified + flags)
 * - FinalSignupPayload = ChatFlowOutputPayload plus uid/displayName for the server
 */

import { z } from "zod";
import type { DailyCardPack } from "@/model/daily-cards.model";

/* ---------------------------------------------
   INTERNAL CHATFLOW STATE
---------------------------------------------- */

/**
 * Internal state used by ChatFlow component.
 * Uses Date objects for birthday/birthtime + boolean flags.
 */
export interface AnswerRecord {
  firstName: string;
  lastName: string;
  pronouns: string;          // required, never null in UI

  birthday: Date | null;
  birthtime: Date | null;
  birthtimeUnknown: boolean;

  placeOfBirth: string | null;
  placeOfBirthUnknown: boolean;

  birthLat?: number;
  birthLon?: number;
  birthTimezone?: string;

  email: string;
  password: string;
  themeKey?: string;
}

/* ---------------------------------------------
   CHATFLOW → SERVER PAYLOAD (WITHOUT uid/dn)
---------------------------------------------- */

/**
 * Output of ChatFlow/buildFinalPayload.
 * This is the shape that Zod validates and that
 * SignUpChatScreen receives before adding uid/displayName.
 */
export type ChatFlowOutputPayload = {
  firstName: string;
  lastName: string;
  pronouns: string;

  email: string;
  password: string;

  themeKey?: string | "default";

  // formatted fields
  birthday: string;          // "MM/DD/YYYY"
  birthtime: string | null;  // "h:mm AM" | null when unknown
  birthTimezone: string | null;

  birthLat: number;
  birthLon: number;
  placeOfBirth: string | null;

  isBirthTimeUnknown: boolean;
  isPlaceOfBirthUnknown: boolean;

  currentTimezone: string | null;
};

/* ---------------------------------------------
   SERVER PAYLOAD (WITH uid/displayName)
---------------------------------------------- */

/**
 * Payload actually sent to finishUserSignup Cloud Function.
 * SignUpChatScreen adds uid + displayName to ChatFlowOutputPayload.
 */
export type FinalSignupPayload = ChatFlowOutputPayload;

export interface FinishUserSignupRequest {
  uid: string;
  displayName: string;
  payload: FinalSignupPayload;
    tarotCards: {
    yesterday: DailyCardPack;
    today: DailyCardPack;
    tomorrow: DailyCardPack;
  };
}

/* ---------------------------------------------
   ZOD SCHEMA (for ChatFlowOutputPayload)
---------------------------------------------- */

export const ChatFlowPayloadSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  pronouns: z.string().min(1, "Required"),

  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),

  themeKey: z.string().nullable().optional(),

  birthday: z.string().min(1, "Required"),

  // Option A — always a formatted string or null
  birthtime: z.string().nullable(),

  birthTimezone: z.string().nullable(),

  birthLat: z.number(),
  birthLon: z.number(),

  placeOfBirth: z.string().nullable(),

  isBirthTimeUnknown: z.boolean(),
  isPlaceOfBirthUnknown: z.boolean(),

  currentTimezone: z.string().nullable(),
});

// Backwards-compatible exports
export const FinalSignupSchema = ChatFlowPayloadSchema;
export type FinalSignupInput = z.input<typeof ChatFlowPayloadSchema>;
export type FinalSignupOutput = z.output<typeof ChatFlowPayloadSchema>;