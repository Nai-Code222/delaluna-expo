// src/types/horoscope.types.ts

import { MoonPhaseDetails } from "./moon-phases.type";

export interface HoroscopeResult {

  // Core guidance
  quote?: string;
  advice?: string;
  affirmation?: string;
  warning?: string;
  release?: string;

  // Action lists
  do?: string[];
  dont?: string[];

  // Astrology + tarot
  moon?: string;
  planetsRetrograde?: string[];
  moonPhaseDetails?: string;
  transits?: string;
  tarot?: string;

  // Love & luck
  newLove?: string[];        // compatible signs
  returns?: string[];
  luckyNumbers?: string[];  // comes from Gemini

}

export interface NormalizedHoroscope {
  yesterday?: HoroscopeResult;
  today?: HoroscopeResult;
  tomorrow?: HoroscopeResult;
}