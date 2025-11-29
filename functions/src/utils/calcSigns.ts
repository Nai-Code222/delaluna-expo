import swe from "@hatijs/core";
import { DateTime } from "luxon";

const ZODIAC_SIGNS = [
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
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

export function getZodiacSign(longitude: number) {
  return ZODIAC_SIGNS[Math.floor((longitude % 360) / 30)];
}

export function formatDegree(longitude: number) {
  const signIndex = Math.floor((longitude % 360) / 30);
  const degree = Math.floor(longitude % 30);
  const minute = Math.round((longitude % 1) * 60);
  const sign = ZODIAC_SIGNS[signIndex];
  return `${sign} ${degree}°${minute.toString().padStart(2, "0")}′`;
}


export async function calculateSignsInternal(data: SignsInput) {
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

  const sun  = swe.node_swe_calc_ut(jd, swe.SE_SUN, swe.SEFLG_SWIEPH) as any;
  const moon = swe.node_swe_calc_ut(jd, swe.SE_MOON, swe.SEFLG_SWIEPH) as any;
  const houses = swe.node_swe_houses_ex2(
    jd,
    swe.SEFLG_SWIEPH,
    lat,
    lon,
    "P"
  ) as any;

  const asc = houses.ascendant ?? houses.asc ?? 0;

  const sunSign = getZodiacSign(sun.longitude);
  const moonSign = getZodiacSign(moon.longitude);
  const risingSign = getZodiacSign(asc);

  return {
    julianDay: jd,
    summary: {
      sun: sunSign,
      moon: moonSign,
      rising: risingSign,
    },
    raw: {
      sun: { longitude: sun.longitude, sign: sunSign },
      moon: { longitude: moon.longitude, sign: moonSign },
      ascendant: { longitude: asc, sign: risingSign },
    },
  };
}
