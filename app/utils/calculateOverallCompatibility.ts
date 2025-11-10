import { CompatibilityScores } from "../model/user-compatibility.model";

/**
 * 🔮 calculateOverallCompatibility
 * Calculates the overall compatibility percentage (0–100)
 * using a weighted average of the 16 category scores,
 * adjusted slightly by relationship type.
 */
export const calculateOverallCompatibility = (
  scores: CompatibilityScores,
  relationshipType: "consistent" | "it’s complicated" | "toxic"
): number => {
  // 🧭 Weights emphasize communication, empathy, and responsibility.
  const weights: Record<keyof CompatibilityScores, number> = {
    interest: 1.0,
    communication: 1.5,
    resonation: 1.5,
    loyalty: 1.4,
    attraction: 1.2,
    empathy: 1.3,
    reasoning: 1.0,
    persuasion: 1.0,
    stubbornness: 0.8,
    ego: 0.8,
    sacrifice: 1.1,
    desire: 1.3,
    adaptability: 1.2,
    responsibility: 1.4,
    accountability: 1.4,
    hostility: -1.0, // 🚫 Negative weight — high hostility lowers overall
  };

  let weightedSum = 0;
  let totalWeight = 0;

  // 🧮 Apply weighting to each score
  for (const [key, value] of Object.entries(scores)) {
    const weight = weights[key as keyof CompatibilityScores] ?? 1;
    weightedSum += value * weight;
    totalWeight += Math.abs(weight);
  }

  let overall = weightedSum / totalWeight;

  // 💞 Adjust based on relationship dynamics
  switch (relationshipType) {
    case "consistent":
      overall += 5; // reward emotional stability
      break;
    case "it’s complicated":
      overall -= 5; // slight uncertainty
      break;
    case "toxic":
      overall -= 15; // heavy penalty for chaotic dynamics
      break;
  }

  // 🧩 Clamp & round the result (0–100)
  overall = Math.max(0, Math.min(100, Math.round(overall)));

  return overall;
};
