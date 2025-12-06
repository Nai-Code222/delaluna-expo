// src/model/connection.types.ts

// ===============================
// Raw Birth Data Input + Metadata
// ===============================
export interface PersonBirthData {
  // ---- User-entered fields ----
  "First Name"?: string;
  "Last Name"?: string;
  Birthday?: string;               // Raw user input, expected "MM/DD/YYYY"
  "Time of Birth"?: string;        // Raw UI text, supports "10:53 AM" or "23:10"
  "Place of Birth"?: string;
  "Pronouns"?: string;

  // ---- Normalized fields (computed internally) ----
  birthDateISO?: string;           // "YYYY-MM-DD"
  time24?: string;                 // "HH:mm"
  birthTimezone?: string;          // Required IANA zone ("America/Chicago")
  birthTimezoneOffset?: number;    // Numeric UTC offset (-6, -5, etc.)

  // ---- Geo data ----
  birthLat?: number;
  birthLon?: number;

  // ---- Backend-enriched sign data ----
  "Sun Sign"?: string;
  "Moon Sign"?: string;
  "Rising Sign"?: string;

  // ---- UI State Flags ----
  isPlaceOfBirthUnknown?: boolean;
  isBirthTimeUnknown?: boolean;
  defaultBirthTime?: string;       // Internal fallback if time unknown
}

// ===============================
// Profile Data Returned to Client
// ===============================
export interface PersonProfileData {
  "First Name": string;
  "Last Name": string;
  "Pronouns": string;
  "Sun Sign": string;
  "Moon Sign": string;
  "Rising Sign": string;
}

// ===============================
// Allow Partial Updates to Birth Data
// ===============================
export type PersonBirthUpdate = Partial<PersonBirthData>;
