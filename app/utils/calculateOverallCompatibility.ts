// utils/calculateOverallCompatibility.ts

import { CompatibilityScores } from "../model/user-compatibility.model";

/**
 * Calculates the overall compatibility percentage (0–100)
 * using a weighted average of the 16 category scores
 * and adjusts based on relationshipType.
 */
export const calculateOverallCompatibility = (
  scores: CompatibilityScores,
  relationshipType: "consistent" | "complicated" | "toxic"
): number => {
  // Assign weights to emphasize emotional and communication factors
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
    hostility: -1 // Negative weight: higher hostility reduces total
  };

  let weightedSum = 0;
  let totalWeight = 0;

  for (const [key, value] of Object.entries(scores)) {
    const weight = weights[key as keyof CompatibilityScores] ?? 1;
    weightedSum += value * weight;
    totalWeight += Math.abs(weight); // use abs to normalize even negative weights
  }

  let overall = weightedSum / totalWeight;

  // Relationship type adjustments
  switch (relationshipType) {
    case "consistent":
      overall += 5; // reward stable energy
      break;
    case "complicated":
      overall -= 5; // introduce slight volatility
      break;
    case "toxic":
      overall -= 15; // penalize chaotic energy
      break;
  }

  // Clamp between 0–100
  if (overall > 100) overall = 100;
  if (overall < 0) overall = 0;

  // Round to a clean integer
  return Math.round(overall);
};

// Firestore collection path
// /users/{userId}/compatibility/{partnerName}
// {partnerName} : First-Last (no spaces, no special chars)
// After AI returns the JSON (scores only), run:
// response.overallCompatibility = calculateOverallCompatibility(response.scores, relationshipType);
// Save the computed result in Firestore:
// await compatibilityDocRef.set({ ...response, overallCompatibility: response.overallCompatibility });
// await setDoc(doc(db, "compatibility_reports", docId), response);


