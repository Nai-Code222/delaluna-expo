import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/firebaseConfig";

export function useUserConnections(userId?: string) {
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchConnections = async () => {
      try {
        setLoading(true);

        // 👇 Pull from users/{userId}/connections ordered by createdAt
        const ref = collection(db, "users", userId, "connections");
        const q = query(ref, orderBy("createdAt", "desc"));
        const snap = await getDocs(q);

        const results = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setConnections(results);
      } catch (err) {
        console.error("❌ Error fetching connections:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConnections();
  }, [userId]);

  return { connections, loading };
}
