// src/utils/harmFilter.ts
export type HarmCategory = "self-harm" | "violence" | "crime";

export interface HarmCheckResult {
  flagged: boolean;
  categories: HarmCategory[];
}

/**
 * Super simple keyword-based filter.
 * This is NOT perfect, but it catches obvious phrases.
 */
export function checkForHarm(text: string): HarmCheckResult {
  const value = text.toLowerCase();
  const categories: HarmCategory[] = [];

  // Self-harm / suicide
  const selfHarmPatterns = [
    "kill myself",
    "end my life",
    "suicide",
    "die tonight",
    "self harm",
    "hurt myself",
    "cut myself",
    "i don't want to live",
    "feel like dying",
    "want to die",
    "take my own life",
  ];

  if (selfHarmPatterns.some((phrase) => value.includes(phrase))) {
    categories.push("self-harm");
  }

  // Harm to others / violence
  const violencePatterns = [
    "kill",
    "kill him",
    "kill her",
    "kill them",
    "hurt him",
    "hurt her",
    "hurt them",
    "shoot him",
    "shoot her",
    "shoot them",
    "stab him",
    "stab her",
    "stab them",
    "beat him",
    "beat her",
    "beat them",
    "bomb",
    "bombing",
    "blow up",
    "assassinate",
    "assassination",
  ];

  if (violencePatterns.some((phrase) => value.includes(phrase))) {
    categories.push("violence");
  }

  // Crimes / planned illegal activity (keep this broad, not a how-to)
  const crimePatterns = [
    "kill",
    "rob a",
    "robbery",
    "burn his house",
    "burn her house",
    "arson",
    "vandalize",
    "break in",
    "breaking in",
    "drug deal",
    "drug dealer",
    "hijack",
    "hijacking",
    "smuggle",
    "smuggling",
    "fraud",
    "scam",
    "scamming",
    "steal",
    "theft",
    "shoplift",
    "burglary",
    "assault",
    "mugging",
    "extort",
    "extortion",
    "cyber attack",
    "cyberattack",
    "terrorism",
    "terrorist",
  ];

  if (crimePatterns.some((phrase) => value.includes(phrase))) {
    categories.push("crime");
  }

  return {
    flagged: categories.length > 0,
    categories,
  };
}
