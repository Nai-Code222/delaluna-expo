/** ✨ CompatibilityResult — Cleaned structure from onGeminiResponse */
export interface CompatibilityResult {
  /** short, catchy title (e.g., “Fire Meets Water: Leo × Pisces”) */
  title: string;

  /** 1–2 paragraph compatibility summary */
  summary: string;

  /** closing one-liner (e.g., “Keep what grows you, release what drains you.”) */
  closing: string;

  /** numeric score from 0–100 representing overall relationship harmony */
  overallCompatibility?: number | null;

  /** detailed subcategory scores */
  scores: {
    interest?: number;
    communication?: number;
    resonation?: number;
    loyalty?: number;
    attraction?: number;
    empathy?: number;
    reasoning?: number;
    persuasion?: number;
    stubbornness?: number;
    ego?: number;
    sacrifice?: number;
    desire?: number;
    adaptability?: number;
    responsibility?: number;
    accountability?: number;
    hostility?: number;
    [key: string]: number | undefined; // allow dynamic Gemini keys
  };
}

/** 🔮 Firestore document shape after Gemini response cleaning */
export interface CompatibilityDocument {
  id?: string;
  type?: string;
  status?: {
    state?: "pending" | "complete" | "error";
    type?: string;
    completeTime?: any;
    errorAt?: any;
  };
  result?: CompatibilityResult;
}
