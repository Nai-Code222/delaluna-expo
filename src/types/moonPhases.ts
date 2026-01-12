// src/types/moonPhases.ts

import { MoonPhase } from "./enums";

export interface MoonPhaseInfo {
  phase: MoonPhase;
  illumination: number; // 0-100
  age: number; // Days since new moon
  emoji: string;
  description: string;
}

export function getMoonPhase(daysSinceNew: number): MoonPhaseInfo {
  const age = daysSinceNew % 29.53;
  
  if (age < 1.84) {
    return { phase: MoonPhase.NewMoon, illumination: 0, age, emoji: "🌑", description: "New beginnings" };
  } else if (age < 7.38) {
    return { phase: MoonPhase.WaxingCrescent, illumination: 25, age, emoji: "🌒", description: "Growth" };
  } else if (age < 9.23) {
    return { phase: MoonPhase.FirstQuarter, illumination: 50, age, emoji: "🌓", description: "Action" };
  } else if (age < 14.77) {
    return { phase: MoonPhase.WaxingGibbous, illumination: 75, age, emoji: "🌔", description: "Refinement" };
  } else if (age < 16.61) {
    return { phase: MoonPhase.FullMoon, illumination: 100, age, emoji: "🌕", description: "Manifestation" };
  } else if (age < 22.15) {
    return { phase: MoonPhase.WaningGibbous, illumination: 75, age, emoji: "🌖", description: "Gratitude" };
  } else if (age < 23.99) {
    return { phase: MoonPhase.LastQuarter, illumination: 50, age, emoji: "🌗", description: "Release" };
  } else {
    return { phase: MoonPhase.WaningCrescent, illumination: 25, age, emoji: "🌘", description: "Surrender" };
  }
}






