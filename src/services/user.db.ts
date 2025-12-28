import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { app } from "../../firebaseConfig";

const db = getFirestore(app);

// 🔧 Remove undefined, empty strings, invalid Firestore values
function sanitize(data: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};

  for (const key in data) {
    const value = data[key];

    if (value === undefined) continue;              // ❌ Firestore disallows undefined
    if (value === "") { out[key] = null; continue; } // normalize empty → null

    if (value && typeof value === "object" && !Array.isArray(value)) {
      out[key] = sanitize(value); // recursive clean
    } else {
      out[key] = value;
    }
  }

  // auto-lowercase email fields
  if (out.email && typeof out.email === "string") {
    out.email = out.email.toLowerCase();
  }

  return out;
}

/**
 * Create user profile
 */
export const saveUserProfile = async (uid: string, userData: Record<string, any>) => {
  try {
    const userRef = doc(db, "users", uid);

    const clean = sanitize(userData);

    await setDoc(userRef, {
      ...clean,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true }); // prevents accidental overwrite

    console.log("✅ User saved:", uid);
  } catch (error) {
    console.error("❌ Error saving user:", error);
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (uid: string, updatedData: Record<string, any>) => {
  try {
    const clean = sanitize(updatedData);

    const userRef = doc(db, "users", uid);

    await updateDoc(userRef, {
      ...clean,
      updatedAt: serverTimestamp(),
    });

    console.log("✅ User updated:", uid);
  } catch (error) {
    console.error("❌ Error updating user:", error);
    throw error;
  }
};

/**
 * Delete user doc
 * ⚠️ WARNING: This does NOT delete subcollections.
 */
export const deleteUserProfile = async (uid: string) => {
  try {
    const userRef = doc(db, "users", uid);

    await deleteDoc(userRef);

    console.log("🗑️ User deleted:", uid);
    console.warn("⚠️ Subcollections were NOT deleted. Use a Cloud Function for recursive delete.");
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    throw error;
  }
};