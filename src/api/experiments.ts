import { httpJson } from "@/api/http";
import type { Experiment } from "@/stores/types";

export async function getExperiments(labDay?: number): Promise<Experiment[]> {
  if (labDay) {
    return await httpJson<Experiment[]>(`/api/experiments/?lab_day=${labDay}`);
  }
  return await httpJson<Experiment[]>(`/api/experiments/`);
}

export async function deleteExperiment(id: string) {
  return await httpJson<void>(`/api/experiments/${id}/`, {
    method: "DELETE",
  });
}

export async function patchExperiment(id: string, data: Partial<Experiment>) {
  return await httpJson<void>(`/api/experiments/${id}/`, {
    method: "PATCH",
    body: data,
  });
}

export async function postExperiment(data: Omit<Experiment, "id">) {
  return await httpJson<Experiment>(`/api/experiments/`, {
    method: "POST",
    body: data,
  });
}
