// src/types/userAstro.backend.ts

import { Timestamp } from "firebase/firestore";
import { z } from "zod";
import { 
  astroParamsSchema, 
  ascendantSchema, 
  planetPositionSchema, 
  houseSchema, 
  aspectSchema, 
  bigThreeSchema, 
  planetsSchema, 
  natalChartSchema,
  userAstroRecordSchema,
  userDocumentSchema,
  signupErrorSchema
} from "@/schemas/userAstro.schemas";

/**
 * Raw Firestore document types - matches exact database structure
 */

export interface AstroParamsDB {
  day: number;
  hour: number;
  lat: number;
  lon: number;
  min: number;
  month: number;
  tzone: number;
  year: number;
}

export interface AscendantDB {
  formatted: string;
  longitude: number;
  sign: string;
}

export interface PlanetPositionDB {
  formatted: string;
  house: number;
  longitude: number;
  sign: string;
}

export interface HouseDB {
  formatted: string;
  house: number;
  longitude: number;
  sign: string;
}

export interface AspectDB {
  angle: number;
  orb: number;
  planet1: string;
  planet2: string;
  type: string;
}

export interface BigThreeDB {
  moon: string;
  rising: string;
  sun: string;
}

export interface PlanetsDB {
  jupiter: PlanetPositionDB;
  mars: PlanetPositionDB;
  mercury: PlanetPositionDB;
  moon: PlanetPositionDB;
  neptune: PlanetPositionDB;
  pluto: PlanetPositionDB;
  saturn: PlanetPositionDB;
  sun: PlanetPositionDB;
  uranus: PlanetPositionDB;
  venus: PlanetPositionDB;
}

export interface NatalChartDB {
  ascendant: AscendantDB;
  aspects: AspectDB[];
  bigThree: BigThreeDB;
  houses: HouseDB[];
  planets: PlanetsDB;
}

export interface UserAstroRecordDB {
  astroParams: AstroParamsDB;
  natalChart: NatalChartDB;
  version?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface SignupErrorDB {
  message: string;
  at: Timestamp;
}

/**
 * Complete user document from Firestore
 */
export interface UserDocumentDB {
  // User identity
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  pronouns?: string | null;

  // Birth info
  birthday: string;
  birthtime?: string | null;
  birthDateTimeUTC: string;
  placeOfBirth?: string | null;
  
  birthLat: number;
  birthLon: number;
  birthTimezone?: string | null;
  tZoneOffset: number;

  // Flags
  isEmailVerified: boolean;
  isPaidMember: boolean;
  isBirthTimeUnknown: boolean;
  isPlaceOfBirthUnknown?: boolean;

  // Astro data
  astroParams: AstroParamsDB;
  natalChart: NatalChartDB;

  // App settings
  themeKey: string;
  currentTimezone?: string | null;

  // Status
  signupStatus: "incomplete" | "processing" | "complete" | "error";
  signupError?: SignupErrorDB;

  // Timestamps
  updatedAt?: Timestamp;
  lastLoginDate?: Timestamp;
  createdAt?: Timestamp;

  // Versioning
  version?: number;
}

/**
 * Validated types (inferred from Zod schemas)
 */
export type AstroParams = z.infer<typeof astroParamsSchema>;
export type Ascendant = z.infer<typeof ascendantSchema>;
export type PlanetPosition = z.infer<typeof planetPositionSchema>;
export type House = z.infer<typeof houseSchema>;
export type Aspect = z.infer<typeof aspectSchema>;
export type BigThree = z.infer<typeof bigThreeSchema>;
export type Planets = z.infer<typeof planetsSchema>;
export type NatalChart = z.infer<typeof natalChartSchema>;
export type UserAstroRecord = z.infer<typeof userAstroRecordSchema>;
export type SignupError = z.infer<typeof signupErrorSchema>;
export type UserDocument = z.infer<typeof userDocumentSchema>;

/**
 * Parse and validate Firestore user astro record
 */
export async function parseUserAstroRecord(docData: unknown): Promise<UserAstroRecord> {
  if (!docData || typeof docData !== 'object') {
    throw new Error('Invalid document data');
  }
  
  // Convert Firestore Timestamps to Dates
  const normalized = {
    ...(docData as Record<string, any>),
    createdAt: (docData as any).createdAt?.toDate?.(),
    updatedAt: (docData as any).updatedAt?.toDate?.()
  };
  
  return userAstroRecordSchema.parse(normalized);
}

/**
 * Safely validate user astro record with error handling
 */
export function validateUserAstroRecord(docData: unknown): {
  success: boolean;
  data?: UserAstroRecord;
  error?: z.ZodError;
} {
  try {
    const result = userAstroRecordSchema.safeParse(docData);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      console.error("Validation failed:", result.error.flatten());
      return { success: false, error: result.error };
    }
  } catch (err) {
    console.error("Unexpected validation error:", err);
    return { success: false, error: err as z.ZodError };
  }
}

/**
 * Type guard for UserAstroRecord
 */
export function isValidUserAstroRecord(data: unknown): data is UserAstroRecord {
  return validateUserAstroRecord(data).success;
}

/**
 * Parse and validate complete user document
 */
export async function parseUserDocument(docData: unknown): Promise<UserDocument> {
  if (!docData || typeof docData !== 'object') {
    throw new Error('Invalid document data');
  }
  
  // Convert Firestore Timestamps to Dates
  const normalized = {
    ...(docData as Record<string, any>),
    createdAt: (docData as any).createdAt?.toDate?.(),
    updatedAt: (docData as any).updatedAt?.toDate?.(),
    lastLoginDate: (docData as any).lastLoginDate?.toDate?.(),
    signupError: (docData as any).signupError ? {
      ...(docData as any).signupError,
      at: (docData as any).signupError.at?.toDate?.()
    } : undefined
  };
  
  return userDocumentSchema.parse(normalized);
}

/**
 * Safely validate complete user document
 */
export function validateUserDocument(docData: unknown): {
  success: boolean;
  data?: UserDocument;
  error?: z.ZodError;
} {
  try {
    const result = userDocumentSchema.safeParse(docData);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      console.error("User document validation failed:", result.error.flatten());
      return { success: false, error: result.error };
    }
  } catch (err) {
    console.error("Unexpected validation error:", err);
    return { success: false, error: err as z.ZodError };
  }
}

/**
 * Type guard for UserDocument
 */
export function isValidUserDocument(data: unknown): data is UserDocument {
  return validateUserDocument(data).success;
}