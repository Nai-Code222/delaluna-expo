export interface CompatibilityScores {
  interest: number;
  communication: number;
  resonation: number;
  loyalty: number;
  attraction: number;
  empathy: number;
  reasoning: number;
  persuasion: number;
  stubbornness: number;
  ego: number;
  sacrifice: number;
  desire: number;
  adaptability: number;
  responsibility: number;
  accountability: number;
  hostility: number;
}

export interface CompatibilityResponse {
  title: string;
  summary: string;
  overallCompatibility: number;
  userPronouns: string;
  partnerPronouns: string;
  scores: CompatibilityScores;
  closing: string;
  createdAt: string;
}

export interface CompatibilityInput {
  partnerPronouns: string;
  userPronouns: string;
  userSun: string;
  userMoon: string;
  userRising: string;
  partnerSun: string;
  partnerMoon: string;
  partnerRising: string;
  relationshipType: string;
}
