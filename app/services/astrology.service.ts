import { Buffer } from "buffer";

const USER_ID = "your_astrologyapi_userid";
const API_KEY = "your_astrologyapi_key";

/** Fetch Sun, Moon, Rising from AstrologyAPI */
export default async function fetchSignsFromAPI(
  day: number,
  month: number,
  year: number,
  hour: number,
  min: number,
  lat: number,
  lon: number,
  tZoneOffset: number
) {
  const authHeader = Buffer.from(`${USER_ID}:${API_KEY}`).toString("base64");

  const response = await fetch("https://json.astrologyapi.com/v1/natal_chart", {
    method: "POST",
    headers: {
      Authorization: `Basic ${authHeader}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      day,
      month,
      year,
      hour,
      min,
      lat,
      lon,
      tzone: tZoneOffset, // ✅ API expects this key
    }),
  });

  if (!response.ok) {
    console.error("AstrologyAPI error:", response.status, await response.text());
    throw new Error("Failed to fetch signs from AstrologyAPI");
  }

  const data = await response.json();

  return {
    sunSign: data.planets?.find((p: any) => p.name === "Sun")?.sign ?? null,
    moonSign: data.planets?.find((p: any) => p.name === "Moon")?.sign ?? null,
    risingSign: data.ascendant ?? null,
  };
}
