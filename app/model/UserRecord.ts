// src/models/User.ts
export default interface UserRecord {
    id?: string;
    firstName: string;
    lastName: string;
    pronouns: string;
    birthday: string;     // store as ISO date string
    birthtime: string;    // store as ISO time string
    placeOfBirth: string | null;
    zodiacSign?: string | null;
    risingSign?: string | null;
    moonSign?: string | null;
    email: string;
    password?: string;     // store as hashed string
    emailVerified?: boolean;
    isPaidMember: boolean;
    signUpDate?: string; // store as ISO date string
    lastLoginDate?: string; // store as ISO date string
}