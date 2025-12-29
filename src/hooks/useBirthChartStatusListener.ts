// src/hooks/useBirthChartStatusListener.ts
import { useEffect, useState } from "react";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

export type BirthChartStatus =
  | "idle"
  | "pending"             // chart being generated
  | "image_ready"         // image done → placements ongoing
  | "placements_ready"    // completed fully
  | "error";

export function useBirthChartStatusListener(uid: string | null) {
  const [status, setStatus] = useState<BirthChartStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [placements, setPlacements] = useState<any>(null);
  const [chartImageUrl, setChartImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;

    const ref = doc(db, `users/${uid}/birthChart/default`);

    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;

      const data = snap.data();

      if (data.status) {
        setStatus(data.status);
      }

      if (data.error) {
        setError(data.error);
      } else {
        setError(null);
      }

      if (data.chartImageUrl) {
        setChartImageUrl(data.chartImageUrl);
      }

      if (data.placements) {
        setPlacements(data.placements);
      }
    });

    return () => unsub();
  }, [uid]);

  return {
    status,
    error,
    placements,
    chartImageUrl,
  };
}