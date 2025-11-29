// app/services/astrology-api.service.ts
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
  const FUNCTION_URL =
    "https://us-central1-delaluna-answers.cloudfunctions.net/getSignsHttp";

  try {
    console.log("🔮 Fetching astrology signs (HTTP):", params);

    const res = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    const { summary, raw } = data;
    console.log("✅ Received:", summary);

    return {
      sunSign: raw.sun.sign.trim(" "),
      moonSign: raw.moon.sign.trim(" "),
      risingSign: raw.ascendant.sign.trim(" "),
    };
  } catch (error: any) {
    console.error("🔥 Error fetching signs (HTTP):", error);
    throw new Error("Failed to calculate astrological signs");
  }
}
