// functions/src/utils/getSignsCore.ts
import swe from "@hatijs/core";
import { DateTime } from "luxon";

const ZODIAC_SIGNS = [
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces",
];

const getZodiac = (longitude: number) =>
  ZODIAC_SIGNS[Math.floor((longitude % 360) / 30)];

export async function getSignsCore(data: any) {
  const { day, month, year, hour, min, lat, lon, tzone } = data;

  const dt = DateTime.fromObject({ year, month, day, hour, minute: min }).minus({ hours: tzone });
  const jd = swe.node_swe_julday(dt.year, dt.month, dt.day, dt.hour + dt.minute / 60, swe.SE_GREG_CAL);

  const sun = swe.node_swe_calc_ut(jd, swe.SE_SUN, swe.SEFLG_SWIEPH) as any;
  const moon = swe.node_swe_calc_ut(jd, swe.SE_MOON, swe.SEFLG_SWIEPH) as any;
  const houses = swe.node_swe_houses_ex2(jd, swe.SEFLG_SWIEPH, lat, lon, "P") as any;

  const asc = houses.ascendant ?? houses.asc ?? 0;

  return {
    sunSign: getZodiac(sun.longitude),
    moonSign: getZodiac(moon.longitude),
    risingSign: getZodiac(asc),
  };
}
