import swe from "@hatijs/core";
import { DateTime } from "luxon";
import path from "path";



// --- Date helpers: Julian Day ↔ ISO ---
export function julianDayToISO(jd: number): string {
  const rev = swe.node_swe_revjul(jd, swe.SE_GREG_CAL) as any;
  const { year, month, day, hour } = rev;
  const h = Math.floor(hour);
  const m = Math.floor((hour - h) * 60);
  const s = Math.round(((hour - h) * 60 - m) * 60);
  return DateTime.utc(year, month, day, h, m, s).toISO()!;
}

export function isoToJulianDay(date: Date): number {
  return swe.node_swe_julday(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours() + date.getUTCMinutes() / 60,
    swe.SE_GREG_CAL
  );
}

// VERY IMPORTANT: set Swiss Ephemeris path for house calculations
const EPHE_PATH = path.join(process.cwd(), "ephe");
swe.node_swe_set_ephe_path(EPHE_PATH);

const ZODIAC_SIGNS = [
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
];

// Swiss Ephemeris house system:
// "W" = Whole Sign
// "P" = Placidus
// Change as needed
const HOUSE_SYSTEM: "W" | "P" = "W";

// Improved calculation flags
export const CALC_FLAGS =
  swe.SEFLG_SWIEPH | swe.SEFLG_SPEED;

// If true, compute transit retrogrades & stations (current sky)
const ENABLE_TRANSIT_RETROGRADES = true;

export const PLANETS = [
  { key: "sun", id: swe.SE_SUN },
  { key: "moon", id: swe.SE_MOON },
  { key: "mercury", id: swe.SE_MERCURY },
  { key: "venus", id: swe.SE_VENUS },
  { key: "mars", id: swe.SE_MARS },
  { key: "jupiter", id: swe.SE_JUPITER },
  { key: "saturn", id: swe.SE_SATURN },
  { key: "uranus", id: swe.SE_URANUS },
  { key: "neptune", id: swe.SE_NEPTUNE },
  { key: "pluto", id: swe.SE_PLUTO },
];

const ASPECTS = [
  { name: "conjunction", angle: 0, orb: 8 },
  { name: "sextile", angle: 60, orb: 6 },
  { name: "square", angle: 90, orb: 6 },
  { name: "trine", angle: 120, orb: 6 },
  { name: "opposition", angle: 180, orb: 8 },
];

export interface SignsInput {
  day: number;
  month: number;
  year: number;
  hour: number;
  min: number;
  lat: number;
  lon: number;
  tzone: number;
}

export interface PlanetPosition {
  longitude: number;
  sign: string;
  formatted: string;
  house: number;
  // Natal chart retrograde
  retrograde: boolean;
}

export type AspectType =
  | "conjunction"
  | "sextile"
  | "square"
  | "trine"
  | "opposition";

export interface Aspect {
  planet1: string;
  planet2: string;
  type: AspectType;
  angle: number;
  orb: number;
}

export interface HouseCusp {
  house: number;
  longitude: number;
  sign: string;
  formatted: string;
}

export interface NatalChartResult {
  julianDay: number;
  ascendant: {
    longitude: number;
    sign: string;
    formatted: string;
  };
  houses: HouseCusp[];
  planets: Record<string, PlanetPosition>;
  aspects: Aspect[];
}

export function getZodiacSign(longitude: number) {
  const lon = ((longitude % 360) + 360) % 360;
  return ZODIAC_SIGNS[Math.floor(lon / 30)];
}

export function formatDegree(longitude: number) {
  const lon = ((longitude % 360) + 360) % 360;
  const signIndex = Math.floor(lon / 30);
  const degree = Math.floor(lon % 30);
  const minute = Math.round((lon % 1) * 60);
  const sign = ZODIAC_SIGNS[signIndex];
  return `${sign} ${degree}°${minute.toString().padStart(2, "0")}′`;
}

function angularDistance(a: number, b: number) {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function getWholeSignHouse(planetLongitude: number, ascendantLongitude: number): number {
  const planetSignIndex = Math.floor(((planetLongitude % 360) + 360) % 360 / 30);
  const ascSignIndex = Math.floor(((ascendantLongitude % 360) + 360) % 360 / 30);
  // Calculate house number from 1 to 12
  return ((planetSignIndex - ascSignIndex + 12) % 12) + 1;
}

export async function calculateSignsInternal(
  data: SignsInput
): Promise<NatalChartResult> {
  const day   = Number(data.day);
  const month = Number(data.month);
  const year  = Number(data.year);
  const hour  = Number(data.hour);
  const min   = Number(data.min);
  const lat   = Number(data.lat);
  const lon   = Number(data.lon);
  const tzone = Number(data.tzone);

  const dt = DateTime.fromObject({ year, month, day, hour, minute: min })
    .minus({ hours: tzone });

  const jd = swe.node_swe_julday(
    dt.year,
    dt.month,
    dt.day,
    dt.hour + dt.minute / 60,
    swe.SE_GREG_CAL
  );

  const planetData: Record<string, PlanetPosition> = {};

  // NOTE:
  // - retrograde        → natal chart condition (birth moment)
  // - transitRetrograde → current sky condition (same JD here, future-proof)
  // - retrogradeStart / retrogradeEnd are UT Julian Days

  // Retrograde detection:
  // Swiss Ephemeris provides longitudinal speed in degrees/day
  // speed < 0 => retrograde
  for (const p of PLANETS) {
    const result = swe.node_swe_calc_ut(jd, p.id, CALC_FLAGS) as any;
    const longitude = ((result.longitude % 360) + 360) % 360;
    const speed = result.speed ?? result.longitudeSpeed ?? 0;
    const retrograde = speed < 0;
    const sign = getZodiacSign(longitude);
    planetData[p.key] = {
      longitude,
      sign,
      formatted: formatDegree(longitude),
      house: 0,
      retrograde,
    };
  }

  // Calculate Ascendant longitude using Swiss Ephemeris
  const houses = swe.node_swe_houses_ex2(
    jd,
    CALC_FLAGS,
    lat,
    lon,
    HOUSE_SYSTEM
  ) as any;
  const asc = ((houses.ascendant ?? houses.asc ?? 0) + 360) % 360;
  const risingSign = getZodiacSign(asc);

  for (const key of Object.keys(planetData)) {
    if (houses.house) {
      for (let h = 1; h <= 12; h++) {
        const cuspStart = ((houses.house[h] % 360) + 360) % 360;
        const cuspEnd =
          ((houses.house[h % 12 + 1] % 360) + 360) % 360;

        const lon = planetData[key].longitude;

        const inHouse =
          cuspStart < cuspEnd
            ? lon >= cuspStart && lon < cuspEnd
            : lon >= cuspStart || lon < cuspEnd;

        if (inHouse) {
          planetData[key].house = h;
          break;
        }
      }
    } else {
      planetData[key].house = getWholeSignHouse(
        planetData[key].longitude,
        asc
      );
    }
  }

  const aspects: Aspect[] = [];

  const planetKeys = Object.keys(planetData);

  for (let i = 0; i < planetKeys.length; i++) {
    for (let j = i + 1; j < planetKeys.length; j++) {
      const p1 = planetKeys[i];
      const p2 = planetKeys[j];
      const lon1 = planetData[p1].longitude;
      const lon2 = planetData[p2].longitude;

      const dist = angularDistance(lon1, lon2);

      for (const asp of ASPECTS) {
        const delta = Math.abs(dist - asp.angle);
        if (delta <= asp.orb) {
          aspects.push({
            planet1: p1,
            planet2: p2,
            type: asp.name as AspectType,
            angle: asp.angle,
            orb: Number(delta.toFixed(2)),
          });
          break;
        }
      }
    }
  }

  const housesOutput: HouseCusp[] = [];

  if (houses.house && Array.isArray(houses.house)) {
    // Swiss Ephemeris returns cusps 1–12 at index 1–12
    for (let i = 1; i <= 12; i++) {
      const longitude = ((houses.house[i] % 360) + 360) % 360;
      housesOutput.push({
        house: i,
        longitude,
        sign: getZodiacSign(longitude),
        formatted: formatDegree(longitude),
      });
    }
  } else {
    // Fallback (should rarely happen)
    const ascSignIndex = Math.floor(asc / 30);
    for (let i = 0; i < 12; i++) {
      const houseNumber = i + 1;
      const signIndex = (ascSignIndex + i) % 12;
      const longitude = signIndex * 30;
      housesOutput.push({
        house: houseNumber,
        longitude,
        sign: ZODIAC_SIGNS[signIndex],
        formatted: formatDegree(longitude),
      });
    }
  }

  return {
    julianDay: jd,
    ascendant: {
      longitude: asc,
      sign: risingSign,
      formatted: formatDegree(asc),
    },
    houses: housesOutput,
    planets: planetData,
    aspects,
  };
}