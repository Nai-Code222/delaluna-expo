// natal-chart.prompt-adapter.ts
import { NatalChart } from "../types/natal-chart.types";

/**
 * This is the ONLY shape the AI prompt should ever see.
 * Keep it stable and structured (no prose here).
 */
export type NatalChartPromptInput = {
  bigThree: {
    sun: string;
    moon: string;
    rising: string;
  };
  ascendant: {
    sign: string;
    formatted: string;
  };
  houses: Array<{
    house: number;
    sign: string;
  }>;
  planets: Array<{
    name: string;
    sign: string;
    house: number;
    formatted: string;
  }>;
  aspects: Array<{
    planet1: string;
    planet2: string;
    type: string;
    orb: number;
  }>;
};

export function natalChartToPromptObject(
  chart: NatalChart
): NatalChartPromptInput {
  return {
    bigThree: {
      sun: chart.bigThree.sun,
      moon: chart.bigThree.moon,
      rising: chart.bigThree.rising,
    },

    ascendant: {
      sign: chart.ascendant.sign,
      formatted: chart.ascendant.formatted,
    },

    // Whole Sign Houses (1–12, one sign per house)
    houses: chart.houses.map((h) => ({
      house: h.house,
      sign: h.sign,
    })),

    planets: Object.entries(chart.planets).map(([name, p]) => ({
      name,
      sign: String(p.sign),
      house: p.house ?? 0, // 👈 fallback for safety
      formatted: p.formatted,
    })),

    // Limit to major aspects only (prompt-friendly)
    aspects: chart.aspects
      .filter((a) =>
        ["conjunction", "opposition", "square", "trine", "sextile"].includes(
          a.type
        )
      )
      .map((a) => ({
        planet1: a.planet1,
        planet2: a.planet2,
        type: a.type,
        orb: Number(a.orb.toFixed(2)),
      })),
  };
}