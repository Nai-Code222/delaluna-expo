// functions/src/utils/calculateTransits.ts

import swe from "@hatijs/core";
import { getZodiacSign } from "./calculateSigns";

const TRANSIT_ASPECTS = [
  { name: "conjunction", angle: 0, orb: 8, intensity: "major" },
  { name: "sextile", angle: 60, orb: 6, intensity: "minor" },
  { name: "square", angle: 90, orb: 8, intensity: "major" },
  { name: "trine", angle: 120, orb: 8, intensity: "major" },
  { name: "opposition", angle: 180, orb: 8, intensity: "major" },
];

export interface TransitAspect {
  transitingPlanet: string;
  natalPlanet: string;
  aspect: string;
  angle: number;
  orb: number;
  transitingSign: string;
  natalSign: string;
  natalHouse: number;
  intensity: string;
}

// ✅ Daily data - changes every day
export interface DailyTransitData {
  julianDay: number;
  isoDate: string;
  moon: {
    sign: string;
    phase: string;
    phaseAngle: number;
  };
  retrogradePlanets: string[];
}

// ✅ Weekly data - slower moving, calculated once during signup
export interface WeeklyTransitData {
  calculatedJulianDay: number;
  validUntilJulianDay: number;
  activeTransits: TransitAspect[];
  majorTransits: TransitAspect[];
}

interface NatalPositions {
  planets: Record<string, { longitude: number; house: number }>;
}

function angularDistance(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function getMoonPhase(jd: number) {
  const sun = swe.node_swe_calc_ut(jd, swe.SE_SUN, swe.SEFLG_SWIEPH) as any;
  const moon = swe.node_swe_calc_ut(jd, swe.SE_MOON, swe.SEFLG_SWIEPH) as any;

  let angle = moon.longitude - sun.longitude;
  if (angle < 0) angle += 360;

  let phase = "New Moon";
  if (angle < 22.5 || angle > 337.5) phase = "New Moon";
  else if (angle < 67.5) phase = "Waxing Crescent";
  else if (angle < 112.5) phase = "First Quarter";
  else if (angle < 157.5) phase = "Waxing Gibbous";
  else if (angle < 202.5) phase = "Full Moon";
  else if (angle < 247.5) phase = "Waning Gibbous";
  else if (angle < 292.5) phase = "Last Quarter";
  else phase = "Waning Crescent";

  return {
    name: phase,
    angle: Number(angle.toFixed(2))
  };
}

function getRetrogradePlanets(jd: number): string[] {
  const planets = [
    { name: "Mercury", id: swe.SE_MERCURY },
    { name: "Venus", id: swe.SE_VENUS },
    { name: "Mars", id: swe.SE_MARS },
    { name: "Jupiter", id: swe.SE_JUPITER },
    { name: "Saturn", id: swe.SE_SATURN },
    { name: "Uranus", id: swe.SE_URANUS },
    { name: "Neptune", id: swe.SE_NEPTUNE },
    { name: "Pluto", id: swe.SE_PLUTO },
  ];

  return planets
    .filter(p => {
      const result = swe.node_swe_calc_ut(
        jd,
        p.id,
        swe.SEFLG_SWIEPH | swe.SEFLG_SPEED
      ) as any;
      const speed = result.speed ?? 0;
      return speed < 0;
    })
    .map(p => p.name);
}

/**
 * Calculate DAILY transit data (moon, retrogrades)
 * This changes every day and should be recalculated daily
 */
export function calculateDailyTransits(
  targetDate?: Date
): DailyTransitData {
  const date = targetDate || new Date();
  date.setUTCHours(12, 0, 0, 0);

  const jd = swe.node_swe_julday(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    12,
    swe.SE_GREG_CAL
  );

  // Get current moon position
  const moonResult = swe.node_swe_calc_ut(jd, swe.SE_MOON, swe.SEFLG_SWIEPH) as any;
  const moonSign = getZodiacSign(moonResult.longitude);
  const moonPhaseData = getMoonPhase(jd);
  const planetsRetrograde = getRetrogradePlanets(jd);

  return {
    julianDay: jd,
    isoDate: date.toISOString(),
    moon: {
      sign: moonSign,
      phase: moonPhaseData.name,
      phaseAngle: moonPhaseData.angle,
    },
    retrogradePlanets: planetsRetrograde,
  };
}

/**
 * Calculate WEEKLY transit data (outer planet aspects)
 * This changes slowly and only needs recalculation every 7 days
 */
export function calculateWeeklyTransits(
  natalChart: NatalPositions,
  targetDate?: Date
): WeeklyTransitData {
  const date = targetDate || new Date();
  date.setUTCHours(12, 0, 0, 0);

  const jd = swe.node_swe_julday(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    12,
    swe.SE_GREG_CAL
  );

  // Only outer/slower planets for weekly transits
  const transitingPlanets = {
    jupiter: swe.SE_JUPITER,
    saturn: swe.SE_SATURN,
    uranus: swe.SE_URANUS,
    neptune: swe.SE_NEPTUNE,
    pluto: swe.SE_PLUTO,
  };

  const currentPositions: Record<string, number> = {};

  for (const [name, id] of Object.entries(transitingPlanets)) {
    const result = swe.node_swe_calc_ut(jd, id, swe.SEFLG_SWIEPH) as any;
    currentPositions[name] = ((result.longitude % 360) + 360) % 360;
  }

  // Calculate aspects
  const activeTransits: TransitAspect[] = [];

  for (const [transitName, transitLon] of Object.entries(currentPositions)) {
    for (const [natalName, natalData] of Object.entries(natalChart.planets)) {
      const natalLon = natalData.longitude;
      const distance = angularDistance(transitLon, natalLon);

      for (const aspect of TRANSIT_ASPECTS) {
        const delta = Math.abs(distance - aspect.angle);
        if (delta <= aspect.orb) {
          activeTransits.push({
            transitingPlanet: transitName,
            natalPlanet: natalName,
            aspect: aspect.name,
            angle: aspect.angle,
            orb: Number(delta.toFixed(2)),
            transitingSign: getZodiacSign(transitLon),
            natalSign: getZodiacSign(natalLon),
            natalHouse: natalData.house,
            intensity: aspect.intensity
          });
          break;
        }
      }
    }
  }

  // Sort by orb (tighter = stronger)
  activeTransits.sort((a, b) => a.orb - b.orb);

  // Top 5 most important
  const majorTransits = activeTransits
    .filter(t => t.intensity === "major")
    .slice(0, 5);

  // Valid for 7 days
  const validUntil = new Date(date);
  validUntil.setDate(validUntil.getDate() + 7);

  return {
    calculatedJulianDay: jd,
    validUntilJulianDay: swe.node_swe_julday(
      validUntil.getUTCFullYear(),
      validUntil.getUTCMonth() + 1,
      validUntil.getUTCDate(),
      12,
      swe.SE_GREG_CAL
    ),
    activeTransits,
    majorTransits,
  };
}

/**
 * Get 3 days of DAILY transit data (yesterday, today, tomorrow)
 */
export function getThreeDayTransits(): DailyTransitData[] {
  const results: DailyTransitData[] = [];
  const today = new Date();

  for (let offset = -1; offset <= 1; offset++) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    results.push(calculateDailyTransits(date));
  }

  return results;
}

/**
 * Check if weekly transits need recalculation
 */
export function needsRecalculation(validUntilJulianDay: number): boolean {
  const now = new Date();
  const nowJd = swe.node_swe_julday(
    now.getUTCFullYear(),
    now.getUTCMonth() + 1,
    now.getUTCDate(),
    now.getUTCHours() + now.getUTCMinutes() / 60,
    swe.SE_GREG_CAL
  );
  return nowJd >= validUntilJulianDay;
}