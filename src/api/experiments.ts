import { httpJson } from "@/api/http";
import type { Experiment, ExperimentCompletion } from "@/stores/types";

export async function getExperiments(labDay?: number): Promise<Experiment[]> {
  if (labDay) {
    return await httpJson<Experiment[]>(`/api/experiments/?lab_day=${labDay}`);
  }
  return await httpJson<Experiment[]>(`/api/experiments/`);
}

export async function getExperimentCompletions(
  labDay: number,
): Promise<ExperimentCompletion[]> {
  return await httpJson<ExperimentCompletion[]>(
    `/api/experiments/completions/?lab_day=${labDay}`,
  );
}

export interface ExperimentCompletionRecord {
  student_id: string;
  experiment_ids: string[];
}

export interface SaveExperimentCompletionsPayload {
  lab_day: number;
  records: ExperimentCompletionRecord[];
}

export async function saveExperimentCompletions(
  payload: SaveExperimentCompletionsPayload,
): Promise<void> {
  return await httpJson<void>(`/api/experiments/completions/bulk/`, {
    method: "POST",
    body: payload,
  });
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
