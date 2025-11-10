// functions/src/utils/calculateOverallCompatibility.ts

import { CompatibilityScores } from "../models/connection.model";

/**
 * Calculates the overall compatibility percentage (0–100)
 * using a weighted average of category scores.
 * Adjusts final score slightly based on relationship type.
 */
export const calculateOverallCompatibility = (
  scores: CompatibilityScores,
  relationshipType: "consistent" | "it’s complicated" | "toxic"
): number => {
  const weights: Record<keyof CompatibilityScores, number> = {
    interest: 1,
    communication: 1.5,
    resonation: 1.5,
    loyalty: 1.4,
    attraction: 1.2,
    empathy: 1.3,
    reasoning: 1,
    persuasion: 1,
    stubbornness: 0.8,
    ego: 0.8,
    sacrifice: 1.1,
    desire: 1.3,
    adaptability: 1.2,
    responsibility: 1.4,
    accountability: 1.4,
    hostility: -1, // Negative weight lowers total
  };

  let weightedSum = 0;
  let totalWeight = 0;

  for (const [key, value] of Object.entries(scores)) {
    const weight = weights[key as keyof CompatibilityScores] ?? 1;
    weightedSum += value * weight;
    totalWeight += Math.abs(weight);
  }

  let overall = weightedSum / totalWeight;

  switch (relationshipType) {
    case "consistent":
      overall += 5;
      break;
    case "it’s complicated":
      overall -= 5;
      break;
    case "toxic":
      overall -= 15;
      break;
  }

  overall = Math.max(0, Math.min(100, overall)); // clamp to 0–100
  return Math.round(overall);
};
