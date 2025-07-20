export interface UserRecord {
    id?: string;
    firstName: string;
    lastName: string;
    pronouns: string;
    birthday: string;
    birthtime: string;
    isBirthTimeUnknown: boolean;
    placeOfBirth: string | null;
    isPlaceOfBirthUnknown: boolean;
    zodiacSign?: string | null;
    risingSign?: string | null;
    moonSign?: string | null;
    email: string;
    password?: string;
    isEmailVerified?: boolean;
    isPaidMember: boolean;
    signUpDate?: string;
    lastLoginDate?: string;
}

const UserRecordDefault: UserRecord = {
    firstName: "",
    lastName: "",
    pronouns: "",
    birthday: "",
    birthtime: "",
    isBirthTimeUnknown: false,
    placeOfBirth: "",
    isPlaceOfBirthUnknown: false,
    email: "",
    isPaidMember: false,
    password: "",
    isEmailVerified: false,
    signUpDate: "",
};

export default UserRecordDefault;
