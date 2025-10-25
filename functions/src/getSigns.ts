import * as functions from "firebase-functions";
import { DateTime } from "luxon";
import { Ephemeris } from "ephemeris";

// Match your existing API's parameter structure
interface SignRequest {
  day: number;
  month: number;
  year: number;
  hour: number;
  min: number;
  lat: number;
  lon: number;
  tzone: number; // timezone offset in hours (e.g., -5 for CST)
}

export const getSigns = functions.https.onCall(
  async (request: functions.https.CallableRequest<SignRequest>) => {
    const { day, month, year, hour, min, lat, lon, tzone } = request.data;

    try {
      // Create a Luxon DateTime using the given values
      const dt = DateTime.fromObject({
        year,
        month,
        day,
        hour,
        minute: min,
      }).minus({ hours: tzone }); // convert to UTC

      const dateUTC = dt.toJSDate();

      // Use Ephemeris to calculate planets and ascendant
      const eph = new Ephemeris(dateUTC);
      const planets = eph.getAllPlanets();

      const sunLongitude = planets.sun.apparentLongitude;
      const moonLongitude = planets.moon.apparentLongitude;
      const ascendant = eph.getAscendant(lat, lon).longitude;

      const signs = [
        "Aries","Taurus","Gemini","Cancer",
        "Leo","Virgo","Libra","Scorpio",
        "Sagittarius","Capricorn","Aquarius","Pisces",
      ];
      const getSign = (longitude: number) => signs[Math.floor((longitude % 360) / 30)];

      const sunSign = getSign(sunLongitude);
      const moonSign = getSign(moonLongitude);
      const risingSign = getSign(ascendant);

      return { sunSign, moonSign, risingSign };
    } catch (err) {
      console.error("Error calculating signs:", err);
      throw new functions.https.HttpsError("internal", "Failed to calculate signs");
    }
  }
);
