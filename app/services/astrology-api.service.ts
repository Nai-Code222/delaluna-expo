import { encode as btoa } from "base-64";

const USER_ID = "644956";
const API_KEY = "7e11de09366e16fa640ce44570f0cc6028a24c6e";
const BASE_URL = "https://json.astrologyapi.com/v1";

/** Fetch Sun, Moon, and Ascendant (Rising) Signs directly via AstrologyAPI */
export async function getAstroSigns(params: {
  day: number;
  month: number;
  year: number;
  hour: number;
  min: number;
  lat: number;
  lon: number;
  tzone: number;
}) {
  const authHeader = "Basic " + btoa(`${USER_ID}:${API_KEY}`);

  const res = await fetch(`https://json.astrologyapi.com/v1/planets/tropical`, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("AstrologyAPI error:", res.status, text);
    throw new Error(`AstrologyAPI request failed (${res.status})`);
  }

  const data = await res.json();

  console.log("AstrologyAPI success:", data);

  return {
    sunSign: data.sun?.sign ?? null,
    moonSign: data.moon?.sign ?? null,
    risingSign: data.ascendant?.sign ?? null,
  };
}
