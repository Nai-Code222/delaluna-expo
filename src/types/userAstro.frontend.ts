// src/types/userAstro.frontend.ts

import type { 
  UserAstroRecord,
  AstroParams, 
  Ascendant, 
  House, 
  Planets, 
  Aspect, 
  NatalChart 
} from "./userAstro.backend";
import { ZodiacSign } from "./enums";

// Convert backend string sign -> ZodiacSign enum
function mapToZodiacEnum(sign: string): ZodiacSign {
  return ZodiacSign[sign as keyof typeof ZodiacSign];
}

/**
 * Frontend-optimized types for UI display
 */

const SIGN_EMOJIS: Record<ZodiacSign, string> = {
  [ZodiacSign.Aries]: "♈",
  [ZodiacSign.Taurus]: "♉",
  [ZodiacSign.Gemini]: "♊",
  [ZodiacSign.Cancer]: "♋",
  [ZodiacSign.Leo]: "♌",
  [ZodiacSign.Virgo]: "♍",
  [ZodiacSign.Libra]: "♎",
  [ZodiacSign.Scorpio]: "♏",
  [ZodiacSign.Sagittarius]: "♐",
  [ZodiacSign.Capricorn]: "♑",
  [ZodiacSign.Aquarius]: "♒",
  [ZodiacSign.Pisces]: "♓"
};

const SIGN_ELEMENTS: Record<ZodiacSign, "Fire" | "Earth" | "Air" | "Water"> = {
  [ZodiacSign.Aries]: "Fire",
  [ZodiacSign.Leo]: "Fire",
  [ZodiacSign.Sagittarius]: "Fire",
  [ZodiacSign.Taurus]: "Earth",
  [ZodiacSign.Virgo]: "Earth",
  [ZodiacSign.Capricorn]: "Earth",
  [ZodiacSign.Gemini]: "Air",
  [ZodiacSign.Libra]: "Air",
  [ZodiacSign.Aquarius]: "Air",
  [ZodiacSign.Cancer]: "Water",
  [ZodiacSign.Scorpio]: "Water",
  [ZodiacSign.Pisces]: "Water"
};

export interface AstroParamsFE {
  birthDate: Date;
  birthTime: string; // "10:36 PM"
  location: {
    lat: number;
    lon: number;
    display: string; // "Dallas, TX" or coordinates
  };
  timezone: {
    offset: number;
    display: string; // "CST (UTC-6)"
  };
}

export interface PositionFE {
  formatted: string; // "Virgo 23°10′"
  sign: ZodiacSign;
  signEmoji: string;
  element: "Fire" | "Earth" | "Air" | "Water";
  longitude: number;
  displayShort: string; // "♍ 23°10′"
}

export interface PlanetFE extends PositionFE {
  name: string;
  house: number;
}

export interface AspectFE {
  type: string;
  angle: number;
  orb: number;
  planets: [string, string];
  display: string; // "Sun ☍ Moon (180° orb 4.8°)"
  isHard: boolean; // Opposition, square
  isSoft: boolean; // Trine, sextile
  strength: "strong" | "moderate" | "weak";
}

export interface BigThreeFE {
  sun: { sign: ZodiacSign; emoji: string; element: string };
  moon: { sign: ZodiacSign; emoji: string; element: string };
  rising: { sign: ZodiacSign; emoji: string; element: string };
}

export interface NatalChartFE {
  ascendant: PositionFE;
  bigThree: BigThreeFE;
  planets: Record<string, PlanetFE>;
  houses: PositionFE[];
  aspects: AspectFE[];
}

export interface UserAstroRecordFE {
  birthInfo: AstroParamsFE;
  chart: NatalChartFE;
  metadata: {
    lastUpdated?: Date;
    version: number;
  };
}

/**
 * Transform backend data to frontend format
 */
export function toFrontend(backend: UserAstroRecord): UserAstroRecordFE {
  const { astroParams, natalChart } = backend;
  
  return {
    birthInfo: transformAstroParams(astroParams),
    chart: transformNatalChart(natalChart),
    metadata: {
      lastUpdated: backend.updatedAt,
      version: backend.version || 1
    }
  };
}

function transformAstroParams(params: AstroParams): AstroParamsFE {
  const birthDate = new Date(
    params.year,
    params.month - 1,
    params.day,
    params.hour,
    params.min
  );
  
  const period = params.hour >= 12 ? 'PM' : 'AM';
  const displayHour = params.hour % 12 || 12;
  const birthTime = `${displayHour}:${params.min.toString().padStart(2, '0')} ${period}`;
  
  return {
    birthDate,
    birthTime,
    location: {
      lat: params.lat,
      lon: params.lon,
      display: `${params.lat.toFixed(4)}°, ${params.lon.toFixed(4)}°`
    },
    timezone: {
      offset: params.tzone,
      display: `UTC${params.tzone >= 0 ? '+' : ''}${params.tzone}`
    }
  };
}

function transformNatalChart(chart: NatalChart): NatalChartFE {
  return {
    ascendant: transformPosition(chart.ascendant),
    bigThree: {
      sun: {
        sign: mapToZodiacEnum(chart.bigThree.sun),
        emoji: SIGN_EMOJIS[mapToZodiacEnum(chart.bigThree.sun)],
        element: SIGN_ELEMENTS[mapToZodiacEnum(chart.bigThree.sun)]
      },
      moon: {
        sign: mapToZodiacEnum(chart.bigThree.moon),
        emoji: SIGN_EMOJIS[mapToZodiacEnum(chart.bigThree.moon)],
        element: SIGN_ELEMENTS[mapToZodiacEnum(chart.bigThree.moon)]
      },
      rising: {
        sign: mapToZodiacEnum(chart.bigThree.rising),
        emoji: SIGN_EMOJIS[mapToZodiacEnum(chart.bigThree.rising)],
        element: SIGN_ELEMENTS[mapToZodiacEnum(chart.bigThree.rising)]
      }
    },
    planets: transformPlanets(chart.planets),
    houses: chart.houses.map(transformPosition),
    aspects: chart.aspects.map(transformAspect)
  };
}

function transformPosition(pos: Ascendant | House): PositionFE {
  const enumSign = mapToZodiacEnum(pos.sign);

  return {
    formatted: pos.formatted,
    sign: enumSign,
    signEmoji: SIGN_EMOJIS[enumSign],
    element: SIGN_ELEMENTS[enumSign],
    longitude: pos.longitude,
    displayShort: `${SIGN_EMOJIS[enumSign]} ${pos.formatted.split(' ')[1]}`
  };
}

function transformPlanets(planets: Planets): Record<string, PlanetFE> {
  const result: Record<string, PlanetFE> = {};
  
  for (const [name, data] of Object.entries(planets)) {
    const enumSign = mapToZodiacEnum(data.sign);

    result[name] = {
      name,
      formatted: data.formatted,
      sign: enumSign,
      signEmoji: SIGN_EMOJIS[enumSign],
      element: SIGN_ELEMENTS[enumSign],
      longitude: data.longitude,
      house: data.house,
      displayShort: `${SIGN_EMOJIS[enumSign]} ${data.formatted.split(' ')[1]}`
    };
  }
  
  return result;
}

function transformAspect(aspect: Aspect): AspectFE {
  const isHard = aspect.type === "opposition" || aspect.type === "square";
  const isSoft = aspect.type === "trine" || aspect.type === "sextile";
  
  let strength: "strong" | "moderate" | "weak" = "moderate";
  if (aspect.orb < 2) strength = "strong";
  else if (aspect.orb > 6) strength = "weak";
  
  return {
    type: aspect.type,
    angle: aspect.angle,
    orb: aspect.orb,
    planets: [aspect.planet1, aspect.planet2],
    display: `${aspect.planet1} ${getAspectSymbol(aspect.type)} ${aspect.planet2} (${aspect.angle}° orb ${aspect.orb.toFixed(2)}°)`,
    isHard,
    isSoft,
    strength
  };
}

function getAspectSymbol(type: string): string {
  const symbols: Record<string, string> = {
    conjunction: "☌",
    opposition: "☍",
    trine: "△",
    square: "□",
    sextile: "⚹"
  };
  return symbols[type] || "—";
}