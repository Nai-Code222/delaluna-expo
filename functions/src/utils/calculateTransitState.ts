import swe from "@hatijs/core";
import { getZodiacSign, PLANETS, CALC_FLAGS } from "./calculateSigns";
import "./initSwiss";


/**
 * Transit-only planet state (no natal data, no copy)
 */
export interface TransitPlanetState {
  longitude: number;
  sign: string;
  speed: number;
  retrograde: boolean;
  stationary: boolean;
  retrogradeStart?: number; // Julian Day (UT)
  retrogradeEnd?: number;   // Julian Day (UT)
}

/**
 * Full transit snapshot for a given moment
 */
export interface TransitState {
  julianDay: number;
  planets: Record<string, TransitPlanetState>;
}

/**
 * Convert ISO/Date → Julian Day (UT)
 */
export function isoToJulianDay(date: Date): number {
  return swe.node_swe_julday(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours() + date.getUTCMinutes() / 60,
    swe.SE_GREG_CAL
  );
}

/**
 * Find retrograde station (start or end) by scanning Swiss Ephemeris speed
 */
async function findRetrogradeStation(
  jd: number,
  planetId: number,
  direction: "start" | "end",
  maxDays = 120
): Promise<number | null> {
  const step = direction === "start" ? -1 : 1;

  let prevSpeed =
    (swe.node_swe_calc_ut(jd, planetId, CALC_FLAGS) as any).speed ?? 0;

  for (let i = 1; i <= maxDays; i++) {
    const testJd = jd + i * step;
    const result = swe.node_swe_calc_ut(testJd, planetId, CALC_FLAGS) as any;
    const speed = result.speed ?? 0;

    if ((prevSpeed >= 0 && speed < 0) || (prevSpeed < 0 && speed >= 0)) {
      return testJd;
    }

    prevSpeed = speed;
  }

  return null;
}

/**
 * Calculate transit state for a given date (default = now)
 *
 * - PURE calculation
 * - No prompts
 * - No labels
 * - No UI logic
 */
export async function calculateTransitState(
  date: Date = new Date()
): Promise<TransitState> {
  const jd = isoToJulianDay(date);
  const planets: Record<string, TransitPlanetState> = {};

  for (const p of PLANETS) {
    const result = swe.node_swe_calc_ut(jd, p.id, CALC_FLAGS) as any;

    const longitude = ((result.longitude % 360) + 360) % 360;
    const speed = result.speed ?? 0;
    const retrograde = speed < 0;
    const stationary = Math.abs(speed) < 0.01; // deg/day threshold

    let retrogradeStart: number | undefined;
    let retrogradeEnd: number | undefined;

    if (retrograde) {
      retrogradeStart =
        (await findRetrogradeStation(jd, p.id, "start")) ?? undefined;
      retrogradeEnd =
        (await findRetrogradeStation(jd, p.id, "end")) ?? undefined;
    }

    planets[p.key] = {
      longitude,
      sign: getZodiacSign(longitude),
      speed,
      retrograde,
      stationary,
      retrogradeStart,
      retrogradeEnd,
    };
  }

  return {
    julianDay: jd,
    planets,
  };
}