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

export async function getExerciseStatus(lab_day: number) {
  return await httpJson<string[]>(
    `/api/exercise-completions/status/?lab_day=${lab_day}`,
  );
}

export async function submitSingleExerciseData(
  lab_day: number,
  student_id: string,
  completed: boolean,
) {
  return await httpJson<Record<string, any>>("/api/exercises/completions/", {
    method: "POST",
    body: {
      lab_day: lab_day,
      student_id: student_id,
      completed: completed,
    },
  });
}
