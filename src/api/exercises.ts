import { httpJson } from "@/api/http";
import type { Exercise } from "@/stores/types";

export interface ExerciseCompletionData {
  student: {
    id: string;
    matriculationNumber: string;
  };
  completed: boolean;
  completion_date: Date | null;
  [key: string]: any;
}

export interface SubmitExercisePayload {
  lab_day: number;
  records: SubmitExerciseRecord[];
}
export interface SubmitExerciseRecord {
  student_id: string;
  completed: boolean;
  completion_date: Date | null;
}

export async function getExercises(lab_day: number) {
  return await httpJson<Exercise[]>(`/api/exercises/?lab_day=${lab_day}`);
}

export async function getAllExercises() {
  return await httpJson<Exercise[]>(`/api/exercises/`);
}

export async function deleteExercise(id: string) {
  return await httpJson<void>(`/api/exercises/${id}/`, {
    method: "DELETE",
  });
}

export async function patchExercise(id: string, data: Partial<Exercise>) {
  return await httpJson<void>(`/api/exercises/${id}/`, {
    method: "PATCH",
    body: data,
  });
}

export async function postExercise(data: Omit<Exercise, "id">) {
  // TODO: Remove this once lab day restrictions are in place
  const body = { ...data, lab_day: 0 };
  return await httpJson<Exercise>(`/api/exercises/`, {
    method: "POST",
    body: body,
  });
}

export async function getExerciseStatus(lab_day: number, adminGroup?: string) {
  if (adminGroup) {
    return await httpJson<string[]>(
      `/api/exercise-completions/status/?lab_day=${lab_day}&group=${adminGroup}`,
    );
  }
  return await httpJson<string[]>(
    `/api/exercise-completions/status/?lab_day=${lab_day}`,
  );
}

export async function submitSingleExerciseData(
  lab_day: number,
  student_id: string,
  completed: boolean,
) {
  return await httpJson<Record<string, any>>(
    "/api/exercise-completions/upsert/",
    {
      method: "POST",
      body: {
        lab_day: lab_day,
        student_id: student_id,
        completed: completed,
      },
    },
  );
}
