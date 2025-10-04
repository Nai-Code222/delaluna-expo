// @/app/model/UserRecord.ts
import type { FieldValue, Timestamp } from 'firebase/firestore';

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

  // ✅ human-readable strings for UI
  signUpDate?: string;        // "MM/DD/YYYY hh:mm:ss AM UTC-5"
  lastLoginDate?: string;     // "MM/DD/YYYY hh:mm:ss AM UTC-5"

  // ✅ machine-sortable timestamps for queries/ordering
  signUpAt?: Timestamp | ServerTimestamp;
  lastLoginAt?: Timestamp | ServerTimestamp;

  themeKey?: string; // e.g., 'default'

  // astrology (inputs for display)
  birthday: string;           // "MM/DD/YYYY"
  birthtime?: string;         // "hh:mm AM"
  birthTimezone?: string;     // IANA, e.g. "Europe/Rome"
  placeOfBirth?: string | null;

  // UX flags
  isBirthTimeUnknown?: boolean;
  isPlaceOfBirthUnknown?: boolean;

  // canonical astro inputs (math)
  birthLat?: number;
  birthLon?: number;

  // ✅ canonical UTC string (no local)
  birthDateTimeUTC?: string;  // "MM/DD/YYYY - hh:mm:ss AM UTC-6"

  // outputs
  zodiacSign?: Nullable<string>;
  risingSign?: Nullable<string>;
  moonSign?: Nullable<string>;
}

// keep a lean default for UI state
export const UserRecordDefault: Partial<UserRecord> = {
  firstName: '',
  lastName: '',
  pronouns: '',
  email: '',
  isPaidMember: false,
  themeKey: 'default',

  birthday: '',
  birthtime: '',
  birthTimezone: undefined,
  placeOfBirth: null,

  isBirthTimeUnknown: false,
  isPlaceOfBirthUnknown: false,

  zodiacSign: null,
  risingSign: null,
  moonSign: null,
};

export default UserRecordDefault;
