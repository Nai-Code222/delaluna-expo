import { useEffect, useState } from "react";
import { auth } from "../../firebaseConfig";
import { subscribeToConnection } from "../services/connection.service";
import { useRouter } from "expo-router";

/**
 * useConnection
 * Live listener for a single compatibility connection.
 * Updates UI automatically as Gemini moves from:
 * pending → processing → complete → error
 */
export function useConnection(connectionId: string | null) {
  const [connection, setConnection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!connectionId) {
      setLoading(false);
      setConnection(null);
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setError("User is not authenticated.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // 🔥 Firestore real-time listener
    const unsubscribe = subscribeToConnection(
      user.uid,
      connectionId,
      (data) => {
        if (!data) {
          setConnection(null);
          setLoading(false);
          return;
        }

        setConnection(data);
        // 🚀 Auto-navigate when Gemini finishes
        if (data?.status?.state === "complete") {
          router.push(`/connections/${connectionId}/result`);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [connectionId]);

  return { connection, loading, error };
}
