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
  signUpDate?: Timestamp | ServerTimestamp;
  lastLoginDate?: Date | Timestamp;
  themeKey?: string; // e.g., 'default'

  // astrology (inputs for display)
  birthday: string;           // 'YYYY-MM-DD'
  birthtime?: string;         // e.g., '03:15 PM'
  placeOfBirth?: string | null;

  // UX flags
  isBirthTimeUnknown?: boolean;
  isPlaceOfBirthUnknown?: boolean;

  // canonical astro inputs (math)
  birthLat?: number;
  birthLon?: number;
  birthTimezone?: string;     // IANA
  birthTimeLocal?: string;    // 'HH:mm'
  birthDateTimeUTC?: Date | Timestamp;

  // outputs
  zodiacSign?: Nullable<string>;
  risingSign?: Nullable<string>;
  moonSign?: Nullable<string>;
}

// keep a lean default for UI state (don’t fake timestamps)
export const UserRecordDefault: Partial<UserRecord> = {
  firstName: '',
  lastName: '',
  pronouns: '',
  email: '',
  isPaidMember: false,
  themeKey: 'default',

  birthday: '',
  birthtime: '',
  placeOfBirth: null,

  isBirthTimeUnknown: false,
  isPlaceOfBirthUnknown: false,

  zodiacSign: null,
  risingSign: null,
  moonSign: null,
};

export default UserRecordDefault;
