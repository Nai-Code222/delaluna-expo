import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { scale, verticalScale, moderateScale } from "@/src/utils/responsive";
import CompatibilityProgressBarComponent from "./compatability-progress-bar.component";

/**
 * Optional dictionary of keyword definitions.
 * These can be refined later or fetched dynamically.
 */
const KEYWORD_DEFINITIONS: Record<string, string> = {
  Resonation: "How strongly your energies and personalities align.",
  Chemistry: "Physical and emotional attraction intensity.",
  Vibe: "The overall energetic flow between both of you.",
  Attraction: "The magnetic pull and initial spark.",
  Intensity: "Depth of feelings and emotional engagement.",
  Understanding: "How easily you empathize and see eye-to-eye.",
  Communication: "How clearly you express and receive thoughts.",
  Logic: "How rationally you handle disagreements.",
  Empathy: "Your capacity to feel and understand each other’s emotions.",
  Reasoning: "Balance between intuition and practicality.",
  Romance: "How much affection and tenderness you share.",
  Loyalty: "Commitment, reliability, and long-term dedication.",
  Devotion: "Depth of care and emotional investment.",
  Trust: "Mutual confidence and emotional safety.",
  Sacrifice: "Willingness to compromise for the other person.",
  Stubbornness: "Resistance to change or admit fault.",
  PowerStruggle: "Tendency for dominance or control dynamics.",
  Patience: "Ability to wait, listen, and give space when needed.",
  Boundaries: "How well you maintain individuality and limits.",
  Independence: "Freedom within the relationship dynamic.",
};

interface CompatibilityScoreListProps {
  scores: Record<string, number>;
}

/**
 * CompatibilityScoreListComponent
 * Maps all Gemini scores → Progress Bars with expandable definitions.
 */
export default function CompatibilityScoreListComponent({
  scores,
}: CompatibilityScoreListProps) {
  if (!scores || Object.keys(scores).length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No compatibility data yet 💫</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {Object.entries(scores).map(([keyword, value]) => (
        <CompatibilityProgressBarComponent
          key={keyword}
          keywordLabel={keyword}
          keywordDefinition={KEYWORD_DEFINITIONS[keyword]}
          scoreValue={Math.round(value)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: scale(4),
    marginTop: verticalScale(8),
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(40),
  },
  emptyText: {
    color: "#C5AFFF",
    fontSize: moderateScale(13),
    textAlign: "center",
  },
});
