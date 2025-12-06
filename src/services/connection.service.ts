// app/services/connection.db.ts
// 🔮 Centralized service for managing compatibility connections

import {
  collection,
  doc,
  getDocs,
  deleteDoc,
  getFirestore,
  onSnapshot,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { app, functions } from "../../firebaseConfig";

const db = getFirestore(app);

/* -------------------------------------------------
   🔮 CREATE CONNECTION (calls Cloud Function getConnection)
--------------------------------------------------- */
/**
 * Creates or updates a connection via the getConnection Cloud Function.
 * This ensures:
 *  - consistent connectionId generation
 *  - prompts are created properly
 *  - Gemini extensions trigger correctly
 */
export async function createConnection(data: {
  userId: string;
  isMe?: boolean;
  relationshipType?: string;
  firstPerson: Record<string, any>;
  secondPerson: Record<string, any>;
}) {
  const callable = httpsCallable(functions, "getConnection");
  const res = await callable(data);

  return res.data as {
    success: boolean;
    connectionId: string;
    message: string;
    userSigns: { sun: string; moon: string; rising: string };
    partnerSigns: { sun: string; moon: string; rising: string };
  };
}

/* -------------------------------------------------
   ❌ DELETE CONNECTION (Cloud Function)
--------------------------------------------------- */
export async function deleteConnection(data: {
  userId: string;
  connectionId: string;
}) {
  const callable = httpsCallable(functions, "deleteConnection");
  const res = await callable(data);
  return res.data as { success: boolean; connectionId: string };
}

/* -------------------------------------------------
   📚 READ CONNECTIONS (local Firestore)
--------------------------------------------------- */
/**
 * Returns all connections for a given user.
 * Useful for lists, UI rendering, and debugging.
 */
export async function getAllConnections(uid: string) {
  const connectionsRef = collection(db, "users", uid, "connections");
  const snapshot = await getDocs(connectionsRef);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* -------------------------------------------------
   🧹 LOCAL DELETE (Dev Only)
--------------------------------------------------- */
/**
 * Deletes a connection directly from Firestore.
 * ⚠️ Does NOT clean up prompts, scores, or Gemini artifacts.
 * Use only for emulator or test cleanup.
 */
export async function deleteConnectionLocal(
  uid: string,
  connectionId: string
) {
  const ref = doc(db, "users", uid, "connections", connectionId);
  await deleteDoc(ref);
  console.log("🗑️ Locally deleted:", connectionId);
}

/* -------------------------------------------------
   🔁 REAL-TIME SUBSCRIPTION (Single Connection)
--------------------------------------------------- */
/**
 * Subscribes to a single connection document in real time.
 * Used for status updates:
 * pending → processing → complete → error
 */
export function subscribeToConnection(
  uid: string,
  connectionId: string,
  callback: (data: any | null) => void
) {
  const ref = doc(db, "users", uid, "connections", connectionId);

  return onSnapshot(ref, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }

    callback({ id: snapshot.id, ...snapshot.data() });
  });
}
