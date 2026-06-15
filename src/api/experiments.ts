import { httpJson } from "@/api/http";
import type { Experiment } from "@/stores/types";

export async function getExperiments(labDay?: number): Promise<Experiment[]> {
  if (labDay) {
    return await httpJson<Experiment[]>(`/api/experiments/?lab_day=${labDay}`);
  }
  return await httpJson<Experiment[]>(`/api/experiments/`);
}
