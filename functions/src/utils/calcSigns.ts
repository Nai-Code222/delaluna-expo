import swe from "@hatijs/core";
import { DateTime } from "luxon";

const ZODIAC_SIGNS = [
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
];

const PLANETS = [
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

function getHouseForLongitude(longitude: number, cusps: number[]) {
  const lon = (longitude + 360) % 360;
  for (let i = 0; i < 12; i++) {
    const start = (cusps[i] + 360) % 360;
    const end = (cusps[(i + 1) % 12] + 360) % 360;

    if (start < end) {
      if (lon >= start && lon < end) return i + 1;
    } else {
      if (lon >= start || lon < end) return i + 1;
    }
  }
  return 12;
}

function angularDistance(a: number, b: number) {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
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

  for (const p of PLANETS) {
    const result = swe.node_swe_calc_ut(jd, p.id, swe.SEFLG_SWIEPH) as any;
    const longitude = ((result.longitude % 360) + 360) % 360;
    const sign = getZodiacSign(longitude);

    planetData[p.key] = {
      longitude,
      sign,
      formatted: formatDegree(longitude),
      house: 0,
    };
  }

  const houses = swe.node_swe_houses_ex2(
    jd,
    swe.SEFLG_SWIEPH,
    lat,
    lon,
    "P"
  ) as any;

  const houseCusps: number[] = [];
  for (let i = 1; i <= 12; i++) {
    houseCusps.push(((houses.cusps?.[i] ?? 0) + 360) % 360);
  }

  const asc = ((houses.ascendant ?? houses.asc ?? 0) + 360) % 360;
  const risingSign = getZodiacSign(asc);

  for (const key of Object.keys(planetData)) {
    planetData[key].house = getHouseForLongitude(
      planetData[key].longitude,
      houseCusps
    );
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

  return {
    julianDay: jd,
    ascendant: {
      longitude: asc,
      sign: risingSign,
      formatted: formatDegree(asc),
    },
    houses: houseCusps.map((lon, idx) => ({
      house: idx + 1,
      longitude: lon,
      sign: getZodiacSign(lon),
      formatted: formatDegree(lon),
    })),
    planets: planetData,
    aspects,
  };
}
