import type { FieldValue, Timestamp } from "firebase/firestore";
import { DateTime } from "luxon";

type ServerTimestamp = FieldValue;
export type Nullable<T> = T | null;

export interface UserRecord {
  // identity
  id?: string;
  firstName: string;
  lastName?: string;
  pronouns?: string;

  // auth/membership
  email: string;
  isPaidMember: boolean;

  // human-readable strings for UI
  signUpDate?: string;        // "MM/DD/YYYY hh:mm:ss AM UTC-5"
  lastLoginDate?: string;     // "MM/DD/YYYY hh:mm:ss AM UTC-5"

  // machine-sortable timestamps
  signUpAt?: Timestamp | ServerTimestamp;
  lastLoginAt?: Timestamp | ServerTimestamp;

  themeKey?: string;

  // astrology inputs
  birthday: string;           // "MM/DD/YYYY"
  birthtime?: string; 
  birthTimezone?: string;     // IANA string like "America/Chicago"
  placeOfBirth?: string | null;
  birthLat?: number;
  birthLon?: number;
  birthTimeDateObj?: DateTime;      


  // UX flags
  isBirthTimeUnknown?: boolean;
  isPlaceOfBirthUnknown?: boolean;

  // canonical UTC string (for reference only)
  birthDateTimeUTC?: string;  // "MM/DD/YYYY - hh:mm:ss AM UTC-6"

  // numeric timezone offset (computed at signup, in hours)
  tZoneOffset?: number;

  // astrology outputs
  sunSign?: Nullable<string>;
  moonSign?: Nullable<string>;
  risingSign?: Nullable<string>;
}

export const UserRecordDefault: Partial<UserRecord> = {
  firstName: "",
  lastName: "",
  pronouns: "",
  email: "",
  isPaidMember: false,
  themeKey: "default",

  birthday: "",
  birthtime: "",
  birthTimezone: undefined,
  placeOfBirth: null,

  isBirthTimeUnknown: false,
  isPlaceOfBirthUnknown: false,

  sunSign: null,
  moonSign: null,
  risingSign: null,
};

export default UserRecordDefault;
