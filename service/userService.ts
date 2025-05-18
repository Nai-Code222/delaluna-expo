// src/services/userService.ts
import firestore from '@react-native-firebase/firestore';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import type { AnswerRecord } from '@/components/sign up/ChatFlow';
import type { UserRecord } from '@/model/UserRecord';

export async function registerNewUser(
  answers: AnswerRecord
): Promise<void> {
  if (!answers.email || !answers.password) {
    throw new Error('Email and password are required');
  }

  // 1) Create the Auth user
  const cred = await auth().createUserWithEmailAndPassword(
    answers.email,
    answers.password
  );
  const uid = cred.user.uid;

  // 2) Build the user document
  const userDoc: UserRecord = {
    id: uid,
    firstName: answers.firstName!,
    lastName: answers.lastName,
    pronouns: answers.pronouns,
    birthday: answers.birthday?.toISOString(),
    birthtime: answers.birthtime?.toISOString(),
    placeOfBirth: answers.placeOfBirth,
    location: answers.location,
    email: answers.email,
    isPaidMember: false,
  };

  // 3) Write it under `users/{uid}` — **no parentheses** on `firestore`
  await firestore()
    .collection('users')
    .doc(uid)
    .set(userDoc);
}
