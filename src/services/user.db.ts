import { getFirestore, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { app } from "../../firebaseConfig";

const db = getFirestore(app);

/**
 * Create a new user document
 */
export const saveUserProfile = async (uid: string, userData: Record<string, any>) => {
  try {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp(),
    });
    console.log("✅ User saved:", uid);
  } catch (error) {
    console.error("❌ Error saving user:", error);
    throw error;
  }
};

/**
 * Update an existing user document
 */
export const updateUserProfile = async (uid: string, updatedData: Record<string, any>) => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      ...updatedData,
      updatedAt: serverTimestamp(),
    });
    console.log("✅ User updated:", uid);
  } catch (error) {
    console.error("❌ Error updating user:", error);
    throw error;
  }
};

/**
 * Delete a user and all related subcollections (like connections)
 */
export const deleteUserProfile = async (uid: string) => {
  try {
    const userRef = doc(db, "users", uid);
    await deleteDoc(userRef);
    console.log("🗑️ User deleted:", uid);
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    throw error;
  }
};
