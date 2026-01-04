import { Timestamp } from "firebase-admin/firestore";

/**
 * Firestore document schema for:
 * users/{uid}/birthChart/default
 */

export type BirthChartStatusState = "processing" | "complete" | "error";
export type BirthChartStatusStep = "svg" | "free" | "premium" | "done";

export interface BirthChartStatus {
  state: BirthChartStatusState;
  step: BirthChartStatusStep;
  updatedAt: Timestamp;
}

export interface BirthChartSvgAsset {
  storagePath: string;
  downloadUrl: string;
  contentType: "image/svg+xml";
  sizeBytes: number;
}

export interface BirthChartInterpretation {
  text: string;
  createdAt: Timestamp;
}

export interface BirthChartError {
  message: string;
  code: string;
}

export interface BirthChartSource {
  natalChartDocPath: string;
  generatedFrom: string; // e.g. "callable:generateBirthChart"
  model: string;         // e.g. "gemini-2.5-flash"
}

export interface BirthChartFirestoreDoc {
  status: BirthChartStatus;

  svg?: BirthChartSvgAsset;

  free?: BirthChartInterpretation;
  premium?: BirthChartInterpretation;

  premiumUnlocked: boolean;
  requestedAt?: Timestamp;
  completedAt?: Timestamp;

  error?: BirthChartError;

  source: BirthChartSource;
}
