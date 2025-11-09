import {
  getFirestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { app } from "@/firebaseConfig";

const db = getFirestore(app);

/**
 * Create a new connection under a user
 */
export const saveConnection = async (uid: string, connectionData: Record<string, any>) => {
  try {
    const connectionsRef = collection(db, "users", uid, "connections");
    const docRef = await addDoc(connectionsRef, {
      ...connectionData,
      createdAt: serverTimestamp(),
    });
    console.log("✅ Connection saved:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ Error saving connection:", error);
    throw error;
  }
};

/**
 * Update an existing connection
 */
export const updateConnection = async (
  uid: string,
  connectionId: string,
  updatedData: Record<string, any>
) => {
  try {
    const connectionRef = doc(db, "users", uid, "connections", connectionId);
    await updateDoc(connectionRef, {
      ...updatedData,
      updatedAt: serverTimestamp(),
    });
    console.log("✅ Connection updated:", connectionId);
  } catch (error) {
    console.error("❌ Error updating connection:", error);
    throw error;
  }
};

/**
 * Delete a single connection document
 */
export const deleteConnection = async (uid: string, connectionId: string) => {
  try {
    const connectionRef = doc(db, "users", uid, "connections", connectionId);
    await deleteDoc(connectionRef);
    console.log("🗑️ Connection deleted:", connectionId);
  } catch (error) {
    console.error("❌ Error deleting connection:", error);
    throw error;
  }
};

/**
 * Delete all connections under a specific user
 * (useful when deleting a user account)
 */
export const deleteAllConnectionsForUser = async (uid: string) => {
  try {
    const connectionsRef = collection(db, "users", uid, "connections");
    const snapshot = await getDocs(connectionsRef);

    const deletePromises = snapshot.docs.map((docSnap) =>
      deleteDoc(docSnap.ref)
    );
    await Promise.all(deletePromises);

    console.log(`🧹 Deleted all connections for user: ${uid}`);
  } catch (error) {
    console.error("❌ Error deleting all connections:", error);
    throw error;
  }
};
