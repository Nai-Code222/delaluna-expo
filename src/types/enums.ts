// src/types/enums.ts

export enum ZodiacSign {
  Aries = "Aries",
  Taurus = "Taurus",
  Gemini = "Gemini",
  Cancer = "Cancer",
  Leo = "Leo",
  Virgo = "Virgo",
  Libra = "Libra",
  Scorpio = "Scorpio",
  Sagittarius = "Sagittarius",
  Capricorn = "Capricorn",
  Aquarius = "Aquarius",
  Pisces = "Pisces"
}

export enum AspectType {
  Conjunction = "conjunction",
  Opposition = "opposition",
  Trine = "trine",
  Square = "square",
  Sextile = "sextile",
  Semisextile = "semisextile",
  Quincunx = "quincunx"
}

export enum MoonPhase {
  NewMoon = "New Moon",
  WaxingCrescent = "Waxing Crescent",
  FirstQuarter = "First Quarter",
  WaxingGibbous = "Waxing Gibbous",
  FullMoon = "Full Moon",
  WaningGibbous = "Waning Gibbous",
  LastQuarter = "Last Quarter",
  WaningCrescent = "Waning Crescent"
}

export enum SignupStatus {
  Incomplete = "incomplete",
  Processing = "processing",
  Complete = "complete",
  Error = "error"
}
