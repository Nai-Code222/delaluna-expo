import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../firebaseConfig";

/**
 * useUserConnections
 * Live subscription to a user's connection list.
 * Automatically updates as Gemini moves through:
 * pending → processing → complete
 */
export function useUserConnections(userId?: string) {
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const ref = collection(db, "users", userId, "connections");
    const q = query(ref, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setConnections(list);
        setLoading(false);
      },
      (error) => {
        console.error("❌ Error listening to user connections:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { connections, loading };
}
