// src/services/astro.ts
import {
  AstroTime,
  Body,
  EclipticLongitude,
  Rotation_HOR_EQD,
  Rotation_EQD_ECT,
  RotateVector,
  VectorFromHorizon,
  SphereFromVector,
  Spherical,
  Observer, // use the library's Observer type
} from 'astronomy-engine';

const SIGNS = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces',
] as const;

export type SignDeg = { sign: (typeof SIGNS)[number]; degrees: number };

const norm360 = (x: number) => ((x % 360) + 360) % 360;

export const signFromLongitude = (lonDeg: number): SignDeg => {
  const i = Math.floor(norm360(lonDeg) / 30);
  const degrees = norm360(lonDeg) - i * 30;
  return { sign: SIGNS[i], degrees };
};

/** Ascendant ecliptic longitude (degrees 0–360) */
export const ascendantLongitude = (dateUtc: Date, observer: Observer): number => {
  const time = new AstroTime(dateUtc);

  // Ascendant = due East on the true (unrefracted) horizon: alt=0°, az=90°
  const eastOnHorizon = new Spherical(0, 90, 1);
  const vHor = VectorFromHorizon(eastOnHorizon, time, 'none');

  // Rotate: Horizon -> Equator-of-date -> Ecliptic-of-date
  const vEqd = RotateVector(Rotation_HOR_EQD(time, observer), vHor);
  const vEct = RotateVector(Rotation_EQD_ECT(time), vEqd);

  const { lon } = SphereFromVector(vEct);
  return norm360(lon);
};

export const getBigThree = (dateUtc: Date, observer: Observer) => {
  const sunLon  = EclipticLongitude(Body.Sun,  dateUtc);
  const moonLon = EclipticLongitude(Body.Moon, dateUtc);
  const ascLon  = ascendantLongitude(dateUtc, observer);

  return {
    sun:    signFromLongitude(sunLon),
    moon:   signFromLongitude(moonLon),
    rising: signFromLongitude(ascLon),
    longitudes: { sun: sunLon, moon: moonLon, rising: ascLon },
  };
};

export type { Observer };
export default { signFromLongitude, ascendantLongitude, getBigThree };
