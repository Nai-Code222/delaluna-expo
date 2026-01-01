// src/types/horoscope.types.ts

// src/types/horoscope.types.ts

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
  transits?: string;
  tarot?: string;

  // Love & luck
  newLove?: string[];        // compatible signs
  luckyNumbers?: string[];  // comes from Gemini

}

export interface NormalizedHoroscope {
  yesterday?: HoroscopeResult;
  today?: HoroscopeResult;
  tomorrow?: HoroscopeResult;
}