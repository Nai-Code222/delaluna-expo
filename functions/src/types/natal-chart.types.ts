export type ZodiacSign =
  | "Aries" | "Taurus" | "Gemini" | "Cancer"
  | "Leo" | "Virgo" | "Libra" | "Scorpio"
  | "Sagittarius" | "Capricorn" | "Aquarius" | "Pisces";

export interface NatalPoint {
  sign: ZodiacSign;
  longitude: number;
  formatted: string;
  house?: number;
}

export interface NatalHouse {
  house: number;
  sign: ZodiacSign;
  longitude: number;
  formatted: string;
}

export interface NatalAspect {
  planet1: string;
  planet2: string;
  type: "conjunction" | "sextile" | "square" | "trine" | "opposition";
  angle: number;
  orb: number;
}

export interface NatalChart {
  ascendant: NatalPoint;
  bigThree: {
    sun: ZodiacSign;
    moon: ZodiacSign;
    rising: ZodiacSign;
  };
  planets: Record<string, NatalPoint>;
  houses: NatalHouse[];
  aspects: NatalAspect[];
}