// src/models/User.ts
export interface UserRecord {
    /** The Firestore document ID (or Auth UID) */
    id: string;
    firstName: string;
    lastName?: string;
    pronouns?: string;
    birthday?: string;     // store as ISO date string
    birthtime?: string;    // store as ISO time string
    placeOfBirth?: string;
    location?: string;
    email: string;
    password?: string;     // store as hashed string
    isPaidMember: boolean;
    signUpDate?: string; // store as ISO date string
    lastLoginDate?: string; // store as ISO date string
}

export interface UserRecordWithId extends UserRecord {
    id: string;
}
