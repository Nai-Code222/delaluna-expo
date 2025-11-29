// src/model/connection.types.ts
export interface PersonBirthData {
  // Required user-entry fields
  "First Name"?: string;
  "Last Name"?: string;
  Birthday?: string;             // MM/DD/YYYY
  "Place of Birth"?: string;
  "Time of Birth"?: string;
  "Pronouns"?: string

  // Optional backend-enriched sign data
  "Sun Sign"?: string;
  "Moon Sign"?: string;
  "Rising Sign"?: string;

  // Optional backend metadata
  birthLat?: number;
  birthLon?: number;
  birthTimezone?: string;

  // Optional UI state
  isPlaceOfBirthUnknown?: boolean;
  isBirthTimeUnknown?: boolean;
  defaultBirthTime?: string;
}

export interface PersonProfileData {
  "First Name": string;
  "Last Name": string;
  "Pronouns": string
  "Sun Sign": string;
  "Moon Sign": string;
  "Rising Sign": string;
}



export type PersonBirthUpdate = Partial<PersonBirthData>;

