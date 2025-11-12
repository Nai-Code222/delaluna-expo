// src/utils/answers.helpers.ts
export const DEFAULT_PLACE = {
    label: "Greenwich, London, United Kingdom",
    lat: 51.4779,
    lon: 0.0015,
    timezone: "Europe/London",
};

export const defaultNoon = (() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
})();

export const isIDK = (s?: string | null) => {
    const t = (s || "").trim().toLowerCase();
    return t === "i don't know" || t === "i don’t know";
};

export const applyUnknownPlace = (person: Record<string, any>) => ({
    ...person,
    "Place of Birth": DEFAULT_PLACE.label,
    birthLat: DEFAULT_PLACE.lat,
    birthLon: DEFAULT_PLACE.lon,
    birthTimezone: DEFAULT_PLACE.timezone,
    isPlaceOfBirthUnknown: true,
});

export const applyUnknownTime = (person: Record<string, any>) => ({
    ...person,
    "Time of Birth": "12:00",
    isBirthTimeUnknown: true,
});
