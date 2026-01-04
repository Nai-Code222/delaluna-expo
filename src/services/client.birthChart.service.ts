import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebaseConfig";

export interface GenerateBirthChartRequest {
  force?: boolean;
}

export interface GenerateBirthChartResponse {
  ok: boolean;
  started: boolean;
  message?: string;
  docPath?: string;
}

export async function requestBirthChartGeneration(
  payload: GenerateBirthChartRequest = {}
): Promise<GenerateBirthChartResponse> {
  const fn = httpsCallable<
    GenerateBirthChartRequest,
    GenerateBirthChartResponse
  >(functions, "generateBirthChart");

  const res = await fn(payload);
  return res.data;
}